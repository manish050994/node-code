// models/Parent.js
module.exports = (sequelize, DataTypes) => {
  const Parent = sequelize.define('Parent', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    phone: { type: DataTypes.STRING },
    studentId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Students', key: 'id' } },
    collegeId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Colleges', key: 'id' } },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    timestamps: true,
    tableName: 'Parents',
  });
  return Parent;
};