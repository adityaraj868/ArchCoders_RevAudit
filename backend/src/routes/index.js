const { Router } = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const presentationRoutes = require('./presentation.routes');
const fileRoutes = require('./file.routes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/presentations', presentationRoutes);
router.use('/files', fileRoutes);

module.exports = router;
