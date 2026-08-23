const { Presentation } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

// A minimal stand-in for the real admin dashboard — proves authenticateUser +
// authorizeRole('ADMIN', 'HEAD_ADMIN') actually gate a route backed by real data. The
// presentations feature itself (create/upload/publish) is a separate piece
// of work built on top of this same middleware.
const getDashboard = asyncHandler(async (req, res) => {
  const [total, published] = await Promise.all([Presentation.count(), Presentation.count({ where: { published: true } })]);

  res.json({
    admin: { id: req.user.id, name: req.user.name },
    presentations: {
      total,
      published,
      draft: total - published,
    },
  });
});

module.exports = { getDashboard };
