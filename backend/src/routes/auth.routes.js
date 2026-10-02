const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');
const { authenticateToken, authorizeRoles, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/login
 * Authenticates user credentials, generates JWT token, logs login audit event.
 */
router.post('/login', (req, res) => {
  try {
    const { username, password, passkey } = req.body;

    // Validate inputs (Username, Password, and Security Passkey are all required)
    if (!username || !password || !passkey) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Username, password, and security passkey are all required.'
      });
    }

    // Query user by username
    const user = db.prepare(`
      SELECT id, username, password_hash, passkey, role, full_name, email, is_active 
      FROM users 
      WHERE username = ?
    `).get(username.trim());

    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid username, password, or security passkey.'
      });
    }

    // Verify account active status
    if (!user.is_active) {
      return res.status(403).json({
        error: 'Account deactivated',
        message: 'This account has been deactivated. Please contact the Chief Pharmacist.'
      });
    }

    // Verify security passkey
    if (!user.passkey || user.passkey.trim() !== String(passkey).trim()) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid security passkey. Access denied.'
      });
    }

    // Verify password hash
    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid username, password, or security passkey.'
      });
    }

    // Generate JWT Token (valid for 12 hours)
    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '12h' });

    // Record login in audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, resource, details)
      VALUES (?, 'LOGIN', 'auth', ?)
    `).run(user.id, `User logged in from IP: ${req.ip || '127.0.0.1'}`);

    // Return safe user object (omit password_hash) and token
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/auth/logout
 * Logs the logout event to audit log and confirms logout.
 */
router.post('/logout', authenticateToken, (req, res) => {
  try {
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, resource, details)
      VALUES (?, 'LOGOUT', 'auth', 'User logged out')
    `).run(req.user.id);

    res.json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/auth/me
 * Retrieves current verified profile.
 */
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, username, role, full_name, email, is_active, created_at
      FROM users
      WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Protected test endpoint: Only accessible by users with role 'admin'
 */
router.get('/admin-only', authenticateToken, authorizeRoles('admin'), (req, res) => {
  res.json({
    message: 'Authorized: You have accessed the Admin-only protected zone.',
    user: req.user
  });
});

/**
 * Protected test endpoint: Only accessible by users with role 'cashier'
 */
router.get('/cashier-only', authenticateToken, authorizeRoles('cashier'), (req, res) => {
  res.json({
    message: 'Authorized: You have accessed the Cashier-only protected zone.',
    user: req.user
  });
});

/**
 * GET /api/auth/staff-passkeys
 * Admin only: View staff passkeys and access credentials.
 */
