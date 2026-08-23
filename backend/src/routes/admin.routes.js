const { Router } = require('express');
const { getDashboard } = require('../controllers/admin.controller');
const authenticateUser = require('../middleware/authenticateUser');
const authorizeRole = require('../middleware/authorizeRole');

const router = Router();

// ADMIN and HEAD_ADMIN both get the dashboard — user management (mounted
// separately at /admin/users) is the one thing reserved to HEAD_ADMIN alone.
router.use(authenticateUser, authorizeRole('ADMIN', 'HEAD_ADMIN'));

router.get('/dashboard', getDashboard);

module.exports = router;
