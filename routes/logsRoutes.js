const express = require('express');
const router = express.Router();
const { listLogs } = require('../controllers/logsController');
const { protect, authorize } = require('../middlewares/authMiddleware');


router.get('/', protect, authorize('superadmin','collegeadmin'), listLogs);


module.exports = router;