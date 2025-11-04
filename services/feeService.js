// services\feeService.js
const db = require('../models');
const ApiError = require('../utils/ApiError');
const { generatePdf, generatePaySlip } = require('../utils/pdfExport');
const { sendEmail, sendSms } = require('../utils/email');
const Razorpay = require('razorpay');
const config = require('../config/razorpay');
const rzp = new Razorpay({ key_id: config.key_id, key_secret: config.key_secret });


exports.createClassFee = async (payload, createdByCollegeId) => {
  const { courseId, amount, dueDate, description } = payload;
  const t = await db.sequelize.transaction();
  try {
    const course = await db.Course.findOne({ where: { id: courseId, collegeId: createdByCollegeId }, transaction: t });
    if (!course) throw ApiError.notFound('Course (class) not found or not in your college');

    // find students in that course
    const students = await db.Student.findAll({ where: { courseId }, transaction: t });
    if (!students || students.length === 0) {
      await t.rollback();
      throw ApiError.badRequest('No students found in the selected class');
    }

    // create fees for each student
    const feesPayload = students.map(s => ({
      studentId: s.id,
      courseId,
      amount,
      dueDate,
      status: 'pending',
      collegeId: createdByCollegeId,
      description: description || `Fee for course ${course.name}`,
    }));

    const created = await db.Fee.bulkCreate(feesPayload, { transaction: t });
    await t.commit();
    return created;
  } catch (err) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to create class fees: ${err.message}`);
  }
};

exports.modifyClassFee = async (payload, modifiedByCollegeId) => {
  const { courseId, amount, dueDate, status, force = false } = payload;
  const t = await db.sequelize.transaction();
  try {
    const course = await db.Course.findOne({ where: { id: courseId, collegeId: modifiedByCollegeId }, transaction: t });
    if (!course) throw ApiError.notFound('Course (class) not found or not in your college');

    const where = { courseId, collegeId: modifiedByCollegeId };
    if (!force) {
      // don't change already paid fees unless force = true
      where.status = ['pending', 'partial'];
    }

    // build update values
    const updateValues = {};
    if (amount !== undefined) updateValues.amount = amount;
    if (dueDate !== undefined) updateValues.dueDate = dueDate;
    if (status !== undefined) updateValues.status = status;

    if (Object.keys(updateValues).length === 0) {
      await t.rollback();
      throw ApiError.badRequest('No update fields provided');
    }

    const [affectedCount] = await db.Fee.update(updateValues, { where, transaction: t });
    await t.commit();
    return { affectedCount };
  } catch (err) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to modify class fees: ${err.message}`);
  }
};


exports.modifyStudentFee = async (feeId, payload, actorCollegeId) => {
  const t = await db.sequelize.transaction();
  try {
    const fee = await db.Fee.findOne({ where: { id: feeId }, transaction: t });
    if (!fee) throw ApiError.notFound('Fee not found');

    // ensure college matches if college-level operation
    if (actorCollegeId && fee.collegeId !== actorCollegeId) {
      throw ApiError.forbidden('Not allowed to modify fee of another college');
    }

    const allowed = {};
    if (payload.amount !== undefined) allowed.amount = payload.amount;
    if (payload.dueDate !== undefined) allowed.dueDate = payload.dueDate;
    if (payload.status !== undefined) allowed.status = payload.status;
    if (payload.note !== undefined) allowed.note = payload.note;

    if (Object.keys(allowed).length === 0) throw ApiError.badRequest('No update fields provided');

    await fee.update(allowed, { transaction: t });
    await t.commit();
    return fee;
  } catch (err) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to modify student fee: ${err.message}`);
  }
};


exports.getStudentFeeHistory = async (studentId, requester) => {
  // requester: { role, collegeId, parentId, userId } used for authorization checks
  const student = await db.Student.findOne({
    where: { id: studentId },
    include: [
      { model: db.Fee, include: [{ model: db.Course, attributes: ['id', 'name'] }] },
      { model: db.Parent, attributes: ['id', 'name'] }
    ]
  });
  if (!student) throw ApiError.notFound('Student not found');

  // authorization: if requester.role === 'parent' ensure parentId matches
  if (requester.role === 'parent') {
    if (!requester.parentId || requester.parentId !== student.parentId) throw ApiError.forbidden('Not allowed');
  }
  if (requester.role === 'collegeadmin') {
    if (requester.collegeId !== student.collegeId) throw ApiError.forbidden('Not allowed');
  }

  const fees = student.Fees || [];
  return fees.map(f => ({
    id: f.id,
    amount: f.amount,
    status: f.status,
    dueDate: f.dueDate,
    paidAt: f.paidAt,
    courseId: f.courseId,
    courseName: f.Course?.name || null,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  }));
};


exports.getParentFeeHistory = async (parentId) => {
  const parent = await db.Parent.findOne({
    where: { id: parentId },
    include: [
      {
        model: db.Student,
        include: [
          {
            model: db.Fee,
            include: [{ model: db.Course, attributes: ['id', 'name'] }]
          }
        ]
      }
    ]
  });

  if (!parent) throw ApiError.notFound('Parent not found');

  return parent.Students.map(s => ({
    studentId: s.id,
    name: s.name,
    rollNo: s.rollNo,
    fees: s.Fees.map(f => ({
      id: f.id,
      amount: f.amount,
      status: f.status,
      dueDate: f.dueDate,
      paidAt: f.paidAt,
      course: f.Course?.name || null
    }))
  }));
};


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

