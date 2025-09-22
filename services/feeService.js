const db = require('../models');
const ApiError = require('../utils/ApiError');
const { generatePdf } = require('../utils/pdfExport');
const { sendEmail, sendSms } = require('../utils/email');
const Razorpay = require('razorpay');
const config = require('../config/razorpay');
const rzp = new Razorpay({ key_id: config.key_id, key_secret: config.key_secret });

exports.createFee = async (payload, collegeId) => {
  const t = await db.sequelize.transaction();
  try {
    const fee = await db.Fee.create({
      ...payload,
      collegeId,
    }, { transaction: t });
    await t.commit();
    return fee;
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to create fee: ${error.message}`);
  }
};

exports.getFees = async (collegeId, { page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const { rows, count } = await db.Fee.findAndCountAll({
    where: { collegeId },
    include: [
      { model: db.Student, as: 'Student' },
      { model: db.Course, as: 'Course' },
    ],
    offset,
    limit,
  });
  return { fees: rows, total: count, page, limit };
};

exports.payFee = async ({ id }) => {
  const t = await db.sequelize.transaction();
  try {
    const fee = await db.Fee.findOne({ where: { id }, transaction: t });
    if (!fee) throw ApiError.notFound('Fee not found');
    await fee.update({ status: 'paid', paidAt: new Date() }, { transaction: t });
    await t.commit();
    return fee;
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to pay fee: ${error.message}`);
  }
};

exports.generateInvoice = async (id) => {
  const fee = await db.Fee.findOne({
    where: { id },
    include: [
      { model: db.Student, as: 'Student' },
      { model: db.Course, as: 'Course' },
    ],
  });
  if (!fee) throw ApiError.notFound('Fee not found');
  const html = `<div>Invoice for ${fee.Student.name} - Amount: ${fee.amount}</div>`;
  return generatePdf(html);
};

exports.sendReminder = async (id) => {
  const fee = await db.Fee.findOne({
    where: { id },
    include: [{ model: db.Student, as: 'Student' }],
  });
  if (!fee) throw ApiError.notFound('Fee not found');
  await sendEmail({ to: fee.Student.email, subject: 'Fee Reminder', text: `Your fee of ${fee.amount} is due.` });
  await sendSms({ to: fee.Student.phone, text: `Fee reminder: ${fee.amount} due.` });
};

exports.initiatePayment = async (id) => {
  const fee = await db.Fee.findOne({ where: { id } });
  if (!fee) throw ApiError.notFound('Fee not found');
  const order = await rzp.orders.create({ amount: fee.amount * 100, currency: 'INR', receipt: id });
  return order;
};

exports.handlePaymentCallback = async (payload) => {
  const isValid = rzp.utility.verifyPaymentSignature(payload);
  if (!isValid) throw ApiError.badRequest('Invalid signature');
  return await this.payFee({ id: payload.razorpay_order_id });
};