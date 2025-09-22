// models/College.js
module.exports = (sequelize, DataTypes) => {
  const College = sequelize.define('College', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    address: { type: DataTypes.STRING },
    status: { type: DataTypes.BOOLEAN, defaultValue: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    features: {
      type: DataTypes.JSONB,
      defaultValue: {
        attendance: true,
        studentManagement: true,
        teacherManagement: true,
        courseManagement: true,
        feeManagement: true,
        notification: true,
        leave: true,
        report: true,
        assignment: true,
        assessment: true,
        timetable: true,
      },
    },
  }, {
    timestamps: true,
    tableName: 'Colleges',
  });
  return College;
};