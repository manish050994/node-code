// New route: routes\parentRoutes.js
const express = require('express');
const router = express.Router();
const { createParent, getParents, updateParent, deleteParent, getStudentsProgress, updateParentProfile, getParentProfile } = require('../controllers/parentController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const uploadParentProfile = require('../middlewares/parentProfileUpload');

router.get('/', protect, authorize('collegeadmin'), getParents);
router.post('/', protect, authorize('collegeadmin'), createParent);
router.get('/students-progress', protect, authorize('parent'), getStudentsProgress);
router.get('/profile', protect, authorize('parent'), getParentProfile);
router.put( '/profile', protect, authorize('parent'), uploadParentProfile.single('profilePic'), updateParentProfile);
router.put('/:id', protect, authorize('collegeadmin'), updateParent);
router.delete('/:id', protect, authorize('collegeadmin'), deleteParent);

module.exports = router;