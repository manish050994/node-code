const express = require('express');
const router = express.Router();
const { createSubject, getSubjects, updateSubject, deleteSubject } = require('../controllers/subjectController');
const { protect, authorize } = require('../middlewares/authMiddleware');


router.get('/', protect, getSubjects);
router.post('/', protect, authorize('collegeadmin','superadmin'), createSubject);
router.put('/:id', protect, authorize('collegeadmin','superadmin'), updateSubject);
router.delete('/:id', protect, authorize('collegeadmin','superadmin'), deleteSubject);


module.exports = router;