const { Router } = require('express');
const { uploadFiles, getFileUrl } = require('../controllers/file.controller');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const attachUserIfPresent = require('../middleware/attachUserIfPresent');
const upload = require('../middleware/upload');

const router = Router();

router.post('/upload', requireAuth, requireRole('admin'), upload, uploadFiles);

// Public if the file's presentation is published, admin-only otherwise —
// same visibility rule as GET /presentations/:id.
router.get('/:id/url', attachUserIfPresent, getFileUrl);

module.exports = router;
