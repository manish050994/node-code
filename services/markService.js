// services/markService.js
const db = require('../models');
const ApiError = require('../utils/ApiError');

exports.addMark = async (payload, teacherId, collegeId) => {
  const t = await db.sequelize.transaction();
  try {
    // payload: { studentId, subjectId, assignmentId?, examName?, marks, totalMarks, grade, remarks }
    const mark = await db.Mark.create({
      studentId: payload.studentId,
      subjectId: payload.subjectId,
      assignmentId: payload.assignmentId || null,
      examName: payload.examName || null,
      marks: payload.marks,
      totalMarks: payload.totalMarks || null,
      grade: payload.grade || null,
      remarks: payload.remarks || null,
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
  const filter = {};
  if (studentId) filter.studentId = studentId;
  if (user.role === 'teacher') filter.teacherId = user.teacherId;
  if (user.role === 'student') filter.studentId = user.studentId;

  const { rows, count } = await db.Mark.findAndCountAll({
    where: filter,
    include: [
      { model: db.Student },
      { model: db.Subject },
      { model: db.Assignment },
    ],
    offset,
    limit,
    order: [['createdAt', 'DESC']],
  });
  return { marks: rows, total: count, page, limit };
};

exports.getExams = async (collegeId) => {
  const rows = await db.Mark.findAll({
    where: { collegeId },
    attributes: [[db.Sequelize.fn('DISTINCT', db.Sequelize.col('examName')), 'examName']],
    order: [['examName', 'ASC']],
  });
  // return array of examName values (filter null)
  return rows.map(r => r.examName).filter(Boolean);
};