router.get('/staff-passkeys', authenticateToken, authorizeRoles('admin'), (req, res) => {
  try {
    const staff = db.prepare(`
      SELECT id, username, role, full_name, email, passkey, is_active, created_at 
      FROM users 
      ORDER BY role ASC, id ASC
    `).all();

    res.json({ staff });
  } catch (error) {
    console.error('Error fetching staff passkeys:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/update-passkey
 * Updates the passkey for a user (Admin can update any staff, staff can update own).
 */
router.post('/update-passkey', authenticateToken, (req, res) => {
  try {
    const { user_id, new_passkey } = req.body;
    const targetUserId = user_id ? Number(user_id) : req.user.id;

    if (targetUserId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only the Chief Pharmacist (Admin) can change other staff passkeys.'
      });
    }

    if (!new_passkey || !String(new_passkey).trim()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'New passkey cannot be empty.'
      });
    }

    db.prepare(`
      UPDATE users 
      SET passkey = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(String(new_passkey).trim(), targetUserId);

    db.prepare(`
      INSERT INTO audit_logs (user_id, action, resource, resource_id, details)
      VALUES (?, 'PASSKEY_MODIFIED', 'users', ?, ?)
    `).run(req.user.id, String(targetUserId), `Passkey updated for user ID #${targetUserId}`);

    res.json({
      message: 'Security passkey updated successfully.'
    });
  } catch (error) {
    console.error('Error updating passkey:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/auth/profile
 * Allows logged-in user (including Admin) to update their own full name, passkey, or password.
 */
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { full_name, passkey, password } = req.body;

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ error: 'Validation failed', message: 'Full name is required.' });
    }

    const updates = ['full_name = ?'];
    const params = [full_name.trim()];

    if (passkey && String(passkey).trim()) {
      updates.push('passkey = ?');
      params.push(String(passkey).trim());
    }

    if (password && String(password).trim()) {
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password.trim(), salt);
      updates.push('password_hash = ?');
      params.push(passwordHash);
    }

    updates.push("updated_at = datetime('now', 'localtime')");
    params.push(req.user.id);

    db.prepare(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...params);

    const updatedUser = db.prepare(`
      SELECT id, username, role, full_name, email, passkey, is_active
      FROM users WHERE id = ?
    `).get(req.user.id);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, resource, resource_id, details)
      VALUES (?, 'PROFILE_UPDATED', 'users', ?, ?)
    `).run(req.user.id, String(req.user.id), `User updated own profile: ${full_name.trim()}`);

    res.json({
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/staff
 * Admin only: Add a new staff member.
 */
router.post('/staff', authenticateToken, authorizeRoles('admin'), (req, res) => {
  try {
    const { full_name, username, password, role, passkey, email } = req.body;

    if (!full_name || !username || !password || !role || !passkey) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Full name, username, password, role, and security passkey are required.'
      });
    }

    if (!['admin', 'cashier'].includes(role)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: "Role must be either 'admin' or 'cashier'."
      });
    }

    // Check username uniqueness
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
    if (existing) {
      return res.status(409).json({
        error: 'Duplicate username',
        message: `Username '${username.trim()}' is already taken.`
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password.trim(), salt);

    const result = db.prepare(`
      INSERT INTO users (username, password_hash, passkey, role, full_name, email, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(
      username.trim(),
      passwordHash,
      String(passkey).trim(),
      role,
      full_name.trim(),
      email ? email.trim() : null
    );

    db.prepare(`
      INSERT INTO audit_logs (user_id, action, resource, resource_id, details)
      VALUES (?, 'STAFF_CREATED', 'users', ?, ?)
    `).run(req.user.id, String(result.lastInsertRowid), `Admin added staff member ${full_name.trim()} (@${username.trim()})`);

    const newStaff = db.prepare(`
      SELECT id, username, role, full_name, email, passkey, is_active, created_at
      FROM users WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Staff member added successfully.',
      staff: newStaff
    });
  } catch (error) {
    console.error('Error adding staff member:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/auth/staff/:id
 * Admin only: Edit staff member details (name, username, role, passkey, password, active status).
 */
router.put('/staff/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const { full_name, username, role, passkey, is_active, password, email } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if changing username and whether it conflicts
    if (username && username.trim() !== user.username) {
      const conflict = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username.trim(), targetId);
      if (conflict) {
        return res.status(409).json({
          error: 'Duplicate username',
          message: `Username '${username.trim()}' is already in use by another account.`
        });
      }
    }

    // Prevent deactivating or demoting the last active admin
    if (user.role === 'admin' && (role === 'cashier' || is_active === 0)) {
      const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = 1").get().count;
      if (adminCount <= 1) {
        return res.status(400).json({
          error: 'Operation restricted',
          message: 'Cannot demote or deactivate the sole remaining Chief Pharmacist (Admin) account.'
        });
      }
    }

    const updates = [];
    const params = [];

    if (full_name !== undefined) {
      updates.push('full_name = ?');
      params.push(full_name.trim());
    }

    if (username !== undefined) {
      updates.push('username = ?');
      params.push(username.trim());
    }

    if (role !== undefined && ['admin', 'cashier'].includes(role)) {
      updates.push('role = ?');
      params.push(role);
    }

    if (passkey !== undefined && String(passkey).trim()) {
      updates.push('passkey = ?');
      params.push(String(passkey).trim());
    }

    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email ? email.trim() : null);
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (password && String(password).trim()) {
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password.trim(), salt);
      updates.push('password_hash = ?');
      params.push(passwordHash);
    }

    updates.push("updated_at = datetime('now', 'localtime')");
    params.push(targetId);

    db.prepare(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...params);

    db.prepare(`
      INSERT INTO audit_logs (user_id, action, resource, resource_id, details)
      VALUES (?, 'STAFF_UPDATED', 'users', ?, ?)
    `).run(req.user.id, String(targetId), `Admin updated details for staff ID #${targetId}`);

    const updated = db.prepare(`
      SELECT id, username, role, full_name, email, passkey, is_active, created_at, updated_at
      FROM users WHERE id = ?
    `).get(targetId);

    res.json({
      message: 'Staff member updated successfully.',
      staff: updated
    });
  } catch (error) {
    console.error('Error updating staff member:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/auth/staff/:id
 * Admin only: Delete staff member account.
 */
router.delete('/staff/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  try {
    const targetId = Number(req.params.id);

    // Prevent deleting own account
    if (targetId === req.user.id) {
      return res.status(400).json({
        error: 'Operation restricted',
        message: 'You cannot delete your own logged-in administrator account.'
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting last admin
    if (user.role === 'admin') {
      const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = 1").get().count;
      if (adminCount <= 1) {
        return res.status(400).json({
          error: 'Operation restricted',
          message: 'Cannot delete the sole remaining Chief Pharmacist (Admin) account.'
        });
      }
    }

    // Check if user has associated sales
    const salesCount = db.prepare('SELECT COUNT(*) as count FROM sales WHERE cashier_id = ?').get(targetId).count;

    if (salesCount > 0) {
      // Deactivate rather than hard-delete to maintain relational foreign key integrity
      db.prepare("UPDATE users SET is_active = 0, updated_at = datetime('now', 'localtime') WHERE id = ?").run(targetId);
      db.prepare(`
        INSERT INTO audit_logs (user_id, action, resource, resource_id, details)
        VALUES (?, 'STAFF_DEACTIVATED', 'users', ?, ?)
      `).run(req.user.id, String(targetId), `Admin deactivated staff member ${user.full_name} (${user.username}) due to historical sales records.`);

      return res.json({
        message: `Staff member ${user.full_name} has historical sales and was safely deactivated instead of deleted.`
      });
    }

    // Hard delete if no sales records
    db.prepare('DELETE FROM users WHERE id = ?').run(targetId);
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, resource, resource_id, details)
      VALUES (?, 'STAFF_DELETED', 'users', ?, ?)
    `).run(req.user.id, String(targetId), `Admin deleted staff member ${user.full_name} (${user.username})`);

    res.json({
      message: `Staff member ${user.full_name} (@${user.username}) deleted successfully.`
    });
  } catch (error) {
    console.error('Error deleting staff member:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
