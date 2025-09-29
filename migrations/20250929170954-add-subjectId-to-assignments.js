module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if subjectId column exists
    const columns = await queryInterface.describeTable('Assignments');
    if (!columns.subjectId) {
      await queryInterface.addColumn('Assignments', 'subjectId', {
        type: Sequelize.INTEGER,
        allowNull: true, // Adjust based on your requirements
        references: {
          model: 'Subjects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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