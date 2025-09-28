// controllers/attendanceController.js
const ApiError = require('../utils/ApiError');
const attendanceService = require('../services/attendanceService');
const { exportToExcel } = require('../utils/excelExport');
const { stringify } = require('csv-stringify');

exports.getSampleCsv = async (req, res, next) => {
  try {
    const sampleData = [
      {
        studentId: 5,
        date: '2025-09-22',
        status: 'present',
      },
      {
        studentId: 6,
        date: '2025-09-22',
        status: 'absent',
      },
    ];

    const columns = [
      'studentId',
      'date',
      'status',
    ];

    stringify(sampleData, {
      header: true,
      columns,
    }, (err, output) => {
      if (err) {
        return next(ApiError.internal('Failed to generate sample CSV'));
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="attendance-sample.csv"');
      res.send(output);
    });
  } catch (error) {
    next(ApiError.internal('Failed to generate sample CSV'));
  }
};

exports.markAttendance = async (req, res, next) => {
  try {
    const { date, attendances } = req.body;
    const attendance = await attendanceService.markAttendance({
      attendances,
      date,
      collegeId: req.user.collegeId,
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
      collegeId: req.user.collegeId,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
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
      collegeId: req.user.collegeId,
      page: 1,
      limit: 1000
    });
    const data = list.attendances.map(a => ({
      studentId: a.studentId,
      studentName: a.Student?.name,
      date: a.date,
      status: a.status
    }));
    const buffer = await exportToExcel(data, ['studentId', 'studentName', 'date', 'status'], 'Attendance');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance-report.xlsx"');
    res.send(buffer);
  } catch (err) {
    return next(err);
  }
};

exports.uploadOfflineAttendance = async (req, res, next) => {
  try {
    if (!req.file) throw ApiError.badRequest('No file uploaded');
    const result = await attendanceService.uploadOffline(req.file.path, req.user.collegeId);
    return res.success(result, 'Offline attendance uploaded');
  } catch (err) {
    return next(err);
  }
};