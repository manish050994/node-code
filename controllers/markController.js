// controllers/markController.js
const markService = require('../services/markService');

// Add Mark (for exam OR assignment)
exports.addMark = async (req, res, next) => {
  try {
    const mark = await markService.addMark(req.body, req.user.teacherId, req.user.collegeId);
    return res.status(201).json({ data: mark, message: 'Mark added', status: true });
  } catch (err) {
    return next(err);
  }
};

// Get all marks (general)
exports.getMarks = async (req, res, next) => {
  try {
    const data = await markService.getMarks(
      { studentId: req.query.studentId },
      req.user,
      { page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 10 }
    );
    return res.json({ data, message: 'Marks fetched', status: true });
  } catch (err) {
    return next(err);
  }
};

// Get Exam Marks
exports.getExamMarks = async (req, res, next) => {
  try {
    const data = await markService.getMarks(
      { examId: req.query.examId },
      req.user,
      { page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 10 }
    );
    return res.json({ data, message: 'Exam marks fetched', status: true });
  } catch (err) {
    return next(err);
  }
};

// Get Assignment Marks
exports.getAssignmentMarks = async (req, res, next) => {
  try {
    const data = await markService.getMarks(
      { assignmentId: req.query.assignmentId },
      req.user,
      { page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 10 }
    );
    return res.json({ data, message: 'Assignment marks fetched', status: true });
  } catch (err) {
    return next(err);
  }
};


// controllers/markController.js
exports.getMarksByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const collegeId = req.user.collegeId; // assuming collegeId comes from logged-in user
    const result = await markService.getMarksByCourse(courseId, collegeId, {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    });

    res.status(200).json({
      data: result.marks,
      total: result.total,
      page: result.page,
      limit: result.limit,
      message: `Marks for course ${courseId}`,
      error: null,
      status: 200
    });
  } catch (err) {
    res.status(400).json({ data: null, message: err.message, error: err, status: 400 });
  }
};
