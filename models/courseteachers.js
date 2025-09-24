'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CourseTeachers extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  CourseTeachers.init({
    courseId: DataTypes.INTEGER,
    teacherId: DataTypes.INTEGER
  }, {
    sequelize,          
    modelName: 'CourseTeachers',
    timestamps: false,
    tableName: 'CourseTeachers',
  });
  return CourseTeachers;
};