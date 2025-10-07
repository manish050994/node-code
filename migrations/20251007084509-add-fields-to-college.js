module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Colleges', 'shortName', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('Colleges', 'type', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('Colleges', 'street', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('Colleges', 'city', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('Colleges', 'state', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('Colleges', 'country', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('Colleges', 'pincode', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('Colleges', 'contactNo', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('Colleges', 'email', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('Colleges', 'signature', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('Colleges', 'stamp', { type: Sequelize.STRING, allowNull: true });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Colleges', 'shortName');
    await queryInterface.removeColumn('Colleges', 'type');
    await queryInterface.removeColumn('Colleges', 'street');
    await queryInterface.removeColumn('Colleges', 'city');
    await queryInterface.removeColumn('Colleges', 'state');
    await queryInterface.removeColumn('Colleges', 'country');
    await queryInterface.removeColumn('Colleges', 'pincode');
    await queryInterface.removeColumn('Colleges', 'contactNo');
    await queryInterface.removeColumn('Colleges', 'email');
    await queryInterface.removeColumn('Colleges', 'signature');
    await queryInterface.removeColumn('Colleges', 'stamp');
  }
};