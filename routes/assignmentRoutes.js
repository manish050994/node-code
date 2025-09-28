// routes/assignmentRoutes.js
const express = require('express');
const router = express.Router();
const { createAssignment, getAssignments, submitAssignment, getSubmissions } = require('../controllers/assignmentController');
const { addQuestion, uploadSolution, getQuestions } = require('../controllers/questionController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/multer');

// assignment endpoints
router.post('/', protect, authorize('teacher'), featureAuthorize('assignment'), createAssignment);
router.get('/', protect, authorize('teacher', 'student'), featureAuthorize('assignment'), getAssignments);

// questions per assignment
router.post('/:id/questions', protect, authorize('teacher'), featureAuthorize('assignment'), upload.single('questionFile'), addQuestion);
router.get('/:id/questions', protect, authorize('teacher','student'), featureAuthorize('assignment'), getQuestions);
router.post('/:id/questions/:qid/solution', protect, authorize('teacher'), featureAuthorize('assignment'), upload.single('solutionFile'), uploadSolution);

// submission
router.post('/:id/submit', protect, authorize('student'), featureAuthorize('assignment'), upload.single('file'), submitAssignment);
router.get('/:id/submissions', protect, authorize('teacher'), featureAuthorize('assignment'), getSubmissions);

module.exports = router;
