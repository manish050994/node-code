const { sequelize } = require('../models');
const db = require('../models');
const ApiError = require('../utils/ApiError');

exports.createAssignment = async (payload, teacherId, collegeId) => {
  const t = await sequelize.transaction();
  try {
    const assignment = await db.Assignment.create({
      ...payload,
      teacherId,
      collegeId,
    }, { transaction: t });
    await t.commit();
    return assignment;
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to create assignment: ${error.message}`);
  }
};

exports.getAssignments = async (user, { page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  let filter = { collegeId: user.collegeId };
  if (user.role === 'teacher') filter.teacherId = user.teacherId;
  if (user.role === 'student') {
    const student = await db.Student.findOne({ where: { id: user.studentId } });
    if (!student) throw ApiError.notFound('Student not found');
    filter.courseId = student.courseId;
  }
  const { rows, count } = await db.Assignment.findAndCountAll({
    where: filter,
    offset,
    limit,
  });
  return { assignments: rows, total: count, page, limit };
};

exports.submitAssignment = async (id, studentId, file, text) => {
  const t = await sequelize.transaction();
  try {
    const assignment = await db.Assignment.findOne({ where: { id }, transaction: t });
    if (!assignment) throw ApiError.notFound('Assignment not found');
    const submission = await db.Submission.create({
      assignmentId: id,
      studentId,
      file,
      text,
      submittedAt: new Date(),
    }, { transaction: t });
    await t.commit();
    return submission;
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to submit assignment: ${error.message}`);
  }
};

exports.getSubmissions = async (id, teacherId, { page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const assignment = await db.Assignment.findOne({ where: { id, teacherId } });
  if (!assignment) throw ApiError.notFound('Assignment not found');
  const { rows, count } = await db.Submission.findAndCountAll({
    where: { assignmentId: id },
    include: [{ model: db.Student, as: 'Student' }],
    offset,
    limit,
  });
  return { submissions: rows, total: count, page, limit };
};