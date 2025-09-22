// routes\feeRoutes.js (modified: added new endpoints, featureAuthorize)
const express = require('express');
const router = express.Router();
const { createFee, getFees, payFee, generateInvoice, sendReminder, initiatePayment, handlePaymentCallback } = require('../controllers/feeController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');

router.use(featureAuthorize('feeManagement'));

router.get('/', protect, getFees);
router.post('/', protect, authorize('collegeadmin','superadmin'), createFee);
router.post('/:id/pay', protect, authorize('collegeadmin','superadmin', 'parent'), payFee);
router.get('/:id/invoice', protect, generateInvoice);
router.post('/:id/reminder', protect, authorize('collegeadmin'), sendReminder);
router.post('/:id/initiate-payment', protect, authorize('parent'), initiatePayment);
router.post('/callback', handlePaymentCallback);

module.exports = router;