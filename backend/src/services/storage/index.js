// Storage abstraction: every driver exports the same two-function shape —
//   save({ buffer, originalName, presentationId, mimeType }) -> Promise<{ filename, storagePath }>
//   getUrl(storagePath) -> string | Promise<string>
// Callers (file.service.js) only ever talk to this module, never to a
// specific driver, and always `await` getUrl() — the local driver resolves
// it synchronously, s3 has to call out to AWS to sign it, and `await` on a
// plain string is a no-op, so one call site works for both.
//
// Drivers are required lazily, by path, rather than all imported up front —
// s3StorageService validates its own AWS_* config at load time, and that
// must only run when STORAGE_DRIVER=s3 is actually selected. Eagerly
// requiring it would make local (the zero-config default) fail to start
// without AWS credentials it doesn't even need.
const env = require('../../config/env');

const DRIVER_MODULES = {
  local: './localStorageService',
  s3: './s3StorageService',
};

const modulePath = DRIVER_MODULES[env.storageDriver];
if (!modulePath) {
  throw new Error(
    `Unknown STORAGE_DRIVER "${env.storageDriver}" — expected one of: ${Object.keys(DRIVER_MODULES).join(', ')}`
  );
}

module.exports = require(modulePath);
