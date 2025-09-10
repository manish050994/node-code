const express = require('express');
const router = express.Router();
const { addCollege, updateCollege, toggleCollege, listColleges ,deleteCollege} = require('../controllers/collegeController');
const { protect, superAdminOnly } = require('../middlewares/authMiddleware');


router.get('/', protect, superAdminOnly, listColleges);
router.post('/', protect, superAdminOnly, addCollege);
router.put('/:id', protect, superAdminOnly, updateCollege);
router.patch('/:id/toggle', protect, superAdminOnly, toggleCollege);
router.delete('/:id', protect, superAdminOnly, deleteCollege);


module.exports = router;