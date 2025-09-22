// routes\collegeRoutes.js (modified: added toggle feature)
const express = require('express');
const router = express.Router();
const { addCollege, updateCollege, toggleCollege, listColleges, deleteCollege, toggleFeature } = require('../controllers/collegeController');
const { protect, superAdminOnly } = require('../middlewares/authMiddleware');

router.get('/', protect, superAdminOnly, listColleges);
router.post('/', protect, superAdminOnly, addCollege);
router.put('/:id', protect, superAdminOnly, updateCollege);
router.patch('/:id/toggle', protect, superAdminOnly, toggleCollege);
router.delete('/:id', protect, superAdminOnly, deleteCollege);
router.patch('/:id/feature/:feature', protect, superAdminOnly, toggleFeature);

module.exports = router;