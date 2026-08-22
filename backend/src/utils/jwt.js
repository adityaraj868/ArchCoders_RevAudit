const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

// Throws jsonwebtoken's own errors (TokenExpiredError, JsonWebTokenError) —
// callers decide how to turn those into an HTTP response.
function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

module.exports = { signAccessToken, verifyAccessToken };
