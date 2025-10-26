// models/Parent.js
module.exports = (sequelize, DataTypes) => {
  const Parent = sequelize.define('Parent', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    phone: { type: DataTypes.STRING },
    profilePic: { type: DataTypes.STRING, allowNull: true },
    gender: { type: DataTypes.ENUM('male', 'female', 'other'), allowNull: true }, // Optional, not in original
    studentId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'Students', key: 'id' } },
    collegeId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Colleges', key: 'id' } },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    timestamps: true,
    tableName: 'Parents',
  });
  return Parent;
};