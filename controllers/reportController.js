// controllers/reportController.js - Fixed to return JSON
const reportService = require('../services/reportService');

exports.progressReport = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const report = await reportService.progressReport({ 
      studentId, 
      collegeId: req.user.collegeId?._id 
    });
    return res.success(report, 'Progress report fetched');
  } catch (err) {
    return next(err);
  }
};

exports.attendanceSummary = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const data = await reportService.attendanceSummary({ 
      from, 
      to, 
      collegeId: req.user.collegeId?._id 
    });
    return res.success(data, 'Attendance summary fetched');
  } catch (err) {
    return next(err);
  }
};

// Now returns JSON with file path instead of streaming
// controllers/reportController.js
exports.exportAnnualRecords = async (req, res, next) => {
  try {
    const result = await reportService.exportAnnualRecords(req);
    return res.success(result, 'Annual records exported successfully');
  } catch (err) {
    return next(err);
  }
};
