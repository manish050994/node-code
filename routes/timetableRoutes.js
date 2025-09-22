// New route: routes\timetableRoutes.js
const express = require('express');
const router = express.Router();
const { createTimetable, getTimetable } = require('../controllers/timetableController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');


router.post('/', protect, authorize('collegeadmin'), featureAuthorize('timetable'), createTimetable);
router.get('/', protect, authorize('teacher', 'student'), featureAuthorize('timetable'), getTimetable);

module.exports = router;