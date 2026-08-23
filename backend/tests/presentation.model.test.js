const { db, resetDb, closeDb } = require('./helpers/db');

const { User, Presentation } = db;

let creator;

beforeAll(async () => {
  await resetDb();
  creator = await User.create({
    name: 'Dheeraj Kumar',
    email: 'creator@example.com',
    passwordHash: 'correct-horse',
    role: 'ADMIN',
  });
});

afterAll(() => closeDb());

describe('Presentation model', () => {
  test('creates a valid presentation, unpublished by default', async () => {
    const presentation = await Presentation.create({
      title: 'Planning Presentation',
      version: '1.0',
      authors: ['Dheeraj Kumar', 'Vaibhav Goyal'],
      date: '2026-08-22',
      changeSummary: 'Initial scope approval and statistical model designs',
      createdBy: creator.id,
    });

    expect(presentation.published).toBe(false);
    expect(presentation.authors).toEqual(['Dheeraj Kumar', 'Vaibhav Goyal']);
  });

  test('round-trips the authors array through JSON storage', async () => {
    const presentation = await Presentation.create({
      title: 'Mid-term Review',
      version: '1.0',
      authors: ['Adityaraj Singh'],
      date: '2026-10-01',
      createdBy: creator.id,
    });

    const fetched = await Presentation.findByPk(presentation.id);
    expect(Array.isArray(fetched.authors)).toBe(true);
    expect(fetched.authors).toEqual(['Adityaraj Singh']);
  });

  test('rejects an empty authors list', async () => {
    await expect(
      Presentation.create({
        title: 'No Authors',
        version: '1.0',
        authors: [],
        date: '2026-08-22',
        createdBy: creator.id,
      })
    ).rejects.toThrow();
  });

  test('rejects a malformed version string', async () => {
    await expect(
      Presentation.create({
        title: 'Bad Version',
        version: 'v1',
        authors: ['Someone'],
        date: '2026-08-22',
        createdBy: creator.id,
      })
    ).rejects.toThrow();
  });

  test('rejects a duplicate title + version pair', async () => {
    await Presentation.create({
      title: 'Final Presentation',
      version: '1.0',
      authors: ['Someone'],
      date: '2026-12-01',
      createdBy: creator.id,
    });

    await expect(
      Presentation.create({
        title: 'Final Presentation',
        version: '1.0',
        authors: ['Someone Else'],
        date: '2026-12-02',
        createdBy: creator.id,
      })
    ).rejects.toThrow();
  });

  test('resolves its creator through the association', async () => {
    const presentation = await Presentation.create({
      title: 'Association Check',
      version: '1.0',
      authors: ['Someone'],
      date: '2026-08-22',
      createdBy: creator.id,
    });

    const found = await Presentation.findByPk(presentation.id, { include: 'creator' });
    expect(found.creator.id).toBe(creator.id);
    expect(found.creator.name).toBe('Dheeraj Kumar');
  });

  describe('version-history immutability', () => {
    test('allows editing mutable fields while unpublished', async () => {
      const presentation = await Presentation.create({
        title: 'Draft In Progress',
        version: '1.0',
        authors: ['Someone'],
        date: '2026-08-22',
        createdBy: creator.id,
      });

      presentation.changeSummary = 'Updated before publishing';
      await expect(presentation.save()).resolves.not.toThrow();
      expect(presentation.changeSummary).toBe('Updated before publishing');
    });

    test('rejects changing the title after creation', async () => {
      const presentation = await Presentation.create({
        title: 'Original Title',
        version: '1.0',
        authors: ['Someone'],
        date: '2026-08-22',
        createdBy: creator.id,
      });

      presentation.title = 'Renamed Title';
      await expect(presentation.save()).rejects.toThrow(/title and version/i);
    });

    test('rejects changing the version after creation', async () => {
      const presentation = await Presentation.create({
        title: 'Version Lock Check',
        version: '1.0',
        authors: ['Someone'],
        date: '2026-08-22',
        createdBy: creator.id,
      });

      presentation.version = '2.0';
      await expect(presentation.save()).rejects.toThrow(/title and version/i);
    });

    test('rejects any further edit once published', async () => {
      const presentation = await Presentation.create({
        title: 'Publish Once',
        version: '1.0',
        authors: ['Someone'],
        date: '2026-08-22',
        createdBy: creator.id,
        published: true,
      });

      presentation.changeSummary = 'Trying to sneak in a change';
      await expect(presentation.save()).rejects.toThrow(/immutable/i);
    });

    test('allows publishing a draft exactly once', async () => {
      const presentation = await Presentation.create({
        title: 'About To Publish',
        version: '1.0',
        authors: ['Someone'],
        date: '2026-08-22',
        createdBy: creator.id,
      });

      presentation.published = true;
      await expect(presentation.save()).resolves.not.toThrow();
      expect(presentation.published).toBe(true);
    });

    test('blocks deleting a published presentation', async () => {
      const presentation = await Presentation.create({
        title: 'Immutable Once Published',
        version: '1.0',
        authors: ['Someone'],
        date: '2026-08-22',
        createdBy: creator.id,
        published: true,
      });

      await expect(presentation.destroy()).rejects.toThrow(/published/i);
    });

    test('allows deleting a draft presentation', async () => {
      const presentation = await Presentation.create({
        title: 'Deletable Draft',
        version: '1.0',
        authors: ['Someone'],
        date: '2026-08-22',
        createdBy: creator.id,
      });

      await expect(presentation.destroy()).resolves.not.toThrow();
    });
  });
});
