// routes/examRoutes.js
const express = require('express');
const router = express.Router();
const { getExams } = require('../controllers/examController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/', protect, authorize('teacher','student','parent'), getExams);

module.exports = router;
