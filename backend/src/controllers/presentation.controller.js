const presentationService = require('../services/presentation.service');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const createPresentation = asyncHandler(async (req, res) => {
  const { title, version, date, authors, changeSummary, published } = req.body;

  if (!title || !version || !date || !authors) {
    throw new AppError('title, version, date, and authors are required', 400);
  }

  const presentation = await presentationService.create(
    { title, version, date, authors, changeSummary, published },
    req.user.id
  );
  res.status(201).json({ presentation });
});

const listPresentations = asyncHandler(async (req, res) => {
  const presentations = await presentationService.list(req.user);
  res.json({ presentations });
});

const getPresentation = asyncHandler(async (req, res) => {
  const presentation = await presentationService.getById(req.params.id, req.user);
  res.json({ presentation });
});

const updatePresentation = asyncHandler(async (req, res) => {
  const presentation = await presentationService.update(req.params.id, req.body);
  res.json({ presentation });
});

module.exports = { createPresentation, listPresentations, getPresentation, updatePresentation };
