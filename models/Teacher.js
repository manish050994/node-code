module.exports = (sequelize, DataTypes) => {
  const Teacher = sequelize.define('Teacher', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    employeeId: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING },
    groups: { type: DataTypes.ARRAY(DataTypes.STRING) },
    collegeId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Colleges', key: 'id' } },
  }, {
    timestamps: true, // Handles createdAt and updatedAt automatically
    tableName: 'Teachers',
  });
  return Teacher;
};