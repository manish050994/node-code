// routes\notificationRoutes.js (featureAuthorize)
const express = require('express');
const router = express.Router();
const { createNotification, getNotifications } = require('../controllers/notificationController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');


router.get('/', protect,featureAuthorize('notification'), getNotifications);
router.post('/', protect, authorize('collegeadmin','superadmin'),featureAuthorize('notification'), createNotification);

module.exports = router;