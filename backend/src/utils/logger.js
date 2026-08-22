const env = require('../config/env');

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LEVELS[env.logLevel] ?? LEVELS.info;

function timestamp() {
  return new Date().toISOString();
}

function write(level, message, meta) {
  if (LEVELS[level] > currentLevel) return;

  const line = `[${timestamp()}] [${level.toUpperCase()}] ${message}`;
  const out = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;

  if (meta !== undefined) {
    out(line, meta);
  } else {
    out(line);
  }
}

module.exports = {
  error: (message, meta) => write('error', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  info: (message, meta) => write('info', message, meta),
  debug: (message, meta) => write('debug', message, meta),
};
