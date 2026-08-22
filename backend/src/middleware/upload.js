const multer = require('multer');
const env = require('../config/env');
const { File } = require('../models');
const AppError = require('../utils/AppError');

// memoryStorage() so multer only ever parses multipart into buffers — where
// those bytes actually end up (disk today, S3 later) is entirely the
// storage service's decision, not this middleware's.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxUploadSizeBytes,
    files: env.maxFilesPerUpload,
  },
  fileFilter: (req, file, cb) => {
    if (!File.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new AppError(`Unsupported file type: ${file.mimetype}`, 400));
      return;
    }
    cb(null, true);
  },
});

// A single field, "files", accepting multiple entries — a "folder" upload is
// just the browser expanding a directory picker into several File objects
// client-side and sending them all under this one field.
module.exports = upload.array('files', env.maxFilesPerUpload);
