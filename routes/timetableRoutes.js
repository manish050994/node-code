// New route: routes\timetableRoutes.js
const express = require('express');
const router = express.Router();
const { createTimetable, getTimetable } = require('../controllers/timetableController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');

router.use(featureAuthorize('timetable'));

router.post('/', protect, authorize('collegeadmin'), createTimetable);
router.get('/', protect, authorize('teacher', 'student'), getTimetable);

module.exports = router;