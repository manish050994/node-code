// routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const { markAttendance, getAttendance, exportAttendance, uploadOfflineAttendance, getSampleCsv } = require('../controllers/attendanceController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/multer');

router.get('/sample-csv', protect, authorize('collegeadmin'), featureAuthorize('attendance'), getSampleCsv);
router.post('/', protect, authorize('teacher', 'collegeadmin', 'superadmin'), featureAuthorize('attendance'), markAttendance);
router.get('/', protect, featureAuthorize('attendance'), getAttendance);
router.get('/export', protect, authorize('teacher', 'collegeadmin', 'superadmin'), featureAuthorize('attendance'), exportAttendance);
router.post('/upload-offline', protect, authorize('teacher', 'collegeadmin'), featureAuthorize('attendance'), upload.single('file'), uploadOfflineAttendance);

module.exports = router;