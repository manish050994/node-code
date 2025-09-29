const express = require('express');
const multer = require('multer');
const router = express.Router();
const { createAssignmentWithQuestions, getAssignments, submitAssignment, getSubmissions } = require('../controllers/assignmentController');
const { addQuestion, uploadSolution, getQuestions, getSolution } = require('../controllers/questionController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/multer');
const ApiError = require('../utils/ApiError');

router.post(
  '/',
  protect,
  authorize('teacher'),
  featureAuthorize('assignment'),
  upload.any(), // Capture all files initially
  (req, res, next) => {
    // Parse questions JSON
    let questions = [];
    if (req.body.questions) {
      try {
        questions = typeof req.body.questions === 'string' ? JSON.parse(req.body.questions) : req.body.questions;
      } catch (e) {
        return next(new ApiError(400, `Invalid questions JSON: ${e.message}`));
      }
    }

    // Validate uploaded files against questions.fileKey
    const expectedFields = questions.map(q => q.fileKey);
    const uploadedFields = req.files ? req.files.map(file => file.fieldname) : [];
    
    // Check for unexpected fields
    const unexpectedFields = uploadedFields.filter(field => !expectedFields.includes(field));
    if (unexpectedFields.length > 0) {
      return next(new ApiError(400, `Unexpected fields: ${unexpectedFields.join(', ')}`));
    }

    // Check for missing files
    const missingFields = expectedFields.filter(field => !uploadedFields.includes(field));
    if (missingFields.length > 0) {
      return next(new ApiError(400, `Missing files for fields: ${missingFields.join(', ')}`));
    }

    // Attach parsed questions and files to req.body
    req.body.questions = questions;
    req.filesMap = req.files.reduce((map, file) => {
      map[file.fieldname] = file;
      return map;
    }, {});
    next();
  },
  createAssignmentWithQuestions
);

router.get('/', protect, authorize('teacher', 'student'), featureAuthorize('assignment'), getAssignments);

router.get('/:id/questions', protect, authorize('teacher', 'student'), featureAuthorize('assignment'), getQuestions);
router.post('/:id/questions/:qid/solution', protect, authorize('teacher'), featureAuthorize('assignment'), upload.single('solutionFile'), uploadSolution);
router.get('/:id/questions/:qid/solution', protect, authorize('teacher', 'student'), featureAuthorize('assignment'), getSolution);

router.post('/:id/submit', protect, authorize('student'), featureAuthorize('assignment'), upload.single('file'), submitAssignment);
router.get('/:id/submissions', protect, authorize('teacher'), featureAuthorize('assignment'), getSubmissions);

module.exports = router;