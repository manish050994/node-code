// New route: routes\timetableRoutes.js
const express = require('express');
const router = express.Router();
const {
  createTimetable,
  getTimetable,
  getUpcomingClass,
  sampleTimetableCsv,
  uploadTimetableCsv
} = require('../controllers/timetableController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/', protect, authorize('collegeadmin'), featureAuthorize('timetable'), createTimetable);
router.get('/', protect, authorize('collegeadmin', 'teacher', 'student'), featureAuthorize('timetable'), getTimetable);
router.get('/upcoming', protect, authorize('teacher'), featureAuthorize('timetable'), getUpcomingClass);
router.get('/sample', protect, authorize('collegeadmin'), featureAuthorize('timetable'), sampleTimetableCsv);
router.post('/upload', protect, authorize('collegeadmin'), featureAuthorize('timetable'), upload.single('file'), uploadTimetableCsv);

module.exports = router;
