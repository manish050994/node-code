// models/Attendance.js
module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define('Attendance', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    studentId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Students', key: 'id' } },
    date: { type: DataTypes.DATE, allowNull: false },
    status: { type: DataTypes.ENUM('present', 'absent', 'late'), defaultValue: 'present' },
    collegeId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Colleges', key: 'id' } },
  }, {
    timestamps: true,
    tableName: 'Attendances',
    indexes: [
      { unique: true, fields: ['studentId', 'date'] },
    ],
  });
  return Attendance;
};
