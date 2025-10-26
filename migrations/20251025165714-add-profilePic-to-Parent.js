// migrations/YYYYMMDDHHMMSS-add-profilePic-to-Parent.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Parents', 'profilePic', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('Parents', 'profilePic');
  },
};