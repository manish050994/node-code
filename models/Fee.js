// models/Fee.js
module.exports = (sequelize, DataTypes) => {
  const Fee = sequelize.define('Fee', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    studentId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Students', key: 'id' } },
    courseId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Courses', key: 'id' } },
    amount: { type: DataTypes.DECIMAL(10, 2) },
    status: { type: DataTypes.ENUM('pending', 'paid', 'partial'), defaultValue: 'pending' },
    dueDate: { type: DataTypes.DATE },
    paidAt: { type: DataTypes.DATE },
    collegeId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Colleges', key: 'id' } },
  }, {
    timestamps: true,
    tableName: 'Fees',
  });
  return Fee;
};