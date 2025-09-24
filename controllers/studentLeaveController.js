// New controller: controllers\studentLeaveController.js
const studentLeaveService = require('../services/studentLeaveService');

exports.requestStudentLeave = async (req, res, next) => {
  try {
    const l = await studentLeaveService.requestLeave(req.body, req.user.studentId, req.user.collegeId);
    return res.success(l, 'Leave requested');
  } catch (err) {
    return next(err);
  }
};

exports.approveParent = async (req, res, next) => {
  try {
    const l = await studentLeaveService.approveParent(req.params.id, req.body.status, req.body.comments, req.user.studentId);
    return res.success(l, 'Parent approval updated');
  } catch (err) {
    return next(err);
  }
};

exports.approveTeacher = async (req, res, next) => {
  try {
    const l = await studentLeaveService.approveTeacher(req.params.id, req.body.status, req.body.comments, req.user.teacherId);
    return res.success(l, 'Teacher approval updated');
  } catch (err) {
    return next(err);
  }
};

exports.listStudentLeaves = async (req, res, next) => {
  try {
    const list = await studentLeaveService.listLeaves(req.user);
    return res.success(list, 'Student leaves fetched');
  } catch (err) {
    return next(err);
  }
};