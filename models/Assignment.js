// models/Assignment.js
module.exports = (sequelize, DataTypes) => {
  const Assignment = sequelize.define('Assignment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    dueDate: { type: DataTypes.DATE },
    teacherId: { type: DataTypes.INTEGER, allowNull: false },
    subjectId: { type: DataTypes.INTEGER, allowNull: false },  // NEW
    courseId: { type: DataTypes.INTEGER, allowNull: false },
    collegeId: { type: DataTypes.INTEGER, allowNull: false },
  }, {
    timestamps: true,
    tableName: 'Assignments',
  });

  Assignment.associate = (models) => {
    Assignment.belongsTo(models.Teacher, { foreignKey: 'teacherId', onDelete: 'RESTRICT' });
    Assignment.belongsTo(models.Subject, { foreignKey: 'subjectId', onDelete: 'RESTRICT' });
    Assignment.belongsTo(models.Course, { foreignKey: 'courseId', onDelete: 'RESTRICT' });
    Assignment.belongsTo(models.College, { foreignKey: 'collegeId', onDelete: 'CASCADE' });
    Assignment.hasMany(models.AssignmentQuestion, { foreignKey: 'assignmentId', onDelete: 'CASCADE' });
    Assignment.hasMany(models.Submission, { foreignKey: 'assignmentId', onDelete: 'CASCADE' });
  };

  return Assignment;
};
