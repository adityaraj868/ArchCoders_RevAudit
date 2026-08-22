const rateLimit = require('express-rate-limit');

// Blunt brute-force/credential-stuffing protection on the two endpoints that
// accept a password. Skipped in the test environment so the suite isn't
// throttled by its own repeated login/register calls.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { error: { message: 'Too many attempts, please try again later' } },
});

module.exports = { authLimiter };
