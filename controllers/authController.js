// controllers\authController.js (modified: added forgot, reset, enable2FA, verify2FA)
const authService = require('../services/authService');


exports.registerSuperAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const data = await authService.registerSuperAdmin({ name, email, password, role });
    return res.success(data, 'User registered');
  } catch (err) {
    return next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { loginId, password } = req.body;
    const data = await authService.login({ loginId, password });
    return res.success(data, 'Login successful');
  } catch (err) {
    return next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.loginId);
    return res.success(null, 'Email sent');
  } catch (err) {
    return next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.params.token, req.body.password);
    return res.success(null, 'Password reset');
  } catch (err) {
    return next(err);
  }
};

exports.enable2FA = async (req, res, next) => {
  try {
    const qr = await authService.enable2FA(req.user._id);
    return res.success(qr, '2FA enabled');
  } catch (err) {
    return next(err);
  }
};

exports.verify2FA = async (req, res, next) => {
  try {
    const data = await authService.verify2FA(req.body.tempToken, req.body.otp);
    return res.success(data, '2FA verified');
  } catch (err) {
    return next(err);
  }
};

exports.disable2FA = async (req, res, next) => {
  try {
    const result = await authService.disable2FA(req.user._id);
    return res.success(result, '2FA disabled');
  } catch (err) {
    return next(err);
  }
};