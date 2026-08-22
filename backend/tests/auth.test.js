const request = require('supertest');
const app = require('../src/app');
const { db, resetDb, closeDb } = require('./helpers/db');

const { User } = db;

beforeAll(() => resetDb());
afterAll(() => closeDb());

async function createAdmin(email = 'admin@example.com') {
  return User.create({ name: 'Dheeraj Kumar', email, password: 'correct-horse', role: 'admin' });
}

describe('POST /api/auth/register', () => {
  test('creates a new account and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Sparsh Khandelwal',
      email: 'sparsh@example.com',
      password: 'correct-horse',
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('sparsh@example.com');
    expect(res.body.user.password).toBeUndefined();
  });

  test('never allows the client to self-grant the admin role', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Trying To Escalate',
      email: 'escalate@example.com',
      password: 'correct-horse',
      role: 'admin',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('viewer');
  });

  test('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'First',
      email: 'duplicate@example.com',
      password: 'correct-horse',
    });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Second',
      email: 'duplicate@example.com',
      password: 'correct-horse',
    });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  beforeAll(() => createAdmin());

  test('successful login returns a token and the user profile', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'correct-horse',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('admin@example.com');
    expect(res.body.user.role).toBe('admin');
  });

  test('wrong password is rejected with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'wrong-password',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/invalid email or password/i);
  });

  test('unknown email is rejected with the same 401 message', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'whatever123',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/invalid email or password/i);
  });
});

describe('Protected routes', () => {
  test('GET /api/auth/me without a token is rejected with 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me with a garbage token is rejected with 401', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me with a valid token succeeds', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'correct-horse',
    });

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('admin@example.com');
  });

  test('a viewer is blocked from the admin dashboard with 403', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: 'sparsh@example.com',
      password: 'correct-horse',
    });

    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(res.status).toBe(403);
  });

  test('an admin can reach the admin dashboard', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'correct-horse',
    });

    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.presentations.total).toBeDefined();
  });
});
