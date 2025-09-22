// controllers\feeController.js (modified: added generateInvoice, sendReminder, initiatePayment)
const feeService = require('../services/feeService');

exports.createFee = async (req, res, next) => {
  try {
    const f = await feeService.createFee(req.body, req.user.collegeId._id);
    return res.success(f, 'Fee created');
  } catch (err) {
    return next(err);
  }
};

exports.getFees = async (req, res, next) => {
  try {
    const list = await feeService.getFees(req.user.collegeId._id);
    return res.success(list, 'Fees fetched');
  } catch (err) {
    return next(err);
  }
};

exports.payFee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const f = await feeService.payFee({ id });
    return res.success(f, 'Fee paid');
  } catch (err) {
    return next(err);
  }
};

exports.generateInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pdf = await feeService.generateInvoice(id);
    res.contentType('application/pdf');
    res.send(pdf);
  } catch (err) {
    return next(err);
  }
};

exports.sendReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    await feeService.sendReminder(id);
    return res.success(null, 'Reminder sent');
  } catch (err) {
    return next(err);
  }
};

exports.initiatePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await feeService.initiatePayment(id);
    return res.success(order, 'Payment initiated');
  } catch (err) {
    return next(err);
  }
};

exports.handlePaymentCallback = async (req, res, next) => {
  try {
    await feeService.handlePaymentCallback(req.body);
    return res.success(null, 'Payment processed');
  } catch (err) {
    return next(err);
  }
};