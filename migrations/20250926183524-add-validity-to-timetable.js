'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Timetables', 'validFrom', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('Timetables', 'validTo', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Timetables', 'validFrom');
    await queryInterface.removeColumn('Timetables', 'validTo');
  }
};
