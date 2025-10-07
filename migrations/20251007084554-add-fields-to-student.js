module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Students', 'gender', { type: Sequelize.ENUM('male', 'female', 'other'), allowNull: true });
    await queryInterface.addColumn('Students', 'motherName', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('Students', 'fatherName', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('Students', 'category', { type: Sequelize.STRING, allowNull: true });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Students', 'gender');
    await queryInterface.removeColumn('Students', 'motherName');
    await queryInterface.removeColumn('Students', 'fatherName');
    await queryInterface.removeColumn('Students', 'category');
  }
};