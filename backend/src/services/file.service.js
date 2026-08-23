const { File, Presentation } = require('../models');
const AppError = require('../utils/AppError');
const storageService = require('./storage');

function isAdmin(user) {
  return Boolean(user && user.role === 'admin');
}

async function uploadFiles({ presentationId, files, uploadedBy }) {
  const presentation = await Presentation.findByPk(presentationId);
  if (!presentation) {
    throw new AppError('Presentation not found', 404);
  }
  // A published version is frozen (see Presentation model) — its set of
  // files is part of that, so new uploads can't attach after the fact.
  if (presentation.published) {
    throw new AppError('Cannot add files to a published presentation version', 409);
  }
  if (!files || files.length === 0) {
    throw new AppError('At least one file is required', 400);
  }

  const created = [];
  for (const file of files) {
    const { filename, storagePath } = await storageService.save({
      buffer: file.buffer,
      originalName: file.originalname,
      presentationId,
      mimeType: file.mimetype,
    });

    const record = await File.create({
      filename,
      originalName: file.originalname,
      storagePath,
      size: file.size,
      type: file.mimetype,
      presentationId,
      uploadedBy,
    });

    created.push({ record, url: await storageService.getUrl(storagePath) });
  }

  return created;
}

// Mints a fresh URL on demand rather than persisting one — S3 signed URLs
// expire, so a URL generated at upload time would eventually stop working.
// Same visibility rule as presentations: a file on an unpublished draft is
// only resolvable by an admin.
async function getFileUrl(fileId, requester) {
  const file = await File.findByPk(fileId, { include: { association: 'presentation' } });

  if (!file || (!file.presentation.published && !isAdmin(requester))) {
    throw new AppError('File not found', 404);
  }

  return storageService.getUrl(file.storagePath);
}

module.exports = { uploadFiles, getFileUrl };
