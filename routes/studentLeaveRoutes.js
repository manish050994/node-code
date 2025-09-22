// New route: routes\studentLeaveRoutes.js
const express = require('express');
const router = express.Router();
const { requestStudentLeave, approveParent, approveTeacher, listStudentLeaves } = require('../controllers/studentLeaveController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');

router.use(featureAuthorize('leave'));

router.post('/', protect, authorize('student'), requestStudentLeave);
router.patch('/:id/parent-approve', protect, authorize('parent'), approveParent);
router.patch('/:id/teacher-approve', protect, authorize('teacher'), approveTeacher);
router.get('/', protect, authorize('student', 'parent', 'teacher'), listStudentLeaves);

module.exports = router;