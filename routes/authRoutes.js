// routes\authRoutes.js (modified: added forgot, reset, enable2fa, verify2fa)
const express = require('express');
const router = express.Router();
const { login, registerSuperAdmin, forgotPassword, resetPassword, enable2FA, verify2FA, disable2FA } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware'); // Import protect middleware

router.post('/login', login);
router.post('/register-super', registerSuperAdmin);
router.post('/forgot', forgotPassword);
router.put('/reset/:token', resetPassword);
router.post('/enable-2fa', protect, enable2FA);
router.post('/verify-2fa', verify2FA);
router.delete('/disable-2fa', protect, disable2FA);

module.exports = router;