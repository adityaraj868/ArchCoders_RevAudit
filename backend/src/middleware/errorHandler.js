const logger = require('../utils/logger');
const env = require('../config/env');

// Centralized error handler — every thrown/next(err) call in the app ends up here.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational === true;

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${err.message}`, { stack: err.stack });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${err.message}`);
  }

  res.status(statusCode).json({
    error: {
      message: isOperational ? err.message : 'Internal server error',
      ...(env.nodeEnv !== 'production' && { stack: err.stack }),
    },
  });
}

module.exports = errorHandler;
