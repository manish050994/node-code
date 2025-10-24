// New controller: controllers\dashboardController.js
const dashboardService = require('../services/dashboardService');

exports.getSuperAdminDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getSuperAdminDashboard();
    return res.success(data, 'Super Admin Dashboard');
  } catch (err) {
    return next(err);
  }
};

exports.getCollegeAdminDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getCollegeAdminDashboard(req.user.collegeId);
    return res.success(data, 'College Admin Dashboard');
  } catch (err) {
    return next(err);
  }
};

exports.getTeacherDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getTeacherDashboard(req.user.teacherId);
    return res.success(data, 'Teacher Dashboard');
  } catch (err) {
    return next(err);
  }
};

exports.getStudentDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getStudentDashboard(req.user.studentId);
    return res.success(data, 'Student Dashboard');
  } catch (err) {
    return next(err);
  }
};

exports.getParentDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getParentDashboard(req.user.parentId);
    return res.success(data, 'Parent Dashboard');
  } catch (err) {
    return next(err);
  }
};