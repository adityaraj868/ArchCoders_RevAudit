const { Router } = require('express');
const { register, login, me } = require('../controllers/auth.controller');
const authenticateUser = require('../middleware/authenticateUser');
const { authLimiter } = require('../middleware/rateLimit');

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', authenticateUser, me);

module.exports = router;
