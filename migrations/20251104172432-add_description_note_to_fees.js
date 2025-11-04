module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Fees', 'description', { type: Sequelize.TEXT, allowNull: true });
    await queryInterface.addColumn('Fees', 'note', { type: Sequelize.TEXT, allowNull: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Fees', 'description');
    await queryInterface.removeColumn('Fees', 'note');
  }
};
