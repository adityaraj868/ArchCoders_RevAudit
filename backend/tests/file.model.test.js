const { db, resetDb, closeDb } = require('./helpers/db');

const { User, Presentation, File } = db;

let creator, presentation;

beforeAll(async () => {
  await resetDb();
  creator = await User.create({
    name: 'Sparsh Khandelwal',
    email: 'uploader@example.com',
    passwordHash: 'correct-horse',
    role: 'ADMIN',
  });
  presentation = await Presentation.create({
    title: 'Planning Presentation',
    version: '1.0',
    authors: ['Sparsh Khandelwal'],
    date: '2026-08-22',
    createdBy: creator.id,
  });
});

afterAll(() => closeDb());

describe('File model', () => {
  test('creates a valid file linked to a presentation and its uploader', async () => {
    const file = await File.create({
      filename: 'a1b2c3.pdf',
      originalName: 'planning-v1.pdf',
      storagePath: 'uploads/a1b2c3.pdf',
      size: 204800,
      type: 'application/pdf',
      presentationId: presentation.id,
      uploadedBy: creator.id,
    });

    expect(file.id).toBeDefined();

    const found = await File.findByPk(file.id, { include: ['presentation', 'uploader'] });
    expect(found.presentation.id).toBe(presentation.id);
    expect(found.uploader.id).toBe(creator.id);
  });

  test('rejects a disallowed mime type', async () => {
    await expect(
      File.create({
        filename: 'malware.exe',
        originalName: 'malware.exe',
        storagePath: 'uploads/malware.exe',
        size: 1024,
        type: 'application/x-msdownload',
        presentationId: presentation.id,
        uploadedBy: creator.id,
      })
    ).rejects.toThrow();
  });

  test('rejects a non-positive size', async () => {
    await expect(
      File.create({
        filename: 'empty.pdf',
        originalName: 'empty.pdf',
        storagePath: 'uploads/empty.pdf',
        size: 0,
        type: 'application/pdf',
        presentationId: presentation.id,
        uploadedBy: creator.id,
      })
    ).rejects.toThrow();
  });

  test('rejects a missing required field', async () => {
    await expect(
      File.create({
        originalName: 'no-filename.pdf',
        storagePath: 'uploads/no-filename.pdf',
        size: 1024,
        type: 'application/pdf',
        presentationId: presentation.id,
        uploadedBy: creator.id,
      })
    ).rejects.toThrow();
  });

  test("a presentation's files are reachable through the association", async () => {
    const files = await presentation.getFiles();
    expect(files.length).toBeGreaterThan(0);
    expect(files.every((f) => f.presentationId === presentation.id)).toBe(true);
  });
});
