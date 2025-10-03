// migrations/20251003130000-update-marks-add-examid.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Marks', 'examName');
    await queryInterface.addColumn('Marks', 'examId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Exams',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Marks', 'examId');
    await queryInterface.addColumn('Marks', 'examName', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  }
};
