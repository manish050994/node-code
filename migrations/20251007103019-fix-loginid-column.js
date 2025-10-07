'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove the old loginId column (if it had a UUID default)
    await queryInterface.removeColumn('Users', 'loginId');

    // Recreate the column with the correct type (STRING) and no default value
    await queryInterface.addColumn('Users', 'loginId', {
      type: Sequelize.STRING,
      allowNull: true, // allow null during migration; can be made false later
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert the change: remove and restore as UUID (if needed)
    await queryInterface.removeColumn('Users', 'loginId');
    await queryInterface.addColumn('Users', 'loginId', {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      allowNull: false,
      unique: true,
    });
  },
};
