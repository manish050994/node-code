// New route: routes\parentRoutes.js
const express = require('express');
const router = express.Router();
const { createParent, getParents, updateParent, deleteParent, getStudentsProgress } = require('../controllers/parentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/', protect, authorize('collegeadmin'), getParents);
router.post('/', protect, authorize('collegeadmin'), createParent);
router.put('/:id', protect, authorize('collegeadmin'), updateParent);
router.delete('/:id', protect, authorize('collegeadmin'), deleteParent);
router.get('/students-progress', protect, authorize('parent'), getStudentsProgress);

module.exports = router;