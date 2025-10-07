const path = require('path');
const db = require(path.join(__dirname, '../models'));
const { generateAndSetLoginId } = require(path.join(__dirname, '../services/userService'));

module.exports = {
  up: async () => {
    const users = await db.sequelize.query('SELECT * FROM "Users"', { type: db.Sequelize.QueryTypes.SELECT });

    for (const userData of users) {
      const t = await db.sequelize.transaction();
      try {
        const user = await db.User.findByPk(userData.id, { transaction: t });
        if (!user) {
          await t.rollback();
          continue;
        }

        // Skip users without studentId, teacherId, or parentId
        if (!user.studentId && !user.teacherId && !user.parentId) {
          console.log(`Skipping user ID ${user.id}, no linked student/teacher/parent`);
          await t.rollback();
          continue;
        }

        // Generate loginId
        await generateAndSetLoginId(user, t);

        await t.commit();
      } catch (err) {
        await t.rollback();
        console.error(`Failed for user ID ${userData.id}:`, err.message);
      }
    }
  },

  down: async () => {
    // Optional: Reset loginIds if needed
  }
};
