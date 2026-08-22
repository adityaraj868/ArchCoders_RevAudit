// Express 4 doesn't catch rejected promises from async route handlers on its
// own — wrap every async controller in this so a thrown/rejected error still
// reaches errorHandler instead of hanging the request or crashing the process.
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
