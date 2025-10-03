// routes/markRoutes.js
const express = require('express');
const router = express.Router();
const { addMark, getMarks, getExamMarks, getAssignmentMarks, getMarksByCourse} = require('../controllers/markController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');

// Generic add mark
router.post('/', protect, authorize('teacher'), featureAuthorize('assessment'), addMark);

// General marks
router.get('/', protect, authorize('teacher','student','parent'), featureAuthorize('assessment'), getMarks);

// Exam marks
router.get('/exams', protect, authorize('teacher','student','parent'), featureAuthorize('assessment'), getExamMarks);

// Assignment marks
router.get('/assignments', protect, authorize('teacher','student','parent'), featureAuthorize('assessment'), getAssignmentMarks);

router.get('/course/:courseId', protect, authorize('teacher','student','parent'), featureAuthorize('assessment'), getMarksByCourse);

module.exports = router;
