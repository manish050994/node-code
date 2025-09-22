// routes/teacherRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { 
  createTeacher, 
  bulkCreateTeachers, 
  getTeachers, 
  updateTeacher, 
  deleteTeacher, 
  assignSubject, 
  assignGroup 
} = require('../controllers/teacherController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');

router.get('/', protect, featureAuthorize('teacherManagement'), getTeachers);
router.post('/', protect, authorize('collegeadmin', 'superadmin'), featureAuthorize('teacherManagement'), createTeacher);
router.post('/bulk', protect, authorize('collegeadmin', 'superadmin'), featureAuthorize('teacherManagement'), upload.single('csvFile'), bulkCreateTeachers);
router.put('/:id', protect, authorize('collegeadmin', 'superadmin'), featureAuthorize('teacherManagement'), updateTeacher);
router.delete('/:id', protect, authorize('collegeadmin', 'superadmin'), featureAuthorize('teacherManagement'), deleteTeacher);
router.post('/:id/assign-subject', protect, authorize('collegeadmin'), featureAuthorize('teacherManagement'), assignSubject);
router.post('/:id/assign-group', protect, authorize('collegeadmin'), featureAuthorize('teacherManagement'), assignGroup);

module.exports = router;