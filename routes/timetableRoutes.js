const express = require('express');
const router = express.Router();
const {
  createTimetable,
  getTimetable,
  getUpcomingClass,
  sampleTimetableCsv,
  uploadTimetableCsv,
  getClassesByClassTeacher,
  getClassesBySubjectTeacher,
  getSubjectsWithClasses
} = require('../controllers/timetableController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/', protect, authorize('collegeadmin'), featureAuthorize('timetable'), createTimetable);
router.get('/', protect, authorize('collegeadmin', 'teacher', 'student'), featureAuthorize('timetable'), getTimetable);
router.get('/upcoming', protect, authorize('teacher', 'student'), featureAuthorize('timetable'), getUpcomingClass);
router.get('/sample', protect, authorize('collegeadmin'), featureAuthorize('timetable'), sampleTimetableCsv);
router.post('/upload', protect, authorize('collegeadmin'), featureAuthorize('timetable'), upload.single('file'), uploadTimetableCsv);
router.get('/class-teacher', protect, authorize('teacher'), featureAuthorize('timetable'), getClassesByClassTeacher);
router.get('/subject-teacher', protect, authorize('teacher'), featureAuthorize('timetable'), getClassesBySubjectTeacher);
router.get('/subjects', protect, authorize('teacher'), featureAuthorize('timetable'), getSubjectsWithClasses);

module.exports = router;