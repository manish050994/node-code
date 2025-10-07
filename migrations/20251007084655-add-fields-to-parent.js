module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Parents', 'gender', { type: Sequelize.ENUM('male', 'female', 'other'), allowNull: true });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Parents', 'gender');
  }
};