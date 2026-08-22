const { Router } = require('express');
const { getDashboard } = require('../controllers/admin.controller');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = Router();

// Every route in this file requires a valid token AND the admin role.
router.use(requireAuth, requireRole('admin'));

router.get('/dashboard', getDashboard);

module.exports = router;
