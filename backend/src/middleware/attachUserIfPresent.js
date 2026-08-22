const { verifyAccessToken } = require('../utils/jwt');
const { User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

// Like requireAuth, but for routes that are public by default and only
// change behavior *if* the caller happens to be an authenticated admin
// (e.g. seeing unpublished drafts). A missing or invalid token is not an
// error here — the request just proceeds as anonymous.
const attachUserIfPresent = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme === 'Bearer' && token) {
    try {
      const payload = verifyAccessToken(token);
      const user = await User.findByPk(payload.sub);
      if (user) {
        req.user = user;
      }
    } catch {
      // Invalid/expired token on an optional-auth route just means "treat
      // this request as anonymous" — never block it here.
    }
  }

  next();
});

module.exports = attachUserIfPresent;
