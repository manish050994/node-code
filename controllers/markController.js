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
      data: {
        marks: result.marks,
        assignment: result.assignment,
      },
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


exports.getReportCard = async (req, res, next) => {
  try {
    const studentId = parseInt(req.params.studentId);

    // Students and parents can only access their own student's report
    if (req.user.role === 'student' && req.user.studentId !== studentId)
      return res.status(403).json({ data: null, message: 'Access denied', status: false });
    if (req.user.role === 'parent' && req.user.parentId) {
      const student = await markService.getStudentParentCheck(studentId, req.user.parentId);
      if (!student) return res.status(403).json({ data: null, message: 'Access denied', status: false });
    }

    const report = await markService.getReportCard(studentId, req.user.collegeId);

    return res.status(200).json({ data: report, message: 'Report card fetched', status: true });
  } catch (err) {
    return next(err);
  }
};
