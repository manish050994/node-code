// New route: routes\dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getSuperAdminDashboard, getCollegeAdminDashboard, getTeacherDashboard, getStudentDashboard, getParentDashboard } = require('../controllers/dashboardController');
const { protect, authorize, superAdminOnly } = require('../middlewares/authMiddleware');

router.get('/super', protect, superAdminOnly, getSuperAdminDashboard);
router.get('/college', protect, authorize('collegeadmin'), getCollegeAdminDashboard);
router.get('/teacher', protect, authorize('teacher'), getTeacherDashboard);
router.get('/student', protect, authorize('student'), getStudentDashboard);
router.get('/parent', protect, authorize('parent'), getParentDashboard);

module.exports = router;