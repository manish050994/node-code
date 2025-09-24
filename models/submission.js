'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Submission extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Submission.init({
    assignmentId: DataTypes.INTEGER,
    studentId: DataTypes.INTEGER,
    file: DataTypes.STRING,
    text: DataTypes.TEXT,
    submittedAt: DataTypes.DATE
  }, {
    sequelize,          
    modelName: 'Submission',
    timestamps: false,
    tableName: 'Submission',
  });
  return Submission;
};