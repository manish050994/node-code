// routes/reportRoutes.js - Fixed version
const express = require('express');
const router = express.Router();
const { progressReport, attendanceSummary, exportAnnualRecords } = require('../controllers/reportController');
const { protect, featureAuthorize } = require('../middlewares/authMiddleware');

// Apply featureAuthorize only to non-superadmin routes
router.get('/student/:studentId/progress', protect, featureAuthorize('report'), progressReport);
router.get('/attendance-summary', protect, featureAuthorize('report'), attendanceSummary);

// Superadmin export doesn't need feature check since superadmins can access everything
router.get('/export-annual', protect, exportAnnualRecords);

module.exports = router;