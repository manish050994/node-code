const express = require('express');
const router = express.Router();
const { createFee, getFees, payFee } = require('../controllers/feeController');
const { protect, authorize } = require('../middlewares/authMiddleware');


router.get('/', protect, getFees);
router.post('/', protect, authorize('collegeadmin','superadmin'), createFee);
router.post('/:id/pay', protect, authorize('collegeadmin','superadmin'), payFee);


module.exports = router;