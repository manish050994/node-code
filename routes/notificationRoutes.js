const express = require('express');
const router = express.Router();
const { createNotification, getNotifications } = require('../controllers/notificationController');
const { protect, authorize } = require('../middlewares/authMiddleware');


router.get('/', protect, getNotifications);
router.post('/', protect, authorize('collegeadmin','superadmin'), createNotification);


module.exports = router;