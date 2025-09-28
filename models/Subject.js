// models/Subject.js
module.exports = (sequelize, DataTypes) => {
  const Subject = sequelize.define('Subject', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    // subjectId: { type: DataTypes.INTEGER, allowNull: false },
    collegeId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Colleges', key: 'id' } },
    teacherId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'Teachers', key: 'id' } },
  }, {
    timestamps: true,
    tableName: 'Subjects',
  });
  return Subject;
};