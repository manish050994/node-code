// controllers/assignmentController.js
const assignmentService = require('../services/assignmentService');

exports.createAssignment = async (req, res, next) => {
  try {
    // Accept JSON or form-data where questions[] might be JSON
    const payload = { ...req.body };
    if (req.body.questions && typeof req.body.questions === 'string') {
      try { payload.questions = JSON.parse(req.body.questions); } catch(e) {}
    }
    const a = await assignmentService.createAssignment(payload, req.user.teacherId, req.user.collegeId);
    return res.status(201).json({ data: a, message: 'Assignment created', status: true });
  } catch (err) {
    return next(err);
  }
};

exports.getAssignments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const list = await assignmentService.getAssignments(req.user, { page, limit });
    return res.json({ data: list, message: 'Assignments fetched', status: true });
  } catch (err) {
    return next(err);
  }
};

exports.submitAssignment = async (req, res, next) => {
  try {
    const filePath = req.file ? req.file.path : null;
    const submission = await assignmentService.submitAssignment(req.params.id, req.user.studentId, filePath, req.body.text);
    return res.status(201).json({ data: submission, message: 'Assignment submitted', status: true });
  } catch (err) {
    return next(err);
  }
};

exports.getSubmissions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const list = await assignmentService.getSubmissions(req.params.id, req.user.teacherId, { page, limit });
    return res.json({ data: list, message: 'Submissions fetched', status: true });
  } catch (err) {
    return next(err);
  }
};
