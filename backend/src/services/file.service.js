const { File, Presentation } = require('../models');
const AppError = require('../utils/AppError');
const storageService = require('./storage');

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
    });

    created.push(
      await File.create({
        filename,
        originalName: file.originalname,
        storagePath,
        size: file.size,
        type: file.mimetype,
        presentationId,
        uploadedBy,
      })
    );
  }

  return created;
}

module.exports = { uploadFiles };
