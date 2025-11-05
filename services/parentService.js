// services\parentService.js
const db = require('../models');
const authService = require('./authService');
const ApiError = require('../utils/ApiError');
const { sendEmail } = require('../utils/email');
const bcrypt = require('bcryptjs');
const { generateAndSetLoginId } = require('./userService');

exports.createParent = async (parentData, options = {}) => {
  const { transaction } = options;
  const t = transaction || await db.sequelize.transaction();
  try {
    const { name, email, phone, password, studentId, collegeId, gender } = parentData;

    if (!name || !email || !collegeId) {
      throw ApiError.badRequest('Missing required parent fields: name, email, collegeId');
    }

    // Normalize email for case-insensitive lookup
    const normalizedEmail = email.toLowerCase();

    // Find parent by email in same college (case-insensitive)
    let parentUser = await db.User.findOne({
      where: {
        email: { [db.Sequelize.Op.iLike]: normalizedEmail }, // Case-insensitive
        role: 'parent',
        collegeId,
      },
      include: [{ model: db.Parent, as: 'Parent' }],
      transaction: t,
    });

    let parent;
    if (parentUser && parentUser.Parent) {
      parent = parentUser.Parent; // Reuse existing parent
      console.log(`Reusing parent with ID: ${parent.id} for email: ${normalizedEmail}`); // Debug log
      // Update studentId if provided and different
      if (studentId && parent.studentId !== studentId) {
        const student = await db.Student.findByPk(studentId, { transaction: t });
        if (!student) throw ApiError.notFound(`Student with ID ${studentId} not found`);
        await parent.update({ studentId }, { transaction: t });
        console.log(`Updated parent ID ${parent.id} with studentId: ${studentId}`); // Debug log
      }
    } else if (parentUser && !parentUser.Parent) {
      // User exists but no Parent record; create Parent
      console.log(`Existing user found without Parent for email: ${normalizedEmail}, creating Parent`); // Debug log
      parent = await db.Parent.create(
        {
          name,
          email: normalizedEmail,
          phone: phone || null,
          collegeId,
          studentId: studentId || null,
          gender,
        },
        { transaction: t }
      );
      console.log(`Parent created with ID: ${parent.id}`); // Debug log
      await parentUser.update({ parentId: parent.id }, { transaction: t });
      console.log(`Updated user ID ${parentUser.id} with parentId: ${parent.id}`); // Debug log
      await generateAndSetLoginId(parentUser, t);
    } else {
      // Create new User and Parent
      console.log(`Creating parent user for email: ${normalizedEmail}`); // Debug log
      parentUser = await authService.registerParent(
        {
          name,
          email: normalizedEmail,
          password: password || 'defaultPass123',
          collegeId,
        },
        { transaction: t }
      );
      console.log(`Parent user created with ID: ${parentUser.id}`); // Debug log

      console.log(`Creating parent with studentId: ${studentId || 'null'}`); // Debug log
      parent = await db.Parent.create(
        {
          name,
          email: normalizedEmail,
          phone: phone || null,
          collegeId,
          studentId: studentId || null,
          gender,
        },
        { transaction: t }
      );
      console.log(`Parent created with ID: ${parent.id}`); // Debug log

      await parentUser.update({ parentId: parent.id }, { transaction: t });
      console.log(`Updated user ID ${parentUser.id} with parentId: ${parent.id}`); // Debug log
      await generateAndSetLoginId(parentUser, t);
    }

    if (!transaction) await t.commit();
    return { parent, user: parentUser };
  } catch (error) {
    if (!transaction) await t.rollback();
    console.error('Create parent error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      errors: error.errors ? error.errors.map(e => e.message) : null,
    }); // Enhanced error log
    throw ApiError.badRequest(`Failed to create/link parent: ${error.message}`);
  }
};

exports.getParents = async (collegeId, { page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const { rows, count } = await db.Parent.findAndCountAll({
    where: { collegeId },
    include: [
      { model: db.Student, as: 'Student' },
      {
        model: db.User,
        as: 'User',
        attributes: ['loginId', 'email', 'name', 'role'],
        required: false, // may not exist for all teachers
      },
    ],
    offset,
    limit,
  });
  return { parents: rows, total: count, page, limit };
};

exports.updateParent = async (id, payload) => {
  const t = await db.sequelize.transaction();
  try {
    const parent = await db.Parent.findOne({ where: { id }, transaction: t });
    if (!parent) throw ApiError.notFound('Parent not found');
    await parent.update(payload, { transaction: t });
    await t.commit();
    return parent;
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to update parent: ${error.message}`);
  }
};

exports.deleteParent = async (id) => {
  const t = await db.sequelize.transaction();
  try {
    const parent = await db.Parent.findOne({ where: { id }, transaction: t });
    if (!parent) throw ApiError.notFound('Parent not found');
    await db.User.destroy({ where: { studentId: parent.studentId, role: 'parent' }, transaction: t });
    await db.Student.update({ parentId: null }, { where: { id: parent.studentId }, transaction: t });
    await parent.destroy({ transaction: t });
    await t.commit();
    return { message: 'Parent deleted' };
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to delete parent: ${error.message}`);
  }
};



exports.getStudentsProgress = async (parentId) => {
  // Fetch students of this parent
  const students = await db.Student.findAll({
    where: { parentId },
    include: [
      { model: db.Course, attributes: ['id', 'name'] },
      { 
        model: db.Mark,
        attributes: ['id', 'marks', 'totalMarks', 'grade', 'remarks'],
        include: [{ model: db.Subject, attributes: ['id', 'name'] }]
      },
      { 
        model: db.Attendance,
        attributes: ['id', 'date', 'status']
      },
      { 
        model: db.Fee,
        attributes: ['id', 'amount', 'status', 'dueDate', 'paidAt']
      }
    ]
  });

  if (!students || students.length === 0) {
    throw ApiError.notFound('No students found for this parent');
  }

  // Format the response
  return students.map(student => ({
    studentId: student.id,
    name: student.name,
    rollNo: student.rollNo,
    course: student.Course?.name || null,
    marks: student.Marks.map(mark => ({
      subject: mark.Subject.name,
      marksObtained: mark.marksObtained,
      totalMarks: mark.totalMarks
    })),
    attendance: student.Attendances.map(att => ({
      date: att.date,
      status: att.status
    })),
    fees: student.Fees.map(fee => ({
      feeId: fee.id,
      amount: fee.amount,
      status: fee.status,
      dueDate: fee.dueDate,
      paidAt: fee.paidAt
    }))
  }));
};


exports.getParentProfile = async (parentId) => {
  const parent = await db.Parent.findOne({
    where: { id: parentId },
    include: [
      {
        model: db.User,
        as: 'User',
        attributes: ['loginId', 'email', 'name', 'role']
      }
    ]
  });

  if (!parent) throw ApiError.notFound("Parent not found");
  return parent;
};

exports.updateParentProfile = async (parentId, payload, file) => {
  const parent = await db.Parent.findOne({ where: { id: parentId } });
  if (!parent) throw ApiError.notFound("Parent not found");

  if (file) payload.profilePic = file.filename;
  
  await parent.update(payload);
  return parent;
};
