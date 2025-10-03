// models/Exam.js
module.exports = (sequelize, DataTypes) => {
  const Exam = sequelize.define('Exam', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    examDate: { type: DataTypes.DATE },
    totalMarks: { type: DataTypes.FLOAT, allowNull: false },
    collegeId: { type: DataTypes.INTEGER, allowNull: false },
  }, {
    timestamps: true,
    tableName: 'Exams',
  });

  Exam.associate = (models) => {
    Exam.belongsTo(models.College, { foreignKey: 'collegeId', onDelete: 'CASCADE' });
    Exam.hasMany(models.Mark, { foreignKey: 'examId', onDelete: 'CASCADE' }); // NEW relation
  };

  return Exam;
};
