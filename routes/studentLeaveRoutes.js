// New route: routes\studentLeaveRoutes.js
const express = require('express');
const router = express.Router();
const { requestStudentLeave, approveParent, approveTeacher, listStudentLeaves } = require('../controllers/studentLeaveController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');


router.post('/', protect, authorize('student'),featureAuthorize('leave'), requestStudentLeave);
router.patch('/:id/parent-approve', protect, authorize('parent'), featureAuthorize('leave'), approveParent);
router.patch('/:id/teacher-approve', protect, authorize('teacher'), featureAuthorize('leave'), approveTeacher);
router.get('/', protect, authorize('student', 'parent', 'teacher'), featureAuthorize('leave'), listStudentLeaves);

module.exports = router;