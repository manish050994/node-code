// models/College.js
module.exports = (sequelize, DataTypes) => {
  const College = sequelize.define('College', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    shortName: { type: DataTypes.STRING, allowNull: true },
    type: { type: DataTypes.STRING, allowNull: true }, // e.g., 'private', 'government', or 'affiliated to XYZ'
    street: { type: DataTypes.STRING, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    state: { type: DataTypes.STRING, allowNull: true },
    country: { type: DataTypes.STRING, allowNull: true },
    pincode: { type: DataTypes.STRING, allowNull: true },
    contactNo: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
    signature: { type: DataTypes.STRING, allowNull: true }, // e.g., path to signature image
    stamp: { type: DataTypes.STRING, allowNull: true }, // e.g., path to stamp image
    status: { type: DataTypes.BOOLEAN, defaultValue: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    features: {
      type: DataTypes.JSONB,
      defaultValue: {
        attendance: true,
        studentManagement: true,
        teacherManagement: true,
        courseManagement: true,
        parentManagement: true,
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