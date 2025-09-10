const express = require('express');
const router = express.Router();
const { requestLeave, listLeaves, setStatus } = require('../controllers/leaveController');
const { protect, authorize } = require('../middlewares/authMiddleware');


router.post('/', protect, requestLeave);
router.get('/', protect, authorize('collegeadmin','superadmin'), listLeaves);
router.patch('/:id/status', protect, authorize('collegeadmin','superadmin'), setStatus);


module.exports = router;