const request = require('supertest');
const app = require('../src/app');
const { db, resetDb, closeDb } = require('./helpers/db');

const { User, AuditLog } = db;

let headAdminToken;
let headAdminId;

beforeAll(async () => {
  await resetDb();
  const headAdmin = await User.create({
    name: 'Dr. Sukhpal Singh',
    email: 'head@example.com',
    passwordHash: 'correct-horse',
    role: 'HEAD_ADMIN',
  });
  headAdminId = headAdmin.id;

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'head@example.com', password: 'correct-horse' });
  headAdminToken = login.body.token;
});

afterAll(() => closeDb());

const asHeadAdmin = (req) => req.set('Authorization', `Bearer ${headAdminToken}`);

async function loginAs(email, password = 'correct-horse') {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
}

describe('1. HEAD_ADMIN creates ADMIN', () => {
  test('is allowed', async () => {
    const res = await asHeadAdmin(request(app).post('/api/admin/users')).send({
      name: 'Adityaraj Singh',
      email: 'newadmin@example.com',
      password: 'correct-horse',
      role: 'ADMIN',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('ADMIN');
    expect(res.body.user.createdBy).toBe(headAdminId);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  test('is recorded in the audit log', async () => {
    const created = await User.findOne({ where: { email: 'newadmin@example.com' } });
    const entry = await AuditLog.findOne({ where: { action: 'CREATE_USER', targetUser: created.id } });

    expect(entry).not.toBeNull();
    expect(entry.performedBy).toBe(headAdminId);
    expect(entry.details).toEqual({ role: 'ADMIN' });
  });

  test('HEAD_ADMIN can also create a plain USER', async () => {
    const res = await asHeadAdmin(request(app).post('/api/admin/users')).send({
      name: 'Regular User',
      email: 'regularuser@example.com',
      password: 'correct-horse',
      role: 'USER',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('USER');
  });

  test('cannot create another HEAD_ADMIN through this endpoint', async () => {
    const res = await asHeadAdmin(request(app).post('/api/admin/users')).send({
      name: 'Wannabe Head',
      email: 'wannabehead@example.com',
      password: 'correct-horse',
      role: 'HEAD_ADMIN',
    });

    expect(res.status).toBe(400);
  });
});

describe('2. ADMIN creates ADMIN', () => {
  let adminToken;

  beforeAll(async () => {
    adminToken = await loginAs('newadmin@example.com');
  });

  test('is denied', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Another Admin', email: 'anotheradmin@example.com', password: 'correct-horse', role: 'ADMIN' });

    expect(res.status).toBe(403);
  });

  test('an ADMIN cannot list users either — user management is HEAD_ADMIN-only', async () => {
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
  });

  test('an ADMIN can still reach the ordinary admin dashboard', async () => {
    const res = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

describe('3. USER accesses admin route', () => {
  let userToken;

  beforeAll(async () => {
    userToken = await loginAs('regularuser@example.com');
  });

  test('is denied on the dashboard', async () => {
    const res = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  test('is denied on user management', async () => {
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  test('is denied on presentation writes', async () => {
    const res = await request(app)
      .post('/api/presentations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'X', version: '1.0', date: '2026-08-22', authors: ['Someone'] });
    expect(res.status).toBe(403);
  });
});

describe('4. HEAD_ADMIN cannot be deleted', () => {
  test('DELETE on the HEAD_ADMIN itself is rejected', async () => {
    const res = await asHeadAdmin(request(app).delete(`/api/admin/users/${headAdminId}`));
    expect(res.status).toBe(400); // caught first by the "cannot delete your own account" rule
  });

  test('DELETE on a HEAD_ADMIN by a different actor is still rejected', async () => {
    // Promote a second account to HEAD_ADMIN directly (simulating a second
    // head admin existing), then have the first try to delete it.
    const secondHead = await User.create({
      name: 'Second Head',
      email: 'secondhead@example.com',
      passwordHash: 'correct-horse',
      role: 'ADMIN',
    });
    // Bypass the API's own "can't promote to HEAD_ADMIN" guard to set up
    // this edge case directly at the model layer, matching how the seed
    // script itself creates a HEAD_ADMIN.
    secondHead.role = 'HEAD_ADMIN';
    await secondHead.save();

    const res = await asHeadAdmin(request(app).delete(`/api/admin/users/${secondHead.id}`));
    expect(res.status).toBe(403);
  });

  test('role changes on a HEAD_ADMIN are also rejected', async () => {
    const res = await asHeadAdmin(request(app).patch(`/api/admin/users/${headAdminId}/role`)).send({
      role: 'ADMIN',
    });
    expect(res.status).toBe(403);
  });
});

describe('5. JWT role validation', () => {
  test('the token embeds the role at login time', () => {
    const payload = JSON.parse(Buffer.from(headAdminToken.split('.')[1], 'base64').toString());
    expect(payload.role).toBe('HEAD_ADMIN');
  });

  test('authorization is re-checked against the database, not just the token, after a role change', async () => {
    // Create an admin, log in as them, then demote them — their existing
    // token should stop granting admin access immediately, because
    // authenticateUser re-loads the user from the database every request
    // rather than trusting the JWT payload's role claim.
    await asHeadAdmin(request(app).post('/api/admin/users')).send({
      name: 'Soon Demoted',
      email: 'soondemoted@example.com',
      password: 'correct-horse',
      role: 'ADMIN',
    });
    const demotedToken = await loginAs('soondemoted@example.com');

    const beforeDemotion = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${demotedToken}`);
    expect(beforeDemotion.status).toBe(200);

    const target = await User.findOne({ where: { email: 'soondemoted@example.com' } });
    await asHeadAdmin(request(app).patch(`/api/admin/users/${target.id}/role`)).send({ role: 'USER' });

    const afterDemotion = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${demotedToken}`); // same old token, unchanged
    expect(afterDemotion.status).toBe(403);
  });

  test('a malformed token is rejected', async () => {
    const res = await request(app).get('/api/admin/dashboard').set('Authorization', 'Bearer garbage.token.here');
    expect(res.status).toBe(401);
  });
});

describe('6. Normal registration cannot create ADMIN', () => {
  test('role in the request body is ignored, not honored', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Sneaky',
      email: 'sneaky@example.com',
      password: 'correct-horse',
      role: 'ADMIN',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('USER');
  });

  test('same for trying to register as HEAD_ADMIN', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Sneakier',
      email: 'sneakier@example.com',
      password: 'correct-horse',
      role: 'HEAD_ADMIN',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('USER');
  });
});

describe('GET /api/admin/users', () => {
  test('HEAD_ADMIN sees every user', async () => {
    const res = await asHeadAdmin(request(app).get('/api/admin/users'));
    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThan(1);
    expect(res.body.users.every((u) => u.passwordHash === undefined)).toBe(true);
  });
});

describe('PATCH /api/admin/users/:id/role', () => {
  test('HEAD_ADMIN can promote a USER to ADMIN', async () => {
    const target = await User.findOne({ where: { email: 'regularuser@example.com' } });
    const res = await asHeadAdmin(request(app).patch(`/api/admin/users/${target.id}/role`)).send({ role: 'ADMIN' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('ADMIN');
  });

  test('rejects assigning an unrecognized role', async () => {
    const target = await User.findOne({ where: { email: 'regularuser@example.com' } });
    const res = await asHeadAdmin(request(app).patch(`/api/admin/users/${target.id}/role`)).send({
      role: 'SUPERUSER',
    });
    expect(res.status).toBe(400);
  });

  test('is recorded in the audit log with before/after roles', async () => {
    const target = await User.findOne({ where: { email: 'regularuser@example.com' } });
    const entry = await AuditLog.findOne({
      where: { action: 'CHANGE_ROLE', targetUser: target.id },
      order: [['timestamp', 'DESC']],
    });

    expect(entry.details).toEqual({ from: 'USER', to: 'ADMIN' });
  });

  test('404s for a nonexistent user', async () => {
    const res = await asHeadAdmin(
      request(app).patch('/api/admin/users/00000000-0000-0000-0000-000000000000/role')
    ).send({ role: 'ADMIN' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/admin/users/:id', () => {
  test('HEAD_ADMIN cannot delete their own account', async () => {
    const res = await asHeadAdmin(request(app).delete(`/api/admin/users/${headAdminId}`));
    expect(res.status).toBe(400);
  });

  test('HEAD_ADMIN can delete a regular ADMIN or USER', async () => {
    const target = await User.create({
      name: 'To Be Deleted',
      email: 'tobedeleted@example.com',
      passwordHash: 'correct-horse',
      role: 'USER',
    });

    const res = await asHeadAdmin(request(app).delete(`/api/admin/users/${target.id}`));
    expect(res.status).toBe(204);

    const stillThere = await User.findByPk(target.id);
    expect(stillThere).toBeNull();
  });

  test('is recorded in the audit log even though the user row is gone', async () => {
    const entry = await AuditLog.findOne({
      where: { action: 'DELETE_USER' },
      order: [['timestamp', 'DESC']],
    });
    expect(entry).not.toBeNull();
    expect(entry.details.email).toBe('tobedeleted@example.com');
  });
});
