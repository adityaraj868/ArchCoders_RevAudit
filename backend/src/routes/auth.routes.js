const { Router } = require('express');
const { register, login, me } = require('../controllers/auth.controller');
const requireAuth = require('../middleware/requireAuth');
const { authLimiter } = require('../middleware/rateLimit');

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', requireAuth, me);

module.exports = router;
