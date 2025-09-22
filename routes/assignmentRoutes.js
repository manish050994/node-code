// New route: routes\assignmentRoutes.js
const express = require('express');
const router = express.Router();
const { createAssignment, getAssignments, submitAssignment, getSubmissions } = require('../controllers/assignmentController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/multer');


router.post('/', protect, authorize('teacher'), featureAuthorize('assignment'), createAssignment);
router.get('/', protect, authorize('teacher', 'student'), featureAuthorize('assignment'), getAssignments);
router.post('/:id/submit', protect, authorize('student'), featureAuthorize('assignment'), upload.single('file'), submitAssignment);
router.get('/:id/submissions', protect, authorize('teacher'), featureAuthorize('assignment'), getSubmissions);

module.exports = router;