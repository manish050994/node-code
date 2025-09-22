// routes\teacherLeaveRoutes.js (renamed, featureAuthorize)
const express = require('express');
const router = express.Router();
const { requestLeave, listLeaves, setStatus } = require('../controllers/teacherLeaveController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');

router.use(featureAuthorize('leave'));

router.post('/', protect, authorize('teacher'), requestLeave);
router.get('/', protect, authorize('collegeadmin','superadmin'), listLeaves);
router.patch('/:id/status', protect, authorize('collegeadmin','superadmin'), setStatus);

module.exports = router;