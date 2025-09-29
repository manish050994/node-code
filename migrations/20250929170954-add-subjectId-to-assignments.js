module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if subjectId column exists
    const columns = await queryInterface.describeTable('Assignments');
    if (!columns.subjectId) {
      await queryInterface.addColumn('Assignments', 'subjectId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Subjects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT' // Match models/index.js
      });
    }
  },
  down: async (queryInterface, Sequelize) => {
    // Check if subjectId column exists before removing
    const columns = await queryInterface.describeTable('Assignments');
    if (columns.subjectId) {
      await queryInterface.removeColumn('Assignments', 'subjectId');
    }
  }
};