// controllers/logsController.js
const logsService = require('../services/logsService');

exports.listLogs = async (req, res, next) => {
  try {
    const collegeId = req.user.role === 'superadmin' ? null : req.user.collegeId;
    const list = await logsService.listLogs(collegeId, req.query);
    return res.success(list, 'Logs fetched');
  } catch (err) {
    return next(err);
  }
};
