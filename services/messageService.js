// New service: services\messageService.js
const Message = require('../models/Message');
const ApiError = require('../utils/ApiError');

exports.sendMessage = async (from, to, message) => {
  const m = await Message.create({ from, to, message });
  return m;
};

exports.getMessages = async (userId) => {
  return await Message.find({ $or: [{ from: userId }, { to: userId }] }).populate('from to');
};