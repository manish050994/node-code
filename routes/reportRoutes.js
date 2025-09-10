const express = require('express');
const router = express.Router();
const { progressReport, attendanceSummary } = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');


router.get('/student/:studentId/progress', protect, progressReport);
router.get('/attendance-summary', protect, attendanceSummary);


module.exports = router;