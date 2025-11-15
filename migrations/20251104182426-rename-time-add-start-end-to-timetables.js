'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('Timetables');

    // 1) Add startTime if not exists
    if (!table.startTime) {
      await queryInterface.addColumn('Timetables', 'startTime', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // 2) Add endTime if not exists
    if (!table.endTime) {
      await queryInterface.addColumn('Timetables', 'endTime', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // 3) Copy `time` → `startTime` (if both exist)
    if (table.time && table.startTime) {
      await queryInterface.sequelize.query(`
        UPDATE "Timetables"
        SET "startTime" = "time"
        WHERE "time" IS NOT NULL AND "startTime" IS NULL;
      `);
    }

    // 4) Try to set startTime NOT NULL only if no nulls exist
    const [{ count }] = await queryInterface.sequelize.query(`
      SELECT COUNT(*)::int AS count 
      FROM "Timetables"
      WHERE "startTime" IS NULL;
    `, { type: queryInterface.sequelize.QueryTypes.SELECT });

    if (count === 0) {
      await queryInterface.changeColumn('Timetables', 'startTime', {
        type: Sequelize.STRING,
        allowNull: false,
      });
    } else {
      console.log(`Skipping NOT NULL constraint on startTime — ${count} null rows exist`);
    }

    // 5) Drop old `time` column if exists
    if (table.time) {
      await queryInterface.removeColumn('Timetables', 'time');
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('Timetables');

    // Restore time column
    if (!table.time) {
      await queryInterface.addColumn('Timetables', 'time', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Copy back startTime → time
    if (table.startTime) {
      await queryInterface.sequelize.query(`
        UPDATE "Timetables"
        SET "time" = "startTime"
        WHERE "startTime" IS NOT NULL;
      `);
    }

    // Remove new columns
    if (table.startTime) {
      await queryInterface.removeColumn('Timetables', 'startTime');
    }
    if (table.endTime) {
      await queryInterface.removeColumn('Timetables', 'endTime');
    }
  }
};
