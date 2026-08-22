const { Pool } = require('pg');
const env = require('./env');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: env.databaseUrl,
});

// A broken idle connection should be logged, not crash the process.
pool.on('error', (err) => {
  logger.error(`Unexpected error on idle PostgreSQL client: ${err.message}`);
});

async function testConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    logger.info('Database connection verified');
    return true;
  } catch (err) {
    logger.warn(`Database connection failed: ${err.message}`);
    return false;
  }
}

module.exports = { pool, testConnection };
