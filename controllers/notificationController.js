// controllers\notificationController.js (unchanged, service updated for targets)
const notificationService = require('../services/notificationService');

exports.createNotification = async (req, res, next) => {
  try {
    const payload = req.body;
    const n = await notificationService.createNotification({ payload, actor: req.user.email, collegeId: req.user.collegeId });
    return res.success(n, 'Notification created');
  } catch (err) {
    return next(err);
  }
};

exports.getNotifications = async (req, res, next) => {
  try {
    const list = await notificationService.getNotifications(req.user.collegeId);
    return res.success(list, 'Notifications fetched');
  } catch (err) {
    return next(err);
  }
};