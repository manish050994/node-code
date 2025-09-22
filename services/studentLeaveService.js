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

exports.approveParent = async (id, status, comments, studentId) => {
  const t = await db.sequelize.transaction();
  try {
    const leave = await db.StudentLeaveRequest.findOne({
      where: { id, studentId },
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
  if (user.role === 'student' || user.role === 'parent') filter.studentId = user.studentId;
  if (user.role === 'teacher') filter.teacherApproval = 'pending';
  const { rows, count } = await db.StudentLeaveRequest.findAndCountAll({
    where: filter,
    include: [{ model: db.Student, as: 'Student' }],
    offset,
    limit,
  });
  return { leaves: rows, total: count, page, limit };
};