// services\feeService.js
const db = require('../models');
const ApiError = require('../utils/ApiError');
const { generatePdf, generatePaySlip } = require('../utils/pdfExport');
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

exports.getParentFeesStatus = async (parentId) => {
  const parent = await db.Parent.findOne({
    where: { id: parentId },
    include: [
      {
        model: db.Student,
        include: [
          {
            model: db.Fee,
            attributes: ['id', 'amount', 'status', 'dueDate', 'paidAt', 'courseId'],
            include: [
              { model: db.Course, attributes: ['id', 'name'] }
            ]
          }
        ]
      }
    ]
  });

  if (!parent) throw ApiError.notFound('Parent not found');

  // Format response
  const studentsFees = parent.Students.map(student => ({
    studentId: student.id,
    name: student.name,
    rollNo: student.rollNo,
    course: student.Course?.name || null,
    fees: student.Fees.map(fee => ({
      feeId: fee.id,
      course: fee.Course?.name || null,
      amount: fee.amount,
      status: fee.status,
      dueDate: fee.dueDate,
      paidAt: fee.paidAt
    }))
  }));

  return studentsFees;
};

exports.generatePaymentSlip = async (parentId, studentId) => {
  const parent = await db.Parent.findOne({
    where: { id: parentId },
    include: [
      {
        model: db.Student,
        where: { id: studentId },
        include: [
          {
            model: db.Fee,
            include: [{ model: db.Course, attributes: ['id','name'] }]
          }
        ]
      }
    ]
  });

  if (!parent) throw ApiError.notFound('Parent not found');
  if (!parent.Students || parent.Students.length === 0) throw ApiError.notFound('Student not found or not associated with parent');

  const student = parent.Students[0];

  // Prepare HTML for PDF
  let feesTable = '';
  student.Fees.forEach(fee => {
    feesTable += `<tr>
      <td>${fee.Course?.name || 'N/A'}</td>
      <td>${fee.amount}</td>
      <td>${fee.status}</td>
      <td>${fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : 'N/A'}</td>
    </tr>`;
  });

  const html = `
    <h1>Payment Slip for ${student.name}</h1>
    <p>Parent: ${parent.name}</p>
    <p>Student ID: ${student.id} | Roll No: ${student.rollNo}</p>
    <table border="1" cellspacing="0" cellpadding="5">
      <tr>
        <th>Course</th>
        <th>Amount</th>
        <th>Status</th>
        <th>Due Date</th>
      </tr>
      ${feesTable}
    </table>
    <p>Total Amount: ${student.Fees.reduce((sum,f)=>sum+parseFloat(f.amount),0)}</p>
  `;

  return generatePaySlip(html);
};

