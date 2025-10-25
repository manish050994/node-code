// routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const { markAttendance, getAttendance, exportAttendance, uploadOfflineAttendance, getSampleCsv, getAttendanceOverview } = require('../controllers/attendanceController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/multer');

router.get('/sample-csv', protect, authorize('collegeadmin', 'teacher'), featureAuthorize('attendance'), getSampleCsv);
router.post('/', protect, authorize('teacher', 'collegeadmin', 'superadmin'), featureAuthorize('attendance'), markAttendance);
router.get('/', protect, featureAuthorize('attendance'), getAttendance);
router.get('/export', protect, authorize('teacher', 'collegeadmin', 'superadmin'), featureAuthorize('attendance'), exportAttendance);
router.post('/upload-offline', protect, authorize('teacher', 'collegeadmin'), featureAuthorize('attendance'), upload.single('file'), uploadOfflineAttendance);
router.get('/overview', protect, authorize('student', 'parent'), featureAuthorize('attendance'), getAttendanceOverview);

module.exports = router;