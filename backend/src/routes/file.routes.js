const { Router } = require('express');
const { uploadFiles } = require('../controllers/file.controller');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const upload = require('../middleware/upload');

const router = Router();

router.post('/upload', requireAuth, requireRole('admin'), upload, uploadFiles);

module.exports = router;
