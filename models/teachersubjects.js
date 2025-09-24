'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TeacherSubjects extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      TeacherSubjects.belongsTo(models.Teacher, { foreignKey: 'teacherId' });
      TeacherSubjects.belongsTo(models.Subject, { foreignKey: 'subjectId' });
    }
  }
  TeacherSubjects.init({
    teacherId: DataTypes.INTEGER,
    subjectId: DataTypes.INTEGER
  }, {
    sequelize,          
    modelName: 'TeacherSubjects',
    timestamps: true,
    tableName: 'TeacherSubjects',
    indexes: [
        {
          unique: true,
          fields: ['teacherId', 'subjectId'], // 👈 important
        },
      ],
  });
  return TeacherSubjects;
};