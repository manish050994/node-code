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

    // 3) Copy 'time' → 'startTime' only if both columns exist
    if (table.time && table.startTime) {
      if (queryInterface.sequelize.getDialect() === 'postgres') {
        await queryInterface.sequelize.query(`
          UPDATE "Timetables"
          SET "startTime" = "time"
          WHERE "time" IS NOT NULL AND "startTime" IS NULL;
        `);
      } else {
        await queryInterface.sequelize.query(`
          UPDATE Timetables
          SET startTime = time
          WHERE time IS NOT NULL AND startTime IS NULL;
        `);
      }
    }

    // 4) Make startTime NOT NULL only if column exists
    const updatedTable = await queryInterface.describeTable('Timetables');
    if (updatedTable.startTime) {
      await queryInterface.changeColumn('Timetables', 'startTime', {
        type: Sequelize.STRING,
        allowNull: false,
      });
    }

    // 5) Remove old 'time' column only if it exists
    if (table.time) {
      await queryInterface.removeColumn('Timetables', 'time');
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('Timetables');

    // 1) Recreate time column if missing
    if (!table.time) {
      await queryInterface.addColumn('Timetables', 'time', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // 2) Copy back startTime → time
    if (table.startTime) {
      if (queryInterface.sequelize.getDialect() === 'postgres') {
        await queryInterface.sequelize.query(`
          UPDATE "Timetables"
          SET "time" = "startTime"
          WHERE "startTime" IS NOT NULL;
        `);
      } else {
        await queryInterface.sequelize.query(`
          UPDATE Timetables
          SET time = startTime
          WHERE startTime IS NOT NULL;
        `);
      }
    }

    // 3) Remove startTime and endTime only if they exist
    const updated = await queryInterface.describeTable('Timetables');

    if (updated.startTime) {
      await queryInterface.removeColumn('Timetables', 'startTime');
    }
    if (updated.endTime) {
      await queryInterface.removeColumn('Timetables', 'endTime');
    }
  }
};
