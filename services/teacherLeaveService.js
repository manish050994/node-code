const db = require('../models');
const ApiError = require('../utils/ApiError');

exports.requestLeave = async (payload, teacherId) => {
  const t = await db.sequelize.transaction();
  try {
    const leave = await db.TeacherLeaveRequest.create({
      ...payload,
      teacherId,
      createdAt: new Date(),
    }, { transaction: t });
    await t.commit();
    return leave;
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to request leave: ${error.message}`);
  }
};

exports.listLeaves = async (collegeId, { page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const { rows, count } = await db.TeacherLeaveRequest.findAndCountAll({
    where: { collegeId },
    include: [{ model: db.Teacher, as: 'Teacher' }],
    offset,
    limit,
  });
  return { leaves: rows, total: count, page, limit };
};

exports.setStatus = async ({ id, status, comments }) => {
  const t = await db.sequelize.transaction();
  try {
    const leave = await db.TeacherLeaveRequest.findOne({ where: { id }, transaction: t });
    if (!leave) throw ApiError.notFound('Leave request not found');
    await leave.update({ status, comments }, { transaction: t });
    await t.commit();
    return leave;
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to set leave status: ${error.message}`);
  }
};