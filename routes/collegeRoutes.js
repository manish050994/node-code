// routes/collegeRoutes.js
const express = require('express');
const router = express.Router();
const { 
        addCollege, 
        updateCollege, 
        toggleCollege, 
        listColleges, 
        deleteCollege, 
        toggleFeature,
        getCollegeProfile,
        updateCollegeProfile 
      } = require('../controllers/collegeController');
const { protect, superAdminOnly, authorize } = require('../middlewares/authMiddleware');
const collegeUpload = require('../middlewares/collegeUpload');

router.get('/', protect, superAdminOnly, listColleges);
router.post('/', protect, superAdminOnly, collegeUpload.fields([
  { name: 'signature', maxCount: 1 },
  { name: 'stamp', maxCount: 1 }
]), addCollege);
router.put('/update_profile', protect, authorize('collegeadmin'), collegeUpload.fields([
  { name: 'signature', maxCount: 1 },
  { name: 'stamp', maxCount: 1 }
]), updateCollegeProfile);
router.put('/:id', protect, superAdminOnly, collegeUpload.fields([
  { name: 'signature', maxCount: 1 },
  { name: 'stamp', maxCount: 1 }
]), updateCollege);
router.patch('/:id/toggle', protect, superAdminOnly, toggleCollege);
router.delete('/:id', protect, superAdminOnly, deleteCollege);
router.patch('/:id/feature/:feature', protect, superAdminOnly, toggleFeature);
router.get('/profile', protect, authorize('collegeadmin'), getCollegeProfile);


module.exports = router;