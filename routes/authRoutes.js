const express = require('express');
const router = express.Router();
const { login, registerSuperAdmin } = require('../controllers/authController');


router.post('/login', login);
router.post('/register-super', registerSuperAdmin); // one-time use


module.exports = router;