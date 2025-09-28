// services/assignmentService.js
const { sequelize } = require('../models');
const db = require('../models');
const ApiError = require('../utils/ApiError');

exports.createAssignment = async (payload, teacherId, collegeId) => {
  const t = await sequelize.transaction();
  try {
    // payload should include: title, description, dueDate, subjectId, courseId, optional questions: [{ title, marks, questionFile }]
    const questions = payload.questions || []; 
    const assignment = await db.Assignment.create({
      title: payload.title,
      description: payload.description,
      dueDate: payload.dueDate,
      teacherId,
      subjectId: payload.subjectId,
      courseId: payload.courseId,
      collegeId,
    }, { transaction: t });

    // create question rows if any (assume questionFile path present)
    for (const q of questions) {
      await db.AssignmentQuestion.create({
        assignmentId: assignment.id,
        title: q.title || null,
        questionFile: q.questionFile || null,
        marks: q.marks || 0,
      }, { transaction: t });
    }

    await t.commit();
    // return created assignment with questions
    const result = await db.Assignment.findOne({
      where: { id: assignment.id },
      include: [{ model: db.AssignmentQuestion }],
    });
    return result;
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
    include: [{ model: db.AssignmentQuestion }],
    offset,
    limit,
    order: [['createdAt', 'DESC']],
  });
  return { assignments: rows, total: count, page, limit };
};

exports.submitAssignment = async (id, studentId, file, text) => {
  const t = await sequelize.transaction();
  try {
    const assignment = await db.Assignment.findOne({ where: { id }, transaction: t });
    if (!assignment) throw ApiError.notFound('Assignment not found');

    // If already submitted and you want to allow update, handle accordingly.
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
  if (!assignment) throw ApiError.notFound('Assignment not found or unauthorized');
  const { rows, count } = await db.Submission.findAndCountAll({
    where: { assignmentId: id },
    include: [{ model: db.Student }],
    offset,
    limit,
    order: [['submittedAt', 'DESC']],
  });
  return { submissions: rows, total: count, page, limit };
};
