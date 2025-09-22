'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING
      },
      role: {
        type: Sequelize.ENUM('superadmin', 'collegeadmin', 'teacher', 'student', 'parent'),
        allowNull: false,
        defaultValue: 'student'
      },

      collegeId: {
        type: Sequelize.INTEGER
      },
      studentId: {
        type: Sequelize.INTEGER
      },
      teacherId: {
        type: Sequelize.INTEGER
      },
      twoFactorEnabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },

      twoFactorSecret: {
        type: Sequelize.STRING
      },
      resetPasswordToken: {
        type: Sequelize.STRING
      },
      resetPasswordExpire: {
        type: Sequelize.DATE
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
    await queryInterface.dropTable('Users');
  }
};