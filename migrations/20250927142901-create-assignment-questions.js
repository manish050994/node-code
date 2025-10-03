'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('"AssignmentQuestions"', { // double quotes to preserve camelCase
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      assignmentId: { // matches model
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Assignments', // table name as in DB
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      questionFile: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      solutionFile: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      marks: {
        type: Sequelize.FLOAT, // match model
        defaultValue: 0,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('"AssignmentQuestions"'); // double quotes again
  },
};
