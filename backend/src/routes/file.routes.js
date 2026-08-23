const { Router } = require('express');
const { uploadFiles, getFileUrl } = require('../controllers/file.controller');
const authenticateUser = require('../middleware/authenticateUser');
const authorizeRole = require('../middleware/authorizeRole');
const attachUserIfPresent = require('../middleware/attachUserIfPresent');
const upload = require('../middleware/upload');

const router = Router();

router.post('/upload', authenticateUser, authorizeRole('ADMIN', 'HEAD_ADMIN'), upload, uploadFiles);

// Public if the file's presentation is published, admin-only otherwise —
// same visibility rule as GET /presentations/:id.
router.get('/:id/url', attachUserIfPresent, getFileUrl);

module.exports = router;
