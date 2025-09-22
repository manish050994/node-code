'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Students', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      rollNo: {
        type: Sequelize.STRING
      },
      courseId: {
        type: Sequelize.INTEGER
      },
      year: {
        type: Sequelize.INTEGER
      },
      section: {
        type: Sequelize.STRING
      },
      profilePic: {
        type: Sequelize.STRING
      },
      feesPaid: {
        type: Sequelize.BOOLEAN
      },
      collegeId: {
        type: Sequelize.INTEGER
      },
      parentId: {
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
    await queryInterface.dropTable('Students');
  }
};