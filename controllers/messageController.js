// New controller: controllers\messageController.js
const messageService = require('../services/messageService');

exports.sendMessage = async (req, res, next) => {
  try {
    const m = await messageService.sendMessage(req.user._id, req.body.to, req.body.message);
    return res.success(m, 'Message sent');
  } catch (err) {
    return next(err);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const list = await messageService.getMessages(req.user._id);
    return res.success(list, 'Messages fetched');
  } catch (err) {
    return next(err);
  }
};