const assignmentService = require('../services/assignmentService');
const ApiError = require('../utils/ApiError');

exports.createAssignmentWithQuestions = async (req, res, next) => {
  try {
    let payload = { ...req.body };
    if (!payload.questions) {
      throw new ApiError(400, 'Questions array is required');
    }

    // Map files to questions using filesMap
    payload.questions = payload.questions.map(q => ({
      ...q,
      questionFile: req.filesMap[q.fileKey] ? req.filesMap[q.fileKey].path : null
    }));

    const result = await assignmentService.createAssignmentWithQuestions(
      payload,
      req.user.teacherId,
      req.user.collegeId,
      Object.values(req.filesMap),
      req // Pass req for host URL
    );

    return res.status(201).json({ data: result, message: 'Assignment created with questions', status: true });
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

exports.getAssignmentsBySubject = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const data = await assignmentService.getAssignmentsBySubject(
      req.user,
      subjectId,
      { page, limit }
    );

    return res.json({
      data,
      message: 'Assignments fetched by subject',
      status: true,
    });
  } catch (err) {
    return next(err);
  }
};
