'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint('TeacherSubjects', {
      fields: ['teacherId', 'subjectId'],
      type: 'unique',
      name: 'unique_teacher_subject' // custom name for constraint
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('TeacherSubjects', 'unique_teacher_subject');
  }
};
