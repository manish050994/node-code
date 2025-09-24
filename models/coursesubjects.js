'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CourseSubjects extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  CourseSubjects.init({
    courseId: DataTypes.INTEGER,
    subjectId: DataTypes.INTEGER
  }, {
    sequelize,          
    modelName: 'CourseSubjects',
    timestamps: false,
    tableName: 'CourseSubjects',
  });
  return CourseSubjects;
};