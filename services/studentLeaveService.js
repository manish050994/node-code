// services\studentLeaveService.js
const db = require('../models');
const ApiError = require('../utils/ApiError');

exports.requestLeave = async (payload, studentId, collegeId) => {
  const t = await db.sequelize.transaction();
  try {
    const leave = await db.StudentLeaveRequest.create({
      ...payload,
      studentId,
      collegeId,
      createdAt: new Date(),
    }, { transaction: t });
    await t.commit();
    return leave;
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to request leave: ${error.message}`);
  }
};

exports.approveParent = async (id, status, comments, parentId) => {
  const t = await db.sequelize.transaction();
  try {
    // Find leave where the student belongs to this parent
    const leave = await db.StudentLeaveRequest.findOne({
      where: { id },
      include: [{
        model: db.Student,
        as: 'Student',
        where: { parentId } // filter by parent
      }],
      transaction: t,
    });

    if (!leave) throw ApiError.notFound('Leave not found or not authorized');

    await leave.update({ parentApproval: status, comments }, { transaction: t });
    await t.commit();
    return leave;
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to approve leave: ${error.message}`);
  }
};

exports.approveTeacher = async (id, status, comments, teacherId) => {
  const t = await db.sequelize.transaction();
  try {
    const leave = await db.StudentLeaveRequest.findOne({ where: { id }, transaction: t });
    if (!leave) throw ApiError.notFound('Leave not found');
    await leave.update({ teacherApproval: status, comments }, { transaction: t });
    await t.commit();
    return leave;
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to approve leave: ${error.message}`);
  }
};

exports.listLeaves = async (user, { page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  let filter = { collegeId: user.collegeId };
  if (user.role === 'student') filter.studentId = user.studentId;
  if (user.role === 'parent') {
    // fetch all students for this parent
    const students = await db.Student.findAll({ where: { parentId: user.parentId } });
    const studentIds = students.map(s => s.id);
    filter.studentId = studentIds; // Sequelize allows array
  }

  if (user.role === 'teacher') filter.teacherApproval = 'pending';
  const { rows, count } = await db.StudentLeaveRequest.findAndCountAll({
    where: filter,
    include: [{ model: db.Student, as: 'Student' }],
    offset,
    limit,
  });
  return { leaves: rows, total: count, page, limit };
};