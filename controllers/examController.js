// controllers/examController.js
const examService = require('../services/examService');

exports.createExam = async (req, res, next) => {
  try {
    const exam = await examService.createExam(req.body, req.user.collegeId);
    return res.status(201).json({ data: exam, message: 'Exam created', status: true });
  } catch (err) {
    return next(err);
  }
};

exports.getExams = async (req, res, next) => {
  try {
    const exams = await examService.getExams(req.user.collegeId);
    return res.json({ data: exams, message: 'Exams fetched', status: true });
  } catch (err) {
    return next(err);
  }
};
