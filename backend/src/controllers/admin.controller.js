const { Presentation } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

// A minimal stand-in for the real admin dashboard — proves requireAuth +
// requireRole('admin') actually gate a route backed by real data. The
// presentations feature itself (create/upload/publish) is a separate piece
// of work built on top of this same middleware.
const getDashboard = asyncHandler(async (req, res) => {
  const [total, statusCounts] = await Promise.all([
    Presentation.count(),
    Presentation.findAll({
      attributes: [
        'status',
        [Presentation.sequelize.fn('COUNT', Presentation.sequelize.col('status')), 'count'],
      ],
      group: ['status'],
      raw: true,
    }),
  ]);

  res.json({
    admin: { id: req.user.id, name: req.user.name },
    presentations: {
      total,
      byStatus: statusCounts.reduce((acc, row) => {
        acc[row.status] = Number(row.count);
        return acc;
      }, {}),
    },
  });
});

module.exports = { getDashboard };
