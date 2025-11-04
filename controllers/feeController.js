// controllers\feeController.js (modified: added generateInvoice, sendReminder, initiatePayment)
const feeService = require('../services/feeService');

exports.createClassFee = async (req, res, next) => {
  try {
    // college admin or superadmin
    const payload = req.body; // { courseId, amount, dueDate, description }
    const collegeId = req.user.collegeId;
    const created = await feeService.createClassFee(payload, collegeId);
    return res.success(created, 'Class fees created');
  } catch (err) {
    return next(err);
  }
};

exports.modifyClassFee = async (req, res, next) => {
  try {
    const payload = req.body; // { courseId, amount?, dueDate?, status?, force? }
    const collegeId = req.user.collegeId;
    const result = await feeService.modifyClassFee(payload, collegeId);
    return res.success(result, 'Class fees modified');
  } catch (err) {
    return next(err);
  }
};

exports.modifyStudentFee = async (req, res, next) => {
  try {
    const { feeId } = req.params;
    const payload = req.body; // amount, dueDate, status, note
    const collegeId = req.user.collegeId; // ensure only college admin modifies others
    const updated = await feeService.modifyStudentFee(feeId, payload, collegeId);
    return res.success(updated, 'Student fee modified');
  } catch (err) {
    return next(err);
  }
};

exports.getStudentFeeHistory = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const requester = { role: req.user.role, collegeId: req.user.collegeId, parentId: req.user.parentId, userId: req.user.id };
    const history = await feeService.getStudentFeeHistory(studentId, requester);
    return res.success(history, 'Student fee history fetched');
  } catch (err) {
    return next(err);
  }
};

exports.getParentFeeHistory = async (req, res, next) => {
  try {
    const parentId = req.user.parentId;
    const history = await feeService.getParentFeeHistory(parentId);
    return res.success(history, 'Parent fee history fetched');
  } catch (err) {
    return next(err);
  }
};

exports.createFee = async (req, res, next) => {
  try {
    const f = await feeService.createFee(req.body, req.user.collegeId);
    return res.success(f, 'Fee created');
  } catch (err) {
    return next(err);
  }
};

exports.getFees = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const list = await feeService.getFees(req.user.collegeId, { page, limit });
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

exports.getParentFeesStatus = async (req, res, next) => {
  try {
    const parentId = req.user.parentId; // Assuming user object has parentId
    const data = await feeService.getParentFeesStatus(parentId);
    return res.status(200).json({ data, message: 'Fees status retrieved successfully', error: null, status: true });
  } catch (err) {
    next(err);
  }
};

exports.generatePaymentSlip = async (req, res, next) => {
  try {
    const parentId = req.user.parentId;
    const { studentId } = req.params;

    const pdf = await feeService.generatePaymentSlip(parentId, studentId);

    res.contentType('application/pdf');
    res.send(pdf);
  } catch (err) {
    next(err);
  }
};
