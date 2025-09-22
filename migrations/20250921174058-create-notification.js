'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Notifications', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING
      },
      message: {
        type: Sequelize.TEXT
      },
      channels: {
        type: Sequelize.ARRAY(Sequelize.STRING)
      },
      targets: {
        type: Sequelize.ARRAY(Sequelize.STRING)
      },
      meta: {
        type: Sequelize.JSONB
      },
      sentAt: {
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
    await queryInterface.dropTable('Notifications');
  }
};