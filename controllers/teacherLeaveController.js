// controllers\teacherLeaveController.js (renamed from leaveController)
const teacherLeaveService = require('../services/teacherLeaveService');

exports.requestLeave = async (req, res, next) => {
  try {
    const l = await teacherLeaveService.requestLeave(req.body, req.user.teacherId);
    return res.success(l, 'Leave requested');
  } catch (err) {
    return next(err);
  }
};

exports.listLeaves = async (req, res, next) => {
  try {
    const list = await teacherLeaveService.listLeaves(req.user.collegeId._id);
    return res.success(list, 'Leaves fetched');
  } catch (err) {
    return next(err);
  }
};

exports.setStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    const l = await teacherLeaveService.setStatus({ id, status, comments });
    return res.success(l, 'Leave status updated');
  } catch (err) {
    return next(err);
  }
};