// models/Student.js
module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define('Student', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    rollNo: { type: DataTypes.STRING, allowNull: false, unique: true },
    courseId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Courses', key: 'id' } },
    year: { type: DataTypes.INTEGER },
    section: { type: DataTypes.STRING },
    profilePic: { type: DataTypes.STRING },
    feesPaid: { type: DataTypes.BOOLEAN, defaultValue: false },
    collegeId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Colleges', key: 'id' } },
    parentId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'Parents', key: 'id' } },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    timestamps: true,
    tableName: 'Students',
  });
  return Student;
};