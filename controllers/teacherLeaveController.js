// controllers\teacherLeaveController.js (renamed from leaveController)
const teacherLeaveService = require('../services/teacherLeaveService');

exports.requestLeave = async (req, res, next) => {
  try {
    const l = await teacherLeaveService.requestLeave(req.body, req.user.teacherId, req.user.collegeId);
    return res.success(l, 'Leave requested');
  } catch (err) {
    return next(err);
  }
};

exports.myLeaves = async (req, res, next) => {
  try {
    const list = await teacherLeaveService.myLeaves(req.user.teacherId);
    return res.success(list, 'My leaves fetched');
  } catch (err) {
    return next(err);
  }
};

exports.listLeaves = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const list = await teacherLeaveService.listLeaves(req.user.collegeId, {page: parseInt(page), 
      limit: parseInt(limit)});
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

// controllers/teacherLeaveController.js
exports.leaveHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const history = await teacherLeaveService.leaveHistory(req.user.teacherId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    return res.success(history, 'Leave history fetched');
  } catch (err) {
    return next(err);
  }
};
