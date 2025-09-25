const { Op } = require('sequelize');
const db = require('../models');

async function generateLoginId(base) {
  let loginId = base.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!loginId) {
    loginId = 'user';
  }

  let uniqueId = loginId;
  let counter = 1;

  // ensure uniqueness in DB
  while (await db.User.findOne({ where: { loginId: uniqueId } })) {
    uniqueId = `${loginId}${counter}`;
    counter++;
  }

  return uniqueId;
}

module.exports = { generateLoginId };
