'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1) add startTime and endTime columns (strings for 'HH:mm')
    await queryInterface.addColumn('Timetables', 'startTime', {
      type: Sequelize.STRING,
      allowNull: true, // allow null initially so migration is safe
    });

    await queryInterface.addColumn('Timetables', 'endTime', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // 2) copy values from 'time' column into 'startTime' (if 'time' exists)
    // For portability, run SQL that works in many DBs; adapt if necessary.
    // For Postgres:
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query(`
        UPDATE "Timetables" SET "startTime" = "time" WHERE "time" IS NOT NULL;
      `);
    } else {
      // fallback: generic SQL
      await queryInterface.sequelize.query(`
        UPDATE Timetables SET startTime = time WHERE time IS NOT NULL;
      `);
    }

    // 3) (optional) set startTime not null if you want strictness.
    await queryInterface.changeColumn('Timetables', 'startTime', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    // 4) drop old 'time' column
    await queryInterface.removeColumn('Timetables', 'time');
  },

  async down(queryInterface, Sequelize) {
    // reverse: add 'time', copy startTime -> time, remove startTime & endTime
    await queryInterface.addColumn('Timetables', 'time', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query(`
        UPDATE "Timetables" SET "time" = "startTime" WHERE "startTime" IS NOT NULL;
      `);
    } else {
      await queryInterface.sequelize.query(`
        UPDATE Timetables SET time = startTime WHERE startTime IS NOT NULL;
      `);
    }

    await queryInterface.removeColumn('Timetables', 'startTime');
    await queryInterface.removeColumn('Timetables', 'endTime');
  }
};
