// models/Assignment.js
module.exports = (sequelize, DataTypes) => {
  const Assignment = sequelize.define('Assignment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    dueDate: { type: DataTypes.DATE },
    teacherId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Teachers', key: 'id' } },
    courseId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Courses', key: 'id' } },
    collegeId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Colleges', key: 'id' } },
  }, {
    timestamps: true,
    tableName: 'Assignments',
  });
  return Assignment;
};