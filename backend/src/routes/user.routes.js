const { Router } = require('express');
const { createUser, listUsers, changeRole, removeUser } = require('../controllers/user.controller');
const authenticateUser = require('../middleware/authenticateUser');
const authorizeRole = require('../middleware/authorizeRole');

const router = Router();

// Every route here is HEAD_ADMIN-only — user management is deliberately
// not something a regular ADMIN can reach.
router.use(authenticateUser, authorizeRole('HEAD_ADMIN'));

router.post('/', createUser);
router.get('/', listUsers);
router.patch('/:id/role', changeRole);
router.delete('/:id', removeUser);

module.exports = router;
