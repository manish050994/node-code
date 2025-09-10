const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/email');
const { sendSms } = require('../utils/sms');


exports.createNotification = async (req, res) => {
const payload = req.body;
const n = await Notification.create({ ...payload, sentAt: new Date(), collegeId: req.user?.collegeId });
// simple channel dispatch
if (payload.channels?.includes('email')) sendEmail({ to: payload.to || 'all', subject: payload.title, text: payload.message });
if (payload.channels?.includes('sms')) sendSms({ to: payload.to || 'all', text: payload.message });
res.json(n);
};


exports.getNotifications = async (req, res) => {
const list = await Notification.find().sort({ sentAt: -1 });
res.json(list);
};