'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TeacherLeaveRequests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      teacherId: {
        type: Sequelize.INTEGER
      },
      from: {
        type: Sequelize.DATE
      },
      to: {
        type: Sequelize.DATE
      },
      reason: {
        type: Sequelize.TEXT
      },
      status: {
        type: Sequelize.ENUM('Pending', 'Approved', 'Rejected'),
        allowNull: false,
        defaultValue: 'Pending'
      },

      comments: {
        type: Sequelize.TEXT
      },
      collegeId: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        type: Sequelize.DATE
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
    await queryInterface.dropTable('TeacherLeaveRequests');
  }
};