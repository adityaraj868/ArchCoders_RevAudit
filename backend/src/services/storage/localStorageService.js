const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const env = require('../../config/env');

// Keep only a short, safe extension from the original filename — it's
// concatenated onto a random name, never used to build a path, so this is
// about tidy filenames, not path-traversal (there's nothing to traverse).
function safeExtension(originalName = '') {
  const ext = path.extname(originalName).slice(0, 10);
  return /^\.[a-zA-Z0-9]+$/.test(ext) ? ext : '';
}

// Namespaced by presentationId, which is always a UUID that has already
// been verified to exist in the database by the time this is called — never
// raw user input used as a path segment.
async function save({ buffer, originalName, presentationId }) {
  const dir = path.join(env.uploadDir, presentationId);
  await fs.mkdir(dir, { recursive: true });

  const filename = `${crypto.randomUUID()}${safeExtension(originalName)}`;
  await fs.writeFile(path.join(dir, filename), buffer);

  const storagePath = `${presentationId}/${filename}`;
  return { filename, storagePath };
}

function getUrl(storagePath) {
  return `/uploads/${storagePath}`;
}

module.exports = { save, getUrl };
