const AppError = require('../utils/AppError');

// Use after requireAuth: requireRole('admin') or requireRole('admin', 'viewer').
function requireRole(...allowedRoles) {
  return function checkRole(req, res, next) {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
}

module.exports = requireRole;
