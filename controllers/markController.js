// New controller: controllers\markController.js
const markService = require('../services/markService');

exports.addMark = async (req, res, next) => {
  try {
    const m = await markService.addMark(req.body, req.user.teacherId, req.user.collegeId);
    return res.success(m, 'Mark added');
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
    return res.success(list, 'Marks fetched');
  } catch (err) {
    return next(err);
  }
};