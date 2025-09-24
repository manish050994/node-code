// routes\courseRoutes.js (modified: featureAuthorize)
const express = require('express');
const router = express.Router();
const { createCourse, getCourses, updateCourse, deleteCourse, assignSubject, assignSubjectsBulk } = require('../controllers/courseController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');


router.get('/', protect, getCourses);
router.post('/', protect, authorize('collegeadmin','superadmin'), featureAuthorize('courseManagement'), createCourse);
router.put('/:id', protect, authorize('collegeadmin','superadmin'),featureAuthorize('courseManagement'), updateCourse);
router.delete('/:id', protect, authorize('collegeadmin','superadmin'), featureAuthorize('courseManagement'), deleteCourse);
router.post('/:id/assign-subject', protect, authorize('collegeadmin','superadmin'), featureAuthorize('courseManagement'), assignSubject);
router.post('/:id/assign-subjects',protect,authorize('collegeadmin','superadmin'),featureAuthorize('courseManagement'), assignSubjectsBulk);


module.exports = router;