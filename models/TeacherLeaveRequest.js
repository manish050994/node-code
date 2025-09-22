// models/TeacherLeaveRequest.js
module.exports = (sequelize, DataTypes) => {
  const TeacherLeaveRequest = sequelize.define('TeacherLeaveRequest', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    teacherId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Teachers', key: 'id' } },
    from: { type: DataTypes.DATE },
    to: { type: DataTypes.DATE },
    reason: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'), defaultValue: 'Pending' },
    comments: { type: DataTypes.TEXT },
    collegeId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Colleges', key: 'id' } },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    timestamps: true,
    tableName: 'TeacherLeaveRequests',
  });
  return TeacherLeaveRequest;
};