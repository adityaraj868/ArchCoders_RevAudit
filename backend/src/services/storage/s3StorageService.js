const crypto = require('crypto');
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const env = require('../../config/env');

const REQUIRED = ['awsAccessKey', 'awsSecretKey', 'awsRegion', 'awsBucketName'];
const missing = REQUIRED.filter((key) => !env[key]);
if (missing.length > 0) {
  throw new Error(
    'STORAGE_DRIVER=s3 requires AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_REGION, and AWS_BUCKET_NAME to all be set ' +
      `(missing: ${missing.map((key) => key.replace(/^aws/, 'AWS_').toUpperCase()).join(', ')})`
  );
}

// Credentials are read once, straight from process.env via config/env.js —
// they are never logged, never passed through req/res, and never appear in
// any value this module returns. Everything downstream only ever sees a
// storagePath (an object key) or a time-limited signed URL, never the key
// pair itself.
const clientConfig = {
  region: env.awsRegion,
  credentials: {
    accessKeyId: env.awsAccessKey,
    secretAccessKey: env.awsSecretKey,
  },
};

// Only set for S3-compatible endpoints (MinIO, other providers, local
// testing) — omitted entirely for real AWS, which is the default.
if (env.awsS3Endpoint) {
  clientConfig.endpoint = env.awsS3Endpoint;
  clientConfig.forcePathStyle = true;
}

const client = new S3Client(clientConfig);

// Same rule as the local driver: a short, safe extension appended to a
// random key, never used to construct a path — no injection surface.
function safeExtension(originalName = '') {
  const ext = path.extname(originalName).slice(0, 10);
  return /^\.[a-zA-Z0-9]+$/.test(ext) ? ext : '';
}

async function save({ buffer, originalName, presentationId, mimeType }) {
  const filename = `${crypto.randomUUID()}${safeExtension(originalName)}`;
  const storagePath = `${presentationId}/${filename}`;

  await client.send(
    new PutObjectCommand({
      Bucket: env.awsBucketName,
      Key: storagePath,
      Body: buffer,
      ContentType: mimeType || 'application/octet-stream',
      // No ACL is set — the bucket stays private by default (IAM-safe: the
      // app's own credentials are scoped to this bucket only, and nothing
      // is world-readable). Access is exclusively through the time-limited
      // signed URLs getUrl() produces below.
    })
  );

  return { filename, storagePath };
}

// A signed URL, not a public bucket URL — the bucket can (and should) stay
// private. Defaults to 1 hour; callers needing a longer-lived link (e.g. a
// public "open this deck" page) can pass a larger value.
async function getUrl(storagePath, { expiresInSeconds = 3600 } = {}) {
  const command = new GetObjectCommand({ Bucket: env.awsBucketName, Key: storagePath });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

module.exports = { save, getUrl };
