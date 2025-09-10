const express = require('express');
const router = express.Router();
const { createTeacher, getTeachers, updateTeacher, deleteTeacher } = require('../controllers/teacherController');
const { protect, authorize } = require('../middlewares/authMiddleware');


router.get('/', protect, getTeachers);
router.post('/', protect, authorize('collegeadmin','superadmin'), createTeacher);
router.put('/:id', protect, authorize('collegeadmin','superadmin'), updateTeacher);
router.delete('/:id', protect, authorize('collegeadmin','superadmin'), deleteTeacher);


module.exports = router;