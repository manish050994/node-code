// controllers/markController.js
const markService = require('../services/markService');

exports.addMark = async (req, res, next) => {
  try {
    const m = await markService.addMark(req.body, req.user.teacherId, req.user.collegeId);
    return res.status(201).json({ data: m, message: 'Mark added', status: true });
  } catch (err) {
    return next(err);
  }
};

exports.getMarks = async (req, res, next) => {
  try {
    const list = await markService.getMarks(
      req.query.studentId || req.user.studentId,
      req.user,
      { page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 10 }
    );
    return res.json({ data: list, message: 'Marks fetched', status: true });
  } catch (err) {
    return next(err);
  }
};
