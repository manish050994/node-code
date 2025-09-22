exports.listLogs = async (req, res, next) => {
  try {
    const collegeId = req.user.role === 'superadmin' ? null : req.user.collegeId._id;
    const list = await logsService.listLogs(collegeId);
    return res.success(list, 'Logs fetched');
  } catch (err) {
    return next(err);
  }
};