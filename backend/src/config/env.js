require('dotenv').config();

const REQUIRED_IN_PRODUCTION = ['DATABASE_URL', 'CORS_ORIGIN'];

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4000,
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/revaudit',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  logLevel: process.env.LOG_LEVEL || 'info',
};

if (env.nodeEnv === 'production') {
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
  }
}

module.exports = env;
