// models/AssignmentQuestion.js
module.exports = (sequelize, DataTypes) => {
  const AssignmentQuestion = sequelize.define('AssignmentQuestion', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    assignmentId: { type: DataTypes.INTEGER, allowNull: false },
    questionFile: { type: DataTypes.STRING },
    solutionFile: { type: DataTypes.STRING }, // can be uploaded later by teacher
    marks: { type: DataTypes.FLOAT, defaultValue: 0 },
    title: { type: DataTypes.STRING }, // optional small title/desc for the question
  }, {
    timestamps: true,
    tableName: 'AssignmentQuestions',
  });

  AssignmentQuestion.associate = (models) => {
    AssignmentQuestion.belongsTo(models.Assignment, { foreignKey: 'assignmentId', onDelete: 'CASCADE' });
  };

  return AssignmentQuestion;
};
