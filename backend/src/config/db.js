const { sequelize } = require('../models');
const logger = require('../utils/logger');

async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection verified');
    return true;
  } catch (err) {
    logger.warn(`Database connection failed: ${err.message}`);
    return false;
  }
}

module.exports = { sequelize, testConnection };
