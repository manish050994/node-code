'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Fees', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      studentId: {
        type: Sequelize.INTEGER
      },
      courseId: {
        type: Sequelize.INTEGER
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      status:  {
        type: Sequelize.ENUM('pending', 'paid', 'partial'),
        allowNull: false
      },
      dueDate: {
        type: Sequelize.DATE
      },
      paidAt: {
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
    await queryInterface.dropTable('Fees');
  }
};