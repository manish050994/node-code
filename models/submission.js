// models/Submission.js
module.exports = (sequelize, DataTypes) => {
  const Submission = sequelize.define('Submission', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    assignmentId: { type: DataTypes.INTEGER, allowNull: false },
    studentId: { type: DataTypes.INTEGER, allowNull: false },
    file: { type: DataTypes.STRING },
    text: { type: DataTypes.TEXT },
    submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    timestamps: true,
    tableName: 'Submissions',
  });

  Submission.associate = (models) => {
    Submission.belongsTo(models.Assignment, { foreignKey: 'assignmentId', onDelete: 'CASCADE' });
    Submission.belongsTo(models.Student, { foreignKey: 'studentId', onDelete: 'RESTRICT' });
  };

  return Submission;
};
