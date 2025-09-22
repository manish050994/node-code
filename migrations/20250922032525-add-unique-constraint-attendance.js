'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint('Attendances', {
      fields: ['studentId', 'date'],
      type: 'unique',
      name: 'attendance_student_date_unique', // custom constraint name
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Attendances', 'attendance_student_date_unique');
  }
};
