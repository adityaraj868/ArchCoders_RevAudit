const { verifyAccessToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { User } = require('../models');

// Verifies the Bearer token, then re-loads the user from the database rather
// than trusting the token's payload alone — a deleted or role-changed
// account is rejected immediately instead of staying valid until the token
// expires.
const authenticateUser = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Authentication required', 401);
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }

  const user = await User.findByPk(payload.sub);
  if (!user) {
    throw new AppError('The account for this token no longer exists', 401);
  }

  req.user = user;
  next();
});

module.exports = authenticateUser;
