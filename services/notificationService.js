const db = require('../models');
const ApiError = require('../utils/ApiError');

exports.sendMessage = async (from, to, message) => {
  const t = await db.sequelize.transaction();
  try {
    const msg = await db.Message.create({
      fromId: from,
      toId: to,
      message,
      sentAt: new Date(),
    }, { transaction: t });
    await t.commit();
    return msg;
  } catch (error) {
    await t.rollback();
    throw ApiError.badRequest(`Failed to send message: ${error.message}`);
  }
};

exports.getMessages = async (userId, { page = 1, limit = 10 }) => {
  const offset = (page - 1) * limit;
  const { rows, count } = await db.Message.findAndCountAll({
    where: {
      [db.Sequelize.Op.or]: [{ fromId: userId }, { toId: userId }],
    },
    include: [
      { model: db.User, as: 'from' },
      { model: db.User, as: 'to' },
    ],
    offset,
    limit,
  });
  return { messages: rows, total: count, page, limit };
};