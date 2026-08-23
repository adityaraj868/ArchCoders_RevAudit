const fileService = require('../services/file.service');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const uploadFiles = asyncHandler(async (req, res) => {
  const { presentationId } = req.body;
  if (!presentationId) {
    throw new AppError('presentationId is required', 400);
  }

  const uploaded = await fileService.uploadFiles({
    presentationId,
    files: req.files,
    uploadedBy: req.user.id,
  });

  res.status(201).json({
    files: uploaded.map(({ record, url }) => ({ ...record.toJSON(), url })),
  });
});

// Signed URLs expire, so this is a live lookup, not a cached value —
// callers ask for a fresh one whenever they actually need to open the file.
const getFileUrl = asyncHandler(async (req, res) => {
  const url = await fileService.getFileUrl(req.params.id, req.user);
  res.json({ url });
});

module.exports = { uploadFiles, getFileUrl };
