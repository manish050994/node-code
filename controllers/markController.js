// New controller: controllers\markController.js
const markService = require('../services/markService');

exports.addMark = async (req, res, next) => {
  try {
    const m = await markService.addMark(req.body, req.user.teacherId, req.user.collegeId._id);
    return res.success(m, 'Mark added');
  } catch (err) {
    return next(err);
  }
};

exports.getMarks = async (req, res, next) => {
  try {
    const list = await markService.getMarks(req.query.studentId || req.user.studentId, req.user);
    return res.success(list, 'Marks fetched');
  } catch (err) {
    return next(err);
  }
};