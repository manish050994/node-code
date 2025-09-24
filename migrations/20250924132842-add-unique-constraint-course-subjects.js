'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint('CourseSubjects', {
      fields: ['courseId', 'subjectId'],
      type: 'unique',
      name: 'unique_course_subject' // 👈 custom constraint name
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('CourseSubjects', 'unique_course_subject');
  }
};
