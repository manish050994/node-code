// routes\feeRoutes.js (modified: added new endpoints, featureAuthorize)
const express = require('express');
const router = express.Router();
const { createFee, getFees, payFee, generateInvoice, sendReminder, initiatePayment, handlePaymentCallback, getParentFeesStatus, generatePaymentSlip } = require('../controllers/feeController');
const { protect, authorize, featureAuthorize } = require('../middlewares/authMiddleware');


router.get('/', protect, featureAuthorize('feeManagement'), getFees);
router.post('/', protect, authorize('collegeadmin','superadmin'), featureAuthorize('feeManagement'), createFee);
router.post('/:id/pay', protect, authorize('collegeadmin','superadmin', 'parent'), featureAuthorize('feeManagement'), payFee);
router.get('/:id/invoice', protect, featureAuthorize('feeManagement'), generateInvoice);
router.post('/:id/reminder', protect, authorize('collegeadmin'), featureAuthorize('feeManagement'), sendReminder);
router.post('/:id/initiate-payment', protect, authorize('parent'), featureAuthorize('feeManagement'), initiatePayment);
router.post('/callback', featureAuthorize('feeManagement'), handlePaymentCallback);
router.get('/fees-status', protect, authorize('parent'), featureAuthorize('feeManagement'), getParentFeesStatus);
router.get('/payment-slip/:studentId', protect, authorize('parent'), featureAuthorize('feeManagement'), generatePaymentSlip);


module.exports = router;