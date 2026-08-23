const { Router } = require('express');
const {
  createPresentation,
  listPresentations,
  getPresentation,
  updatePresentation,
} = require('../controllers/presentation.controller');
const authenticateUser = require('../middleware/authenticateUser');
const authorizeRole = require('../middleware/authorizeRole');
const attachUserIfPresent = require('../middleware/attachUserIfPresent');

const router = Router();

// Public reads — attachUserIfPresent lets an authenticated admin see
// unpublished drafts too, without requiring a token from everyone else.
router.get('/', attachUserIfPresent, listPresentations);
router.get('/:id', attachUserIfPresent, getPresentation);

// Writes: ADMIN and HEAD_ADMIN both manage presentations.
router.post('/', authenticateUser, authorizeRole('ADMIN', 'HEAD_ADMIN'), createPresentation);
router.put('/:id', authenticateUser, authorizeRole('ADMIN', 'HEAD_ADMIN'), updatePresentation);

module.exports = router;
