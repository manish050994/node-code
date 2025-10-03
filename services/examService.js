// services/examService.js
const db = require('../models');
const ApiError = require('../utils/ApiError');

exports.createExam = async (payload, collegeId) => {
  try {
    return await db.Exam.create({
      name: payload.name,
      description: payload.description || null,
      examDate: payload.examDate || null,
      totalMarks: payload.totalMarks,
      collegeId,
    });
  } catch (err) {
    throw ApiError.badRequest(`Failed to create exam: ${err.message}`);
  }
};

exports.getExams = async (collegeId) => {
  return await db.Exam.findAll({
    where: { collegeId },
    order: [['examDate', 'ASC']],
  });
};
