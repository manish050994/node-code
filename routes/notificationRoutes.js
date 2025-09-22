// routes\notificationRoutes.js (featureAuthorize)
const express = require('express');
const router = express.Router();
const { createNotification, getNotifications } = require('../controllers/notificationController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');

router.use(featureAuthorize('notification'));

router.get('/', protect, getNotifications);
router.post('/', protect, authorize('collegeadmin','superadmin'), createNotification);

module.exports = router;