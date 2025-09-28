// models/Mark.js
module.exports = (sequelize, DataTypes) => {
  const Mark = sequelize.define('Mark', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    studentId: { type: DataTypes.INTEGER, allowNull: false },
    subjectId: { type: DataTypes.INTEGER, allowNull: false },
    assignmentId: { type: DataTypes.INTEGER },      // NEW: link to assignment (optional)
    examName: { type: DataTypes.STRING },           // NEW
    marks: { type: DataTypes.FLOAT },
    totalMarks: { type: DataTypes.FLOAT },          // NEW
    grade: { type: DataTypes.STRING },
    remarks: { type: DataTypes.TEXT },
    teacherId: { type: DataTypes.INTEGER, allowNull: false },
    collegeId: { type: DataTypes.INTEGER, allowNull: false },
  }, {
    timestamps: true,
    tableName: 'Marks',
  });

  Mark.associate = (models) => {
    Mark.belongsTo(models.Student, { foreignKey: 'studentId', onDelete: 'RESTRICT' });
    Mark.belongsTo(models.Subject, { foreignKey: 'subjectId', onDelete: 'RESTRICT' });
    Mark.belongsTo(models.Assignment, { foreignKey: 'assignmentId', onDelete: 'SET NULL' });
    Mark.belongsTo(models.Teacher, { foreignKey: 'teacherId', onDelete: 'RESTRICT' });
    Mark.belongsTo(models.College, { foreignKey: 'collegeId', onDelete: 'CASCADE' });
  };

  return Mark;
};
