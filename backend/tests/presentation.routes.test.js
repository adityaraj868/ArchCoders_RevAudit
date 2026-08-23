const request = require('supertest');
const app = require('../src/app');
const { db, resetDb, closeDb } = require('./helpers/db');

const { User } = db;

let adminToken;
let userToken;

beforeAll(async () => {
  await resetDb();
  await User.create({ name: 'Admin', email: 'admin@example.com', passwordHash: 'correct-horse', role: 'ADMIN' });
  await User.create({ name: 'User', email: 'user@example.com', passwordHash: 'correct-horse', role: 'USER' });

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@example.com', password: 'correct-horse' });
  adminToken = adminLogin.body.token;

  const userLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'user@example.com', password: 'correct-horse' });
  userToken = userLogin.body.token;
});

afterAll(() => closeDb());

const asAdmin = (req) => req.set('Authorization', `Bearer ${adminToken}`);
const asUser = (req) => req.set('Authorization', `Bearer ${userToken}`);

const validPayload = (overrides = {}) => ({
  title: 'Planning Presentation',
  version: '1.0',
  date: '2026-08-22',
  authors: ['Dheeraj Kumar'],
  changeSummary: 'Initial scope approval',
  ...overrides,
});

describe('POST /api/presentations', () => {
  test('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).post('/api/presentations').send(validPayload());
    expect(res.status).toBe(401);
  });

  test('rejects a non-admin request with 403', async () => {
    const res = await asUser(request(app).post('/api/presentations')).send(validPayload());
    expect(res.status).toBe(403);
  });

  test('an admin can create a new presentation version', async () => {
    const res = await asAdmin(request(app).post('/api/presentations')).send(validPayload());

    expect(res.status).toBe(201);
    expect(res.body.presentation.title).toBe('Planning Presentation');
    expect(res.body.presentation.version).toBe('1.0');
    expect(res.body.presentation.published).toBe(false);
  });

  test('rejects a duplicate title + version with 409', async () => {
    const res = await asAdmin(request(app).post('/api/presentations')).send(validPayload());
    expect(res.status).toBe(409);
  });
});

describe('version history rules', () => {
  let v1Id;

  beforeAll(async () => {
    const res = await asAdmin(request(app).post('/api/presentations')).send(
      validPayload({ title: 'Mid-term Review', version: '1.0' })
    );
    v1Id = res.body.presentation.id;
    await asAdmin(request(app).put(`/api/presentations/${v1Id}`)).send({ published: true });
  });

  test('publishing v1 succeeds and it becomes publicly visible', async () => {
    const res = await request(app).get(`/api/presentations/${v1Id}`);
    expect(res.status).toBe(200);
    expect(res.body.presentation.published).toBe(true);
  });

  test('uploading v2 does not touch or replace v1 — both exist as separate rows', async () => {
    const v2Res = await asAdmin(request(app).post('/api/presentations')).send(
      validPayload({ title: 'Mid-term Review', version: '2.0', changeSummary: 'Updated baselines' })
    );
    expect(v2Res.status).toBe(201);
    const v2Id = v2Res.body.presentation.id;

    // v1 is completely unaffected — same id, still published, still there.
    const v1Res = await request(app).get(`/api/presentations/${v1Id}`);
    expect(v1Res.status).toBe(200);
    expect(v1Res.body.presentation.version).toBe('1.0');
    expect(v1Res.body.presentation.published).toBe(true);

    // v2 is a distinct row, currently unpublished.
    const v2Get = await request(app).get(`/api/presentations/${v2Id}`);
    expect(v2Get.status).toBe(404); // unpublished, not visible to anonymous callers yet
    const v2GetAsAdmin = await asAdmin(request(app).get(`/api/presentations/${v2Id}`));
    expect(v2GetAsAdmin.status).toBe(200);
    expect(v2GetAsAdmin.body.presentation.version).toBe('2.0');
  });

  test('v1 remains forever: no way to delete a published version, and no route even offers to', async () => {
    // There is deliberately no DELETE /api/presentations/:id route at all.
    const res = await asAdmin(request(app).delete(`/api/presentations/${v1Id}`));
    expect(res.status).toBe(404); // no route matches DELETE on this path
  });

  test('a published version cannot be edited again, even by an admin', async () => {
    const res = await asAdmin(request(app).put(`/api/presentations/${v1Id}`)).send({
      changeSummary: 'Trying to change history',
    });
    expect(res.status).toBe(409);

    const stillOriginal = await request(app).get(`/api/presentations/${v1Id}`);
    expect(stillOriginal.body.presentation.changeSummary).toBe('Initial scope approval');
  });

  test('title and version can never be changed via PUT, even while still a draft', async () => {
    const draft = await asAdmin(request(app).post('/api/presentations')).send(
      validPayload({ title: 'Still A Draft', version: '1.0' })
    );

    const res = await asAdmin(request(app).put(`/api/presentations/${draft.body.presentation.id}`)).send({
      title: 'Renamed',
      version: '9.9',
      changeSummary: 'Legit update',
    });

    expect(res.status).toBe(200);
    expect(res.body.presentation.title).toBe('Still A Draft'); // ignored
    expect(res.body.presentation.version).toBe('1.0'); // ignored
    expect(res.body.presentation.changeSummary).toBe('Legit update'); // this one applied
  });
});

describe('GET /api/presentations visibility', () => {
  test('anonymous callers only see published presentations', async () => {
    await asAdmin(request(app).post('/api/presentations')).send(
      validPayload({ title: 'Hidden Draft', version: '1.0' })
    );

    const res = await request(app).get('/api/presentations');
    expect(res.status).toBe(200);
    expect(res.body.presentations.every((p) => p.published)).toBe(true);
    expect(res.body.presentations.some((p) => p.title === 'Hidden Draft')).toBe(false);
  });

  test('an authenticated admin sees drafts too', async () => {
    const res = await asAdmin(request(app).get('/api/presentations'));
    expect(res.status).toBe(200);
    expect(res.body.presentations.some((p) => p.title === 'Hidden Draft')).toBe(true);
  });

  test('a non-admin PUT is rejected with 403 even for a draft they could see', async () => {
    const draft = await asAdmin(request(app).post('/api/presentations')).send(
      validPayload({ title: 'Viewer Cannot Touch', version: '1.0' })
    );

    const res = await asUser(request(app).put(`/api/presentations/${draft.body.presentation.id}`)).send({
      published: true,
    });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/presentations/:id includes attached files', () => {
  test('a presentation with an uploaded file returns it in the response', async () => {
    const created = await asAdmin(request(app).post('/api/presentations')).send(
      validPayload({ title: 'Has A File', version: '1.0' })
    );
    const id = created.body.presentation.id;

    await asAdmin(request(app).post('/api/files/upload'))
      .field('presentationId', id)
      .attach('files', Buffer.from('%PDF-1.4 fake pdf content'), {
        filename: 'deck.pdf',
        contentType: 'application/pdf',
      });

    const res = await asAdmin(request(app).get(`/api/presentations/${id}`));

    expect(res.status).toBe(200);
    expect(res.body.presentation.files).toHaveLength(1);
    expect(res.body.presentation.files[0].originalName).toBe('deck.pdf');
  });

  test('a presentation with no files returns an empty array, not undefined', async () => {
    const created = await asAdmin(request(app).post('/api/presentations')).send(
      validPayload({ title: 'No Files Yet', version: '1.0' })
    );

    const res = await asAdmin(request(app).get(`/api/presentations/${created.body.presentation.id}`));

    expect(res.body.presentation.files).toEqual([]);
  });
});
