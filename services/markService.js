const db = require('../models');
const ApiError = require('../utils/ApiError');

exports.addMark = async (payload, teacherId, collegeId) => {
  const t = await db.sequelize.transaction();
  try {
    const mark = await db.Mark.create({
      ...payload,
      teacherId,
      collegeId,
    }, { transaction: t });
    await t.commit();
    return mark;
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to add mark: ${error.message}`);
  }
};

exports.getMarks = async (studentId, user, { page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const filter = { studentId };
  if (user.role === 'teacher') filter.teacherId = user.teacherId;
  const { rows, count } = await db.Mark.findAndCountAll({
    where: filter,
    include: [{ model: db.Subject, as: 'Subject' }],
    offset,
    limit,
  });
  return { marks: rows, total: count, page, limit };
};