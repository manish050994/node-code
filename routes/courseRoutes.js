const express = require('express');
const router = express.Router();
const { createCourse, getCourses, updateCourse, deleteCourse } = require('../controllers/courseController');
const { protect, authorize } = require('../middlewares/authMiddleware');


router.get('/', protect, getCourses);
router.post('/', protect, authorize('collegeadmin','superadmin'), createCourse);
router.put('/:id', protect, authorize('collegeadmin','superadmin'), updateCourse);
router.delete('/:id', protect, authorize('collegeadmin','superadmin'), deleteCourse);


module.exports = router;