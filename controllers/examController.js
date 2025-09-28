// controllers/examController.js
const markService = require('../services/markService');

exports.getExams = async (req, res, next) => {
  try {
    const exams = await markService.getExams(req.user.collegeId);
    return res.json({ data: exams, message: 'Exams fetched', status: true });
  } catch (err) {
    return next(err);
  }
};
