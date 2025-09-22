// models/Notification.js
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING },
    message: { type: DataTypes.TEXT },
    channels: { type: DataTypes.ARRAY(DataTypes.STRING) },
    targets: { type: DataTypes.ARRAY(DataTypes.STRING) },
    meta: { type: DataTypes.JSONB },
    sentAt: { type: DataTypes.DATE },
    collegeId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Colleges', key: 'id' } },
  }, {
    timestamps: true,
    tableName: 'Notifications',
  });
  return Notification;
};
