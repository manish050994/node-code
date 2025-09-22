// models/Message.js
module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fromId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' } },
    toId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' } },
    message: { type: DataTypes.TEXT },
    sentAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    timestamps: true,
    tableName: 'Messages',
  });
  return Message;
};