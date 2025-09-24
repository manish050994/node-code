'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint('CourseTeachers', {
      fields: ['courseId', 'teacherId'],
      type: 'unique',
      name: 'course_teacher_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('CourseTeachers', 'course_teacher_unique');
  }
};
