// Set before anything requires src/config/env.js, so this file's isolated
// module registry picks up a small size limit — lets the size-limit test
// use a small buffer instead of actually allocating 25MB+.
const ORIGINAL_MAX_MB = process.env.MAX_UPLOAD_SIZE_MB;
process.env.MAX_UPLOAD_SIZE_MB = '1';

const request = require('supertest');
const app = require('../src/app');
const { db, resetDb, closeDb } = require('./helpers/db');

const { User } = db;

let adminToken;
let userToken;
let draftId;
let publishedId;

beforeAll(async () => {
  await resetDb();
  await User.create({ name: 'Admin', email: 'admin@example.com', passwordHash: 'correct-horse', role: 'ADMIN' });
  await User.create({ name: 'User', email: 'user@example.com', passwordHash: 'correct-horse', role: 'USER' });

  adminToken = (
    await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'correct-horse' })
  ).body.token;
  userToken = (
    await request(app).post('/api/auth/login').send({ email: 'user@example.com', password: 'correct-horse' })
  ).body.token;

  const draft = await request(app)
    .post('/api/presentations')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ title: 'Planning Presentation', version: '1.0', date: '2026-08-22', authors: ['Someone'] });
  draftId = draft.body.presentation.id;

  const toPublish = await request(app)
    .post('/api/presentations')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ title: 'Already Live', version: '1.0', date: '2026-08-22', authors: ['Someone'] });
  publishedId = toPublish.body.presentation.id;
  await request(app)
    .put(`/api/presentations/${publishedId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ published: true });
});

afterAll(async () => {
  if (ORIGINAL_MAX_MB === undefined) delete process.env.MAX_UPLOAD_SIZE_MB;
  else process.env.MAX_UPLOAD_SIZE_MB = ORIGINAL_MAX_MB;
  await closeDb();
});

const attachPdf = (req, filename = 'deck.pdf') =>
  req.attach('files', Buffer.from('%PDF-1.4 fake pdf content'), { filename, contentType: 'application/pdf' });

describe('POST /api/files/upload', () => {
  test('rejects an unauthenticated request with 401', async () => {
    const res = await attachPdf(request(app).post('/api/files/upload').field('presentationId', draftId));
    expect(res.status).toBe(401);
  });

  test('rejects a non-admin request with 403', async () => {
    const res = await attachPdf(
      request(app).post('/api/files/upload').set('Authorization', `Bearer ${userToken}`).field('presentationId', draftId)
    );
    expect(res.status).toBe(403);
  });

  test('an admin can upload a single PDF linked to a presentation', async () => {
    const res = await attachPdf(
      request(app).post('/api/files/upload').set('Authorization', `Bearer ${adminToken}`).field('presentationId', draftId)
    );

    expect(res.status).toBe(201);
    expect(res.body.files).toHaveLength(1);
    expect(res.body.files[0].presentationId).toBe(draftId);
    expect(res.body.files[0].originalName).toBe('deck.pdf');
    expect(res.body.files[0].type).toBe('application/pdf');
    expect(res.body.files[0].uploadedBy).toBeDefined();
    expect(res.body.files[0].url).toBeDefined();
  });

  test('uploads multiple files in one request, approximating a folder upload', async () => {
    const res = await request(app)
      .post('/api/files/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('presentationId', draftId)
      .attach('files', Buffer.from('image-bytes-1'), { filename: 'slide1.png', contentType: 'image/png' })
      .attach('files', Buffer.from('image-bytes-2'), { filename: 'slide2.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.files).toHaveLength(2);
    expect(res.body.files.map((f) => f.originalName).sort()).toEqual(['slide1.png', 'slide2.png']);
  });

  test('rejects a disallowed file type with 400', async () => {
    const res = await request(app)
      .post('/api/files/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('presentationId', draftId)
      .attach('files', Buffer.from('#!/bin/sh\necho hi'), { filename: 'script.sh', contentType: 'application/x-sh' });

    expect(res.status).toBe(400);
  });

  test('rejects a file over the configured size limit with 400', async () => {
    const oversized = Buffer.alloc(2 * 1024 * 1024); // 2MB, over this suite's 1MB test limit
    const res = await request(app)
      .post('/api/files/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('presentationId', draftId)
      .attach('files', oversized, { filename: 'big.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/exceeds the maximum/i);
  });

  test('rejects a request with no presentationId with 400', async () => {
    const res = await attachPdf(request(app).post('/api/files/upload').set('Authorization', `Bearer ${adminToken}`));
    expect(res.status).toBe(400);
  });

  test('rejects a request targeting a presentation that does not exist with 404', async () => {
    const res = await attachPdf(
      request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('presentationId', '00000000-0000-0000-0000-000000000000')
    );
    expect(res.status).toBe(404);
  });

  test('rejects uploading to an already-published presentation with 409', async () => {
    const res = await attachPdf(
      request(app).post('/api/files/upload').set('Authorization', `Bearer ${adminToken}`).field('presentationId', publishedId)
    );
    expect(res.status).toBe(409);
  });
});

describe('GET /api/files/:id/url', () => {
  let draftFileId;
  let publishedFileId;

  beforeAll(async () => {
    const draftUpload = await attachPdf(
      request(app).post('/api/files/upload').set('Authorization', `Bearer ${adminToken}`).field('presentationId', draftId),
      'draft-file.pdf'
    );
    draftFileId = draftUpload.body.files[0].id;

    // A fresh presentation, uploaded to while still a draft, published only
    // after the file is attached — mirrors the real publish workflow.
    const forUrlTest = await request(app)
      .post('/api/presentations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'URL Test Deck', version: '1.0', date: '2026-08-22', authors: ['Someone'] });
    const forUrlTestId = forUrlTest.body.presentation.id;

    const publishedUpload = await attachPdf(
      request(app).post('/api/files/upload').set('Authorization', `Bearer ${adminToken}`).field('presentationId', forUrlTestId),
      'published-file.pdf'
    );
    publishedFileId = publishedUpload.body.files[0].id;

    await request(app)
      .put(`/api/presentations/${forUrlTestId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ published: true });
  });

  test('anyone can resolve a URL for a file on a published presentation', async () => {
    const res = await request(app).get(`/api/files/${publishedFileId}/url`);
    expect(res.status).toBe(200);
    expect(res.body.url).toBeDefined();
  });

  test('an anonymous request for a file on a draft presentation gets 404', async () => {
    const res = await request(app).get(`/api/files/${draftFileId}/url`);
    expect(res.status).toBe(404);
  });

  test('an admin can resolve a URL for a file on a draft presentation', async () => {
    const res = await request(app).get(`/api/files/${draftFileId}/url`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.url).toBeDefined();
  });

  test('a nonexistent file id gets 404', async () => {
    const res = await request(app)
      .get('/api/files/00000000-0000-0000-0000-000000000000/url')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  test('the URL the local driver returns is actually servable, not just a path string', async () => {
    const urlRes = await request(app)
      .get(`/api/files/${publishedFileId}/url`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Local driver returns a path relative to the API server, e.g.
    // "/uploads/<presentationId>/<filename>" — fetch it directly and
    // confirm the app actually serves real file bytes there, not a 404.
    // (supertest leaves application/pdf unparsed in `.text`/`.body`, so
    // Content-Length is the reliable signal that real bytes came back.)
    const fileRes = await request(app).get(urlRes.body.url);
    expect(fileRes.status).toBe(200);
    expect(fileRes.headers['content-type']).toMatch(/application\/pdf/);
    expect(Number(fileRes.headers['content-length'])).toBeGreaterThan(0);
  });
});
