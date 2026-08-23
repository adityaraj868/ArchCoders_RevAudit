const AppError = require('../utils/AppError');

// Use after authenticateUser: authorizeRole('HEAD_ADMIN') or
// authorizeRole('ADMIN', 'HEAD_ADMIN').
function authorizeRole(...allowedRoles) {
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

module.exports = authorizeRole;
