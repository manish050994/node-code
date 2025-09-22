// models/Log.js
module.exports = (sequelize, DataTypes) => {
  const Log = sequelize.define('Log', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    actor: { type: DataTypes.STRING },
    action: { type: DataTypes.STRING },
    target: { type: DataTypes.STRING },
    meta: { type: DataTypes.JSONB },
    at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    collegeId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Colleges', key: 'id' } },
  }, {
    timestamps: true,
    tableName: 'Logs',
  });
  return Log;
};