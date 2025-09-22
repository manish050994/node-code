// controllers/attendanceController.js
const attendanceService = require('../services/attendanceService');
const { exportToExcel } = require('../utils/excelExport');

exports.markAttendance = async (req, res, next) => {
  try {
    const { studentIds, date, status } = req.body; // Fixed: studentIds instead of studentId
    const attendance = await attendanceService.markAttendance({
      studentIds,
      date,
      status,
      collegeId: req.user.collegeId, // Fixed: req.user.collegeId instead of _id
    });
    return res.success(attendance, 'Attendance marked');
  } catch (err) {
    return next(err);
  }
};

exports.getAttendance = async (req, res, next) => {
  try {
    const list = await attendanceService.getAttendance({
      q: req.query,
      collegeId: req.user.collegeId, // Fixed: req.user.collegeId
    });
    return res.success(list, 'Attendance list fetched');
  } catch (err) {
    return next(err);
  }
};

exports.exportAttendance = async (req, res, next) => {
  try {
    const list = await attendanceService.getAttendance({
      q: req.query,
      collegeId: req.user.collegeId, // Fixed: req.user.collegeId
    });
    const fileInfo = await exportToExcel(list, 'attendance-report');
    return res.success({
      message: 'Attendance report generated',
      downloadUrl: fileInfo.fullPath,
      filename: fileInfo.filename,
    }, 'Report ready');
  } catch (err) {
    return next(err);
  }
};

exports.uploadOfflineAttendance = async (req, res, next) => {
  try {
    if (!req.file) throw ApiError.badRequest('No file uploaded');
    const result = await attendanceService.uploadOffline(req.file.path, req.user.collegeId); // Fixed: req.user.collegeId
    return res.success(result, 'Offline attendance uploaded');
  } catch (err) {
    return next(err);
  }
};