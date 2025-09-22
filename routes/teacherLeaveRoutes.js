// routes\teacherLeaveRoutes.js (renamed, featureAuthorize)
const express = require('express');
const router = express.Router();
const { requestLeave, listLeaves, setStatus } = require('../controllers/teacherLeaveController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');


router.post('/', protect, authorize('teacher'), featureAuthorize('leave'), requestLeave);
router.get('/', protect, authorize('collegeadmin','superadmin'), featureAuthorize('leave'), listLeaves);
router.patch('/:id/status', protect, authorize('collegeadmin','superadmin'), featureAuthorize('leave'), setStatus);

module.exports = router;