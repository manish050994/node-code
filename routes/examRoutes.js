// routes/examRoutes.js
const express = require('express');
const router = express.Router();
const { createExam, getExams } = require('../controllers/examController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/', protect, authorize('collegeadmin'), createExam);
router.get('/', protect, authorize('teacher','student','parent','collegeadmin'), getExams);

module.exports = router;
