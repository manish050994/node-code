const { sequelize } = require('../models');
const db = require('../models');
const ApiError = require('../utils/ApiError');
const path = require('path');

exports.addQuestion = async (assignmentId, payload, questionFilePath, teacherId, req) => {
  const t = await sequelize.transaction();
  try {
    const host = req ? `${req.protocol}://${req.get('host')}` : `http://localhost:${process.env.PORT || 3002}`;
    const fileUrl = questionFilePath ? `${host}/uploads/${path.basename(questionFilePath)}` : null;

    // Verify teacher owns assignment
    const assignment = await db.Assignment.findOne({ where: { id: assignmentId, teacherId }, transaction: t });
    if (!assignment) throw new ApiError(404, 'Assignment not found or unauthorized');

    const q = await db.AssignmentQuestion.create({
      assignmentId,
      title: payload.title,
      questionFile: fileUrl, // Store full URL
      marks: payload.marks || 0,
    }, { transaction: t });

    await t.commit();
    return q;
  } catch (err) {
    await t.rollback();
    throw new ApiError(400, `Failed to add question: ${err.message}`);
  }
};

exports.uploadSolution = async (assignmentId, questionId, solutionFilePath, teacherId, req) => {
  const t = await sequelize.transaction();
  try {
    const host = req ? `${req.protocol}://${req.get('host')}` : `http://localhost:${process.env.PORT || 3002}`;
    const fileUrl = solutionFilePath ? `${host}/uploads/${path.basename(solutionFilePath)}` : null;

    const assignment = await db.Assignment.findOne({ where: { id: assignmentId, teacherId }, transaction: t });
    if (!assignment) throw new ApiError(404, 'Assignment not found or unauthorized');

    const question = await db.AssignmentQuestion.findOne({ where: { id: questionId, assignmentId }, transaction: t });
    if (!question) throw new ApiError(404, 'Question not found');

    question.solutionFile = fileUrl; // Store full URL
    await question.save({ transaction: t });

    await t.commit();
    return question;
  } catch (err) {
    await t.rollback();
    throw new ApiError(400, `Failed to upload solution: ${err.message}`);
  }
};

exports.getQuestions = async (assignmentId, user) => {
  const assignment = await db.Assignment.findOne({ where: { id: assignmentId } });
  if (!assignment) throw new ApiError(404, 'Assignment not found');

  const questions = await db.AssignmentQuestion.findAll({ where: { assignmentId } });
  // Hide solutionFile for students unless allowed (e.g., after deadline or graded)
  if (user.role === 'student') {
    return questions.map(q => ({
      id: q.id,
      title: q.title,
      questionFile: q.questionFile,
      marks: q.marks,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt
    }));
  }
  return questions;
};

exports.getSolution = async (assignmentId, questionId, user) => {
  const assignment = await db.Assignment.findOne({ where: { id: assignmentId } });
  if (!assignment) throw new ApiError(404, 'Assignment not found');

  const question = await db.AssignmentQuestion.findOne({ where: { id: questionId, assignmentId } });
  if (!question) throw new ApiError(404, 'Question not found');

  // Restrict solution access for students unless allowed (e.g., after dueDate or graded)
  if (user.role === 'student') {
    const now = new Date();
    if (now < new Date(assignment.dueDate)) {
      throw new ApiError(403, 'Solution not available until after the due date');
    }
    return {
      id: question.id,
      assignmentId: question.assignmentId,
      solutionFile: question.solutionFile
    };
  }

  // Teachers can access solutionFile
  return {
    id: question.id,
    assignmentId: question.assignmentId,
    solutionFile: question.solutionFile
  };
};