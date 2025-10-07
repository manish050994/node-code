const path = require('path');
const db = require(path.join(__dirname, '../models'));
const { generateAndSetLoginId } = require(path.join(__dirname, '../services/userService'));

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const t = await db.sequelize.transaction();
    try {
      const users = await db.sequelize.query('SELECT * FROM "Users"', { type: db.Sequelize.QueryTypes.SELECT });
      for (const userData of users) {
        const user = await db.User.findByPk(userData.id, { transaction: t });
        if (user) {
          await generateAndSetLoginId(user, t);
        }
      }
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },
  down: async (queryInterface, Sequelize) => {
    // Optional: Reset loginIds to UUIDs or leave as-is (no easy revert)
  }
};