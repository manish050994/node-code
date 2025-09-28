// services/questionService.js
const { sequelize } = require('../models');
const db = require('../models');
const ApiError = require('../utils/ApiError');

exports.addQuestion = async (assignmentId, payload, questionFilePath, teacherId) => {
  const t = await sequelize.transaction();
  try {
    // Verify teacher owns assignment
    const assignment = await db.Assignment.findOne({ where: { id: assignmentId, teacherId }, transaction: t });
    if (!assignment) throw ApiError.notFound('Assignment not found or unauthorized');

    const q = await db.AssignmentQuestion.create({
      assignmentId,
      title: payload.title,
      questionFile: questionFilePath || null,
      marks: payload.marks || 0,
    }, { transaction: t });

    await t.commit();
    return q;
  } catch (err) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to add question: ${err.message}`);
  }
};

exports.uploadSolution = async (assignmentId, questionId, solutionFilePath, teacherId) => {
  const t = await sequelize.transaction();
  try {
    const assignment = await db.Assignment.findOne({ where: { id: assignmentId, teacherId }, transaction: t });
    if (!assignment) throw ApiError.notFound('Assignment not found or unauthorized');

    const question = await db.AssignmentQuestion.findOne({ where: { id: questionId, assignmentId }, transaction: t });
    if (!question) throw ApiError.notFound('Question not found');

    question.solutionFile = solutionFilePath;
    await question.save({ transaction: t });

    await t.commit();
    return question;
  } catch (err) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to upload solution: ${err.message}`);
  }
};

exports.getQuestions = async (assignmentId, user) => {
  // students should not see solutionFile unless you allow after deadline/grade - this example returns solutionFile only if teacher or a flag
  const assignment = await db.Assignment.findOne({ where: { id: assignmentId } });
  if (!assignment) throw ApiError.notFound('Assignment not found');

  const questions = await db.AssignmentQuestion.findAll({ where: { assignmentId } });
  // If you want to hide solutionFile for students:
  if (user.role === 'student') {
    return questions.map(q => ({
      id: q.id, title: q.title, questionFile: q.questionFile, marks: q.marks, createdAt: q.createdAt, updatedAt: q.updatedAt
    }));
  }
  return questions;
};
