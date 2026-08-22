const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { testConnection } = require('./config/db');

const server = app.listen(env.port, async () => {
  logger.info(`RevAudit backend listening on port ${env.port} [${env.nodeEnv}]`);
  await testConnection();
});

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled promise rejection: ${err.message}`, { stack: err.stack });
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});
