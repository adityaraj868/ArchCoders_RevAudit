const db = require('../../src/models');

async function resetDb() {
  await db.sequelize.sync({ force: true });
}

async function closeDb() {
  await db.sequelize.close();
}

module.exports = { db, resetDb, closeDb };
