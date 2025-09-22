'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      actor: {
        type: Sequelize.STRING
      },
      action: {
        type: Sequelize.STRING
      },
      target: {
        type: Sequelize.STRING
      },
      meta: {
        type: Sequelize.JSONB
      },
      at: {
        type: Sequelize.DATE
      },
      collegeId: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Logs');
  }
};