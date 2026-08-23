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

  // "local" or "s3" — src/services/storage picks the matching driver.
  // Callers never know which one is active.
  storageDriver: process.env.STORAGE_DRIVER || 'local',
  uploadDir: process.env.UPLOAD_DIR || defaultUploadDir,
  maxUploadSizeBytes: (parseInt(process.env.MAX_UPLOAD_SIZE_MB, 10) || 25) * 1024 * 1024,
  maxFilesPerUpload: parseInt(process.env.MAX_FILES_PER_UPLOAD, 10) || 20,

  // Only read/required when storageDriver is "s3" — see s3StorageService.js.
  // Never logged, never echoed back in any response.
  awsAccessKey: process.env.AWS_ACCESS_KEY,
  awsSecretKey: process.env.AWS_SECRET_KEY,
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  awsBucketName: process.env.AWS_BUCKET_NAME,
  // Optional. Leave unset to talk to real AWS. Only set this to point the
  // SDK at an S3-compatible endpoint instead (MinIO, other providers, local
  // testing) — production against real AWS never needs it.
  awsS3Endpoint: process.env.AWS_S3_ENDPOINT || undefined,
};

if (env.nodeEnv === 'production') {
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
  }
}

module.exports = env;
