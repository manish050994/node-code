const express = require('express');
const router = express.Router();
const { markAttendance, getAttendance } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middlewares/authMiddleware');


router.post('/', protect, authorize('teacher','collegeadmin','superadmin'), markAttendance);
router.get('/', protect, getAttendance);


module.exports = router;