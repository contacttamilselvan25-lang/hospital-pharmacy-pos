const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'pharmacy_default_secret_key_change_in_production';

/**
 * Middleware: Verifies JWT token from Authorization header.
 * Attaches decoded user payload { id, username, role, full_name } to req.user
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'No authorization token provided. Please log in.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        error: 'Invalid or expired token',
        message: 'Your session has expired or is invalid. Please log in again.'
      });
    }

    req.user = user;
    next();
  });
}

/**
 * Middleware: Role-Based Authorization
 * Enforces that req.user.role belongs to the allowed roles list.
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. This action requires role: [${allowedRoles.join(', ')}]. Current role: [${req.user.role}].`
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles,
  JWT_SECRET
};
