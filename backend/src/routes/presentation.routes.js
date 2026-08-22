const { Router } = require('express');
const {
  createPresentation,
  listPresentations,
  getPresentation,
  updatePresentation,
} = require('../controllers/presentation.controller');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const attachUserIfPresent = require('../middleware/attachUserIfPresent');

const router = Router();

// Public reads — attachUserIfPresent lets an authenticated admin see
// unpublished drafts too, without requiring a token from everyone else.
router.get('/', attachUserIfPresent, listPresentations);
router.get('/:id', attachUserIfPresent, getPresentation);

// Writes are admin-only.
router.post('/', requireAuth, requireRole('admin'), createPresentation);
router.put('/:id', requireAuth, requireRole('admin'), updatePresentation);

module.exports = router;
