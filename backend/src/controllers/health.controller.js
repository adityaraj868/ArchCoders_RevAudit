const { testConnection } = require('../config/db');

function getHealth(req, res) {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}

async function getDbHealth(req, res) {
  const connected = await testConnection();
  res.status(connected ? 200 : 503).json({
    database: connected ? 'connected' : 'unavailable',
  });
}

module.exports = { getHealth, getDbHealth };
