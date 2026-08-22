// Storage abstraction: every driver exports the same two-function shape —
//   save({ buffer, originalName, presentationId }) -> Promise<{ filename, storagePath }>
//   getUrl(storagePath) -> string
// Callers (file.service.js) only ever talk to this module, never to a
// specific driver — swapping "local" for a future "s3" driver means adding
// one file here and changing STORAGE_DRIVER, nothing else.
const env = require('../../config/env');
const localStorageService = require('./localStorageService');

const DRIVERS = {
  local: localStorageService,
  // s3: will implement the same { save, getUrl } shape once AWS S3 is
  // actually wired up — deliberately not stubbed out before then.
};

const driver = DRIVERS[env.storageDriver];
if (!driver) {
  throw new Error(`Unknown STORAGE_DRIVER "${env.storageDriver}" — expected one of: ${Object.keys(DRIVERS).join(', ')}`);
}

module.exports = driver;
