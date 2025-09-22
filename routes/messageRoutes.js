// New route: routes\messageRoutes.js
const express = require('express');
const router = express.Router();
const { sendMessage, getMessages } = require('../controllers/messageController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/', protect, authorize('parent', 'teacher'), sendMessage);
router.get('/', protect, authorize('parent', 'teacher'), getMessages);

module.exports = router;