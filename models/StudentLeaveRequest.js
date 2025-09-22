// models/StudentLeaveRequest.js
module.exports = (sequelize, DataTypes) => {
  const StudentLeaveRequest = sequelize.define('StudentLeaveRequest', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    studentId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Students', key: 'id' } },
    from: { type: DataTypes.DATE },
    to: { type: DataTypes.DATE },
    reason: { type: DataTypes.TEXT },
    parentApproval: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
    teacherApproval: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
    comments: { type: DataTypes.TEXT },
    collegeId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Colleges', key: 'id' } },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    timestamps: true,
    tableName: 'StudentLeaveRequests',
  });
  return StudentLeaveRequest;
};
