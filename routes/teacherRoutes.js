// routes/teacherRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const teacherProfileUpload = require('../middlewares/teacherProfileUpload'); // NEW
const {
  createTeacher,
  bulkCreateTeachers,
  getTeachers,
  updateTeacher,
  deleteTeacher,
  assignSubject,
  assignGroup,
  assignCourse,
  getSampleCsv,
  getTeacherProfile, // NEW
  updateTeacherProfile // NEW
} = require('../controllers/teacherController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');

// existing routes ...
router.get('/sample-csv', protect, authorize('collegeadmin'), featureAuthorize('teacherManagement'), getSampleCsv);
router.get('/', protect, featureAuthorize('teacherManagement'), getTeachers);

router.post('/', protect, authorize('collegeadmin', 'superadmin'), featureAuthorize('teacherManagement'),
  teacherProfileUpload.single('profilePhoto'), // NEW
  createTeacher
);

// New teacher self-profile routes
router.get('/profile', protect, authorize('teacher'), getTeacherProfile);
router.put('/profile', protect, authorize('teacher'), teacherProfileUpload.single('profilePhoto'), updateTeacherProfile);


router.put('/:id', protect, authorize('collegeadmin', 'superadmin'), featureAuthorize('teacherManagement'),
  teacherProfileUpload.single('profilePhoto'), // NEW
  updateTeacher
);

router.delete('/:id', protect, authorize('collegeadmin', 'superadmin'), featureAuthorize('teacherManagement'), deleteTeacher);
router.post('/:id/assign-subject', protect, authorize('collegeadmin'), featureAuthorize('teacherManagement'), assignSubject);
router.post('/:id/assign-group', protect, authorize('collegeadmin'), featureAuthorize('teacherManagement'), assignGroup);
router.post('/:id/assign-course', protect, authorize('collegeadmin'), featureAuthorize('teacherManagement'), assignCourse);


module.exports = router;
