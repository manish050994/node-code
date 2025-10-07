// models/User.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    loginId: { type: DataTypes.STRING, allowNull: true, unique: true }, // Added loginId
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('superadmin', 'collegeadmin', 'teacher', 'student', 'parent'), allowNull: false },
    collegeId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'Colleges', key: 'id' } },
    studentId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'Students', key: 'id' } },
    teacherId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'Teachers', key: 'id' } },
    parentId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'Parents', key: 'id' } },
    twoFactorEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    twoFactorSecret: { type: DataTypes.STRING },
    resetPasswordToken: { type: DataTypes.STRING },
    resetPasswordExpire: { type: DataTypes.DATE },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    timestamps: true,
    tableName: 'Users',
  });

  return User;
};