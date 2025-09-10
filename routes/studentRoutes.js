const express = require('express');
const router = express.Router();
const { createStudent, getStudents, getStudent, updateStudent, deleteStudent } = require('../controllers/studentController');
const { protect, authorize } = require('../middlewares/authMiddleware');


router.get('/', protect, getStudents);
router.post('/', protect, authorize('collegeadmin','superadmin'), createStudent);
router.get('/:id', protect, getStudent);
router.put('/:id', protect, authorize('collegeadmin','superadmin'), updateStudent);
router.delete('/:id', protect, authorize('collegeadmin','superadmin'), deleteStudent);


module.exports = router;