// services/logsService.js
const db = require('../models');

exports.listLogs = async (collegeId, { page = 1, limit = 200 } = {}) => {
  const offset = (page - 1) * limit;
  const filter = collegeId ? { collegeId } : {};
  const { rows, count } = await db.Log.findAndCountAll({
    where: filter,
    order: [['at', 'DESC']],
    offset,
    limit,
  });
  return { logs: rows, total: count, page, limit };
};
