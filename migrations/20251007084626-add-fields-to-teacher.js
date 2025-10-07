module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Teachers', 'gender', { type: Sequelize.ENUM('male', 'female', 'other'), allowNull: true });
    await queryInterface.addColumn('Teachers', 'dob', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn('Teachers', 'profilePhoto', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('Teachers', 'mobileNo', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('Teachers', 'category', { type: Sequelize.STRING, allowNull: true });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Teachers', 'gender');
    await queryInterface.removeColumn('Teachers', 'dob');
    await queryInterface.removeColumn('Teachers', 'profilePhoto');
    await queryInterface.removeColumn('Teachers', 'mobileNo');
    await queryInterface.removeColumn('Teachers', 'category');
  }
};