// New controller: controllers\assignmentController.js
const assignmentService = require('../services/assignmentService');

exports.createAssignment = async (req, res, next) => {
  try {
    const a = await assignmentService.createAssignment(req.body, req.user.teacherId, req.user.collegeId);
    return res.success(a, 'Assignment created');
  } catch (err) {
    return next(err);
  }
};

exports.getAssignments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const list = await assignmentService.getAssignments(req.user, { page, limit });
    return res.success(list, 'Assignments fetched');
  } catch (err) {
    return next(err);
  }
};

exports.submitAssignment = async (req, res, next) => {
  try {
    const submission = await assignmentService.submitAssignment(req.params.id, req.user.studentId, req.file.path, req.body.text);
    return res.success(submission, 'Assignment submitted');
  } catch (err) {
    return next(err);
  }
};

exports.getSubmissions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const list = await assignmentService.getSubmissions(req.params.id, req.user.teacherId,{ page, limit });
    return res.success(list, 'Submissions fetched');
  } catch (err) {
    return next(err);
  }
};