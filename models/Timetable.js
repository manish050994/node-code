// models/Timetable.js
module.exports = (sequelize, DataTypes) => {
  const Timetable = sequelize.define('Timetable', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    day: { type: DataTypes.STRING },
    time: { type: DataTypes.STRING },
    subjectId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Subjects', key: 'id' } },
    teacherId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Teachers', key: 'id' } },
    courseId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Courses', key: 'id' } },
    section: { type: DataTypes.STRING },
    collegeId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Colleges', key: 'id' } },
    validFrom: { type: DataTypes.DATE },
    validTo: { type: DataTypes.DATE },
  }, {
    timestamps: true,
    tableName: 'Timetables',
  });
  return Timetable;
};