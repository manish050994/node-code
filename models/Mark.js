// models/Mark.js
module.exports = (sequelize, DataTypes) => {
  const Mark = sequelize.define('Mark', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    studentId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Students', key: 'id' } },
    subjectId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Subjects', key: 'id' } },
    marks: { type: DataTypes.FLOAT },
    grade: { type: DataTypes.STRING },
    remarks: { type: DataTypes.TEXT },
    teacherId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Teachers', key: 'id' } },
    collegeId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Colleges', key: 'id' } },
  }, {
    timestamps: true,
    tableName: 'Marks',
  });
  return Mark;
};