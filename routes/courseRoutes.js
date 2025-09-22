// routes\courseRoutes.js (modified: featureAuthorize)
const express = require('express');
const router = express.Router();
const { createCourse, getCourses, updateCourse, deleteCourse } = require('../controllers/courseController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');

router.use(featureAuthorize('courseManagement'));

router.get('/', protect, getCourses);
router.post('/', protect, authorize('collegeadmin','superadmin'), createCourse);
router.put('/:id', protect, authorize('collegeadmin','superadmin'), updateCourse);
router.delete('/:id', protect, authorize('collegeadmin','superadmin'), deleteCourse);

module.exports = router;