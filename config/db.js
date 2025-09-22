const { Sequelize } = require('sequelize');
const config = require('./config.js')[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: config.dialect,
  logging: config.logging ? console.log : false,
});

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected');
  } catch (error) {
    console.error('Unable to connect to PostgreSQL:', error);
    process.exit(1);
  }
}

module.exports = { sequelize, connectDB };
