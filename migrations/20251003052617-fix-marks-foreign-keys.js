'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Make sure assignmentId and examId reference correct tables
    await queryInterface.changeColumn('Marks', 'assignmentId', {
      type: Sequelize.INTEGER,
      allowNull: true, // optional
      references: {
        model: 'Assignments',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.changeColumn('Marks', 'examId', {
      type: Sequelize.INTEGER,
      allowNull: true, // optional
      references: {
        model: 'Exams',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    // Rollback: remove foreign key constraints
    await queryInterface.changeColumn('Marks', 'assignmentId', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.changeColumn('Marks', 'examId', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },
};
