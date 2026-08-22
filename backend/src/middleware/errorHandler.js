const logger = require('../utils/logger');
const env = require('../config/env');

// Sequelize validation/uniqueness failures carry their own message per
// field — surface those directly instead of a generic 500, since they're
// caused by bad input, not a server fault.
function normalizeSequelizeError(err) {
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const message = err.errors?.map((e) => e.message).join('; ') || err.message;
    const statusCode = err.name === 'SequelizeUniqueConstraintError' ? 409 : 400;
    return { message, statusCode, isOperational: true };
  }
  return null;
}

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: 'File exceeds the maximum allowed size',
  LIMIT_FILE_COUNT: 'Too many files in a single upload',
  LIMIT_UNEXPECTED_FILE: 'Unexpected file field',
};

function normalizeMulterError(err) {
  if (err.name !== 'MulterError') return null;
  return { message: MULTER_MESSAGES[err.code] || err.message, statusCode: 400, isOperational: true };
}

// Centralized error handler — every thrown/next(err) call in the app ends up here.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const normalized = normalizeSequelizeError(err) || normalizeMulterError(err);
  const statusCode = normalized?.statusCode || err.statusCode || 500;
  const isOperational = normalized?.isOperational || err.isOperational === true;
  const message = normalized?.message || err.message;

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${err.message}`, { stack: err.stack });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${err.message}`);
  }

  res.status(statusCode).json({
    error: {
      message: isOperational ? message : 'Internal server error',
      ...(env.nodeEnv !== 'production' && { stack: err.stack }),
    },
  });
}

module.exports = errorHandler;
