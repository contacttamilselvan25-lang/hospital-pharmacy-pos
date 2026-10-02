const express = require('express');
const db = require('../db/connection');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/inventory
 * Retrieves inventory batches joined with medicine details.
 * Supports search (name, generic name, batch number) and filtering.
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const { search, form, alert_type } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const todayDate = new Date();
    const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let query = `
      SELECT 
        b.id as batch_id,
        b.medicine_id,
        m.name as medicine_name,
        m.generic_name,
        m.brand_name,
        m.strength,
        m.dosage_form,
        m.unit_of_measure,
        m.manufacturer,
        m.reorder_level,
        m.critical_level,
        b.batch_number,
        b.expiry_date,
        b.quantity,
        b.purchase_price,
        b.selling_price,
        b.status as batch_status
      FROM inventory_batches b
      JOIN medicines m ON b.medicine_id = m.id
      WHERE b.status = 'active' AND m.is_active = 1
    `;

    const params = [];

    if (search && search.trim() !== '') {
      query += ` AND (m.name LIKE ? OR m.generic_name LIKE ? OR b.batch_number LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (form && form !== 'ALL') {
      query += ` AND m.dosage_form = ?`;
      params.push(form);
    }

    query += ` ORDER BY m.name ASC, b.expiry_date ASC`;

    const rawRows = db.prepare(query).all(...params);

    // Compute status flags and days remaining for each item
    const inventory = rawRows.map(row => {
      const expDate = new Date(row.expiry_date);
      const diffTime = expDate - todayDate;
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let status = 'NORMAL';
      let statusColor = '#10b981';

      if (row.expiry_date <= today) {
        status = 'EXPIRED';
        statusColor = '#ef4444';
      } else if (row.quantity <= row.critical_level) {
        status = 'CRITICAL';
        statusColor = '#dc2626';
      } else if (row.quantity <= row.reorder_level) {
        status = 'LOW';
        statusColor = '#f59e0b';
      } else if (row.expiry_date <= in90Days) {
        status = 'NEAR_EXPIRY';
        statusColor = '#f97316';
      }

      return {
        ...row,
        calculatedStatus: status,
        statusColor,
        daysRemaining
      };
    });

    // Optional alert_type filtering
    const filtered = alert_type && alert_type !== 'ALL'
      ? inventory.filter(item => item.calculatedStatus === alert_type)
      : inventory;

    res.json({
      total: filtered.length,
      inventory: filtered
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/inventory/medicines
 * Admin only: Adds a new medicine master record.
 */
router.post('/medicines', authenticateToken, authorizeRoles('admin'), (req, res) => {
  try {
    const {
      name,
      generic_name,
      brand_name,
      strength,
      dosage_form,
      unit_of_measure,
      manufacturer,
      reorder_level,
      critical_level,
      batch_number,
      expiry_date,
      quantity,
      purchase_price,
      selling_price
    } = req.body;

    // Validation
    if (!name || !generic_name || !strength || !dosage_form) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Name, generic name, strength, and dosage form are required fields.'
      });
    }

    const reorder = Number(reorder_level) || 50;
    const critical = Number(critical_level) || 15;

    if (critical > reorder) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Critical stock level cannot be greater than reorder level.'
      });
    }

    let medicineId = null;
    let batchId = null;

    db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO medicines (
          name, generic_name, brand_name, strength, dosage_form, 
          unit_of_measure, manufacturer, reorder_level, critical_level
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        name.trim(),
        generic_name.trim(),
        brand_name ? brand_name.trim() : null,
        strength.trim(),
        dosage_form.trim(),
        unit_of_measure ? unit_of_measure.trim() : 'strip',
        manufacturer ? manufacturer.trim() : null,
        reorder,
        critical
      );

      medicineId = result.lastInsertRowid;

      // Automatically create the initial batch so the medicine immediately appears in the inventory!
      const initialQty = quantity !== undefined ? Math.max(0, parseInt(quantity, 10) || 0) : 50;
      const bNumber = batch_number && batch_number.trim() 
        ? batch_number.trim().toUpperCase() 
        : `BATCH-${Date.now().toString().slice(-6)}`;
      const expDate = expiry_date && expiry_date.trim() 
        ? expiry_date.trim() 
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const pPrice = Number(purchase_price) || 10.0;
      const sPrice = Number(selling_price) || 15.0;

      const insertBatch = db.prepare(`
        INSERT INTO inventory_batches (
          medicine_id, batch_number, expiry_date, quantity, purchase_price, selling_price, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'active')
      `);

      const batchResult = insertBatch.run(
        medicineId,
        bNumber,
        expDate,
        initialQty,
        pPrice,
        sPrice
      );

      batchId = batchResult.lastInsertRowid;

      // Record stock movement if initialQty > 0
      if (initialQty > 0) {
        db.prepare(`
          INSERT INTO stock_movements (
            batch_id, movement_type, quantity_change, previous_quantity, 
            new_quantity, reference_id, reason, user_id
          ) VALUES (?, 'STOCK_RECEIVED', ?, 0, ?, 'INITIAL-STOCK', 'Initial Inventory Creation', ?)
        `).run(batchId, initialQty, initialQty, req.user.id);
      }

      // Log in audit trail
      db.prepare(`
        INSERT INTO audit_logs (user_id, action, resource, resource_id, details)
        VALUES (?, 'MEDICINE_CREATED', 'medicines', ?, ?)
      `).run(req.user.id, String(medicineId), `Created medicine: ${name} (${strength}) with initial batch ${bNumber} (qty: ${initialQty})`);
    })();

    res.status(201).json({
      message: 'Medicine master record and initial inventory batch created successfully',
      medicine_id: medicineId,
      batch_id: batchId
    });
  } catch (error) {
    console.error('Error creating medicine:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/inventory/batches
 * Admin only: Adds a new batch to an existing medicine with initial stock.
 */
router.post('/batches', authenticateToken, authorizeRoles('admin'), (req, res) => {
  try {
    const {
      medicine_id,
      batch_number,
      expiry_date,
      quantity,
      purchase_price,
      selling_price
    } = req.body;

    if (!medicine_id || !batch_number || !expiry_date) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Medicine ID, batch number, and expiry date are required.'
      });
    }

    const qty = Math.max(0, parseInt(quantity, 10) || 0);
    const purchase = parseFloat(purchase_price) || 0.0;
    const selling = parseFloat(selling_price) || 0.0;

    let batchId = null;

    db.transaction(() => {
      const insertBatch = db.prepare(`
        INSERT INTO inventory_batches (
          medicine_id, batch_number, expiry_date, quantity, purchase_price, selling_price, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'active')
      `);

      const result = insertBatch.run(
        medicine_id,
        batch_number.trim().toUpperCase(),
        expiry_date,
        qty,
        purchase,
        selling
      );

      batchId = result.lastInsertRowid;

      // Record stock movement if initial quantity > 0
      if (qty > 0) {
        db.prepare(`
          INSERT INTO stock_movements (
            batch_id, movement_type, quantity_change, previous_quantity, 
            new_quantity, reference_id, reason, user_id
          ) VALUES (?, 'STOCK_RECEIVED', ?, 0, ?, 'INITIAL-RECEIVE', 'New Batch Setup', ?)
        `).run(batchId, qty, qty, req.user.id);
      }

      // Record audit log
      db.prepare(`
        INSERT INTO audit_logs (user_id, action, resource, resource_id, details)
        VALUES (?, 'BATCH_CREATED', 'inventory_batches', ?, ?)
      `).run(req.user.id, String(batchId), `Added batch ${batch_number} for medicine #${medicine_id}, qty: ${qty}`);
    })();

    res.status(201).json({
      message: 'Batch added successfully',
      batch_id: batchId
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        error: 'Duplicate batch',
        message: 'A batch with this number already exists for this medicine.'
      });
    }
    console.error('Error adding batch:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/inventory/stock-adjustment
 * Admin only: Adds new stock shipment or performs manual adjustment with mandatory reason.
 */
router.post('/stock-adjustment', authenticateToken, authorizeRoles('admin'), (req, res) => {
  try {
    const { batch_id, change_quantity, movement_type, reason } = req.body;

    if (!batch_id || change_quantity === undefined || !reason || !reason.trim()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Batch ID, quantity change, and a valid reason are mandatory for stock adjustments.'
      });
    }

    const changeQty = parseInt(change_quantity, 10);
    if (isNaN(changeQty) || changeQty === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Quantity change must be a non-zero integer.'
      });
    }

    let updatedBatch = null;

    db.transaction(() => {
      // 1. Fetch current batch
      const currentBatch = db.prepare(`
        SELECT b.*, m.name as medicine_name
        FROM inventory_batches b
        JOIN medicines m ON b.medicine_id = m.id
        WHERE b.id = ?
      `).get(batch_id);

      if (!currentBatch) {
        throw new Error('Batch not found');
      }

      const prevQty = currentBatch.quantity;
      const newQty = prevQty + changeQty;

      if (newQty < 0) {
        throw new Error(`Insufficient stock. Current stock is ${prevQty}, cannot reduce by ${Math.abs(changeQty)}.`);
      }

      // 2. Determine movement type
      let type = movement_type;
      if (!type) {
        if (changeQty > 0) {
          type = 'STOCK_RECEIVED';
        } else {
          type = 'ADJUSTMENT_OUT';
        }
      }

      // 3. Update batch quantity
      db.prepare(`
        UPDATE inventory_batches
        SET quantity = ?, updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(newQty, batch_id);

      // 4. Create stock movement record
      db.prepare(`
        INSERT INTO stock_movements (
          batch_id, movement_type, quantity_change, previous_quantity,
          new_quantity, reference_id, reason, user_id
        ) VALUES (?, ?, ?, ?, ?, 'MANUAL-ADJ', ?, ?)
      `).run(batch_id, type, changeQty, prevQty, newQty, reason.trim(), req.user.id);

      // 5. Create audit log
      db.prepare(`
        INSERT INTO audit_logs (user_id, action, resource, resource_id, details)
        VALUES (?, 'STOCK_ADJUSTED', 'inventory_batches', ?, ?)
      `).run(req.user.id, String(batch_id), `${type}: ${changeQty > 0 ? `+${changeQty}` : changeQty} units. Reason: ${reason}. (Previous: ${prevQty} -> New: ${newQty})`);

      updatedBatch = {
        batch_id,
        medicine_name: currentBatch.medicine_name,
        previous_quantity: prevQty,
        new_quantity: newQty,
        change: changeQty
      };
    })();

    res.json({
      message: 'Stock adjusted successfully',
      batch: updatedBatch
    });
  } catch (error) {
    console.error('Stock adjustment error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/inventory/movements
 * Returns complete stock movement audit history.
 */
router.get('/movements', authenticateToken, (req, res) => {
  try {
    const movements = db.prepare(`
      SELECT 
        sm.id,
        sm.batch_id,
        sm.movement_type,
        sm.quantity_change,
        sm.previous_quantity,
        sm.new_quantity,
        sm.reference_id,
        sm.reason,
        sm.created_at,
        b.batch_number,
        m.name as medicine_name,
        u.username,
        u.full_name as user_full_name
      FROM stock_movements sm
      JOIN inventory_batches b ON sm.batch_id = b.id
      JOIN medicines m ON b.medicine_id = m.id
      JOIN users u ON sm.user_id = u.id
      ORDER BY sm.id DESC
      LIMIT 100
    `).all();

    res.json({
      total: movements.length,
      movements
    });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/inventory/batches/:id
 * Admin only: Deletes/deactivates a medicine batch from inventory.
 */
router.delete('/batches/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  try {
    const batchId = parseInt(req.params.id, 10);
    if (!batchId || isNaN(batchId)) {
      return res.status(400).json({ error: 'Validation failed', message: 'Valid Batch ID is required.' });
    }

    const batch = db.prepare(`
      SELECT b.*, m.name as medicine_name 
      FROM inventory_batches b
      JOIN medicines m ON b.medicine_id = m.id
      WHERE b.id = ?
    `).get(batchId);

    if (!batch) {
      return res.status(404).json({ error: 'Not found', message: 'Medicine batch not found.' });
    }

    // Check if there are sales transactions linked to this batch
    const saleCount = db.prepare(`SELECT COUNT(*) as count FROM sale_items WHERE batch_id = ?`).get(batchId).count;

    db.transaction(() => {
      if (saleCount > 0) {
        // If sales exist, soft-archive the batch to preserve patient receipts & invoice records
        db.prepare(`UPDATE inventory_batches SET status = 'archived', quantity = 0, updated_at = datetime('now', 'localtime') WHERE id = ?`).run(batchId);
        db.prepare(`
          INSERT INTO stock_movements (
            batch_id, movement_type, quantity_change, previous_quantity, new_quantity, reference_id, reason, user_id
          ) VALUES (?, 'EXPIRED_REMOVAL', ?, ?, 0, 'DELETED', 'Archived by Admin', ?)
        `).run(batchId, -batch.quantity, batch.quantity, req.user.id);
      } else {
        // If no sales exist, delete stock movements and the batch record cleanly
        db.prepare(`DELETE FROM stock_movements WHERE batch_id = ?`).run(batchId);
        db.prepare(`DELETE FROM inventory_batches WHERE id = ?`).run(batchId);
      }

      // Record in audit log
      db.prepare(`
        INSERT INTO audit_logs (user_id, action, resource, resource_id, details)
        VALUES (?, 'BATCH_DELETED', 'inventory_batches', ?, ?)
      `).run(req.user.id, String(batchId), `Admin deleted medicine batch: "${batch.medicine_name}" (Batch ${batch.batch_number})`);
    })();

    res.json({
      message: `Medicine batch "${batch.medicine_name}" (Batch ${batch.batch_number}) deleted successfully.`
    });
  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;
