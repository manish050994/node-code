// controllers/questionController.js
const questionService = require('../services/questionService');

exports.addQuestion = async (req, res, next) => {
  try {
    const questionFilePath = req.file ? req.file.path : null;
    const q = await questionService.addQuestion(req.params.id, req.body, questionFilePath, req.user.teacherId);
    return res.status(201).json({ data: q, message: 'Question added', status: true });
  } catch (err) {
    return next(err);
  }
};

exports.uploadSolution = async (req, res, next) => {
  try {
    const solutionFilePath = req.file ? req.file.path : null;
    const q = await questionService.uploadSolution(req.params.id, req.params.qid, solutionFilePath, req.user.teacherId);
    return res.json({ data: q, message: 'Solution uploaded', status: true });
  } catch (err) {
    return next(err);
  }
};

exports.getQuestions = async (req, res, next) => {
  try {
    const qs = await questionService.getQuestions(req.params.id, req.user);
    return res.json({ data: qs, message: 'Questions fetched', status: true });
  } catch (err) {
    return next(err);
  }
};
