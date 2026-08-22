const fileService = require('../services/file.service');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const uploadFiles = asyncHandler(async (req, res) => {
  const { presentationId } = req.body;
  if (!presentationId) {
    throw new AppError('presentationId is required', 400);
  }

  const files = await fileService.uploadFiles({
    presentationId,
    files: req.files,
    uploadedBy: req.user.id,
  });

  res.status(201).json({ files });
});

module.exports = { uploadFiles };
