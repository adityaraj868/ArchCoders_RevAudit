const { Presentation } = require('../models');
const AppError = require('../utils/AppError');

// Only these fields can ever change on an existing presentation — title and
// version are permanent identity, set once at creation. This is what makes
// "uploading v2" impossible to confuse with "editing v1": there is no field
// through which a client could repoint an existing row at different content.
const MUTABLE_FIELDS = ['authors', 'date', 'changeSummary', 'published'];

function isAdmin(user) {
  return Boolean(user && user.role === 'admin');
}

async function create({ title, version, date, authors, changeSummary, published }, createdBy) {
  return Presentation.create({
    title,
    version,
    date,
    authors,
    changeSummary,
    published: Boolean(published),
    createdBy,
  });
}

async function list(requester) {
  const where = isAdmin(requester) ? {} : { published: true };
  return Presentation.findAll({
    where,
    order: [
      ['title', 'ASC'],
      ['version', 'ASC'],
    ],
  });
}

async function getById(id, requester) {
  const presentation = await Presentation.findByPk(id);

  // Same 404 whether the row doesn't exist or it's an unpublished draft a
  // non-admin has no business seeing — don't confirm a draft's existence to
  // an unauthorized caller.
  if (!presentation || (!presentation.published && !isAdmin(requester))) {
    throw new AppError('Presentation not found', 404);
  }

  return presentation;
}

async function update(id, updates) {
  const presentation = await Presentation.findByPk(id);
  if (!presentation) {
    throw new AppError('Presentation not found', 404);
  }

  for (const field of MUTABLE_FIELDS) {
    if (field in updates) {
      presentation[field] = updates[field];
    }
  }

  // Model hooks enforce the actual immutability rules (title/version never
  // change; nothing changes once published) — this call is where those
  // would throw.
  await presentation.save();
  return presentation;
}

module.exports = { create, list, getById, update };
