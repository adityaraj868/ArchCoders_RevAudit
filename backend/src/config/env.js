const path = require('path');
const os = require('os');
require('dotenv').config();

const REQUIRED_IN_PRODUCTION = ['DATABASE_URL', 'CORS_ORIGIN', 'JWT_SECRET'];

// Tests get their own upload directory under the OS temp folder so a test
// run never writes into (or has to clean up) the repo's real uploads/ dir.
const defaultUploadDir =
  process.env.NODE_ENV === 'test'
    ? path.join(os.tmpdir(), 'revaudit-test-uploads')
    : path.resolve(__dirname, '../../uploads');

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4000,
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/revaudit',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  // Default to quiet in tests so expected 4xx paths (wrong password, no
  // token, etc.) don't spam the test runner's output — override with
  // LOG_LEVEL if you actually want to see it.
  logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'error' : 'info'),
  jwtSecret: process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',

  // "local" today; a future "s3" driver plugs into the same interface in
  // src/services/storage without any caller needing to change.
  storageDriver: process.env.STORAGE_DRIVER || 'local',
  uploadDir: process.env.UPLOAD_DIR || defaultUploadDir,
  maxUploadSizeBytes: (parseInt(process.env.MAX_UPLOAD_SIZE_MB, 10) || 25) * 1024 * 1024,
  maxFilesPerUpload: parseInt(process.env.MAX_FILES_PER_UPLOAD, 10) || 20,
};

if (env.nodeEnv === 'production') {
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
  }
}

module.exports = env;
