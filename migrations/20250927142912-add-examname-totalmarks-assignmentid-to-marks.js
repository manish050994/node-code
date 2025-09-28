'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get current columns in Marks table
    const tableDef = await queryInterface.describeTable('Marks');

    // examName
    if (!tableDef.examName) {
      await queryInterface.addColumn('Marks', 'examName', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // totalMarks
    if (!tableDef.totalMarks) {
      await queryInterface.addColumn('Marks', 'totalMarks', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      });
    }

    // assignmentId
    if (!tableDef.assignmentId) {
      await queryInterface.addColumn('Marks', 'assignmentId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Assignments',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Cleanly remove if exists
    const tableDef = await queryInterface.describeTable('Marks');

    if (tableDef.examName) {
      await queryInterface.removeColumn('Marks', 'examName');
    }
    if (tableDef.totalMarks) {
      await queryInterface.removeColumn('Marks', 'totalMarks');
    }
    if (tableDef.assignmentId) {
      await queryInterface.removeColumn('Marks', 'assignmentId');
    }
  }
};
