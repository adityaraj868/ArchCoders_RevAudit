const { db, resetDb, closeDb } = require('./helpers/db');

const { User } = db;

beforeAll(() => resetDb());
afterAll(() => closeDb());

describe('User model', () => {
  test('creates a valid user with a default role of USER', async () => {
    const user = await User.create({
      name: 'Dheeraj Kumar',
      email: 'Dheeraj@Example.com',
      passwordHash: 'correct-horse',
    });

    expect(user.role).toBe('USER');
    expect(user.email).toBe('dheeraj@example.com'); // normalized
  });

  test('hashes the password instead of storing it in plain text', async () => {
    const user = await User.create({
      name: 'Vaibhav Goyal',
      email: 'vaibhav@example.com',
      passwordHash: 'correct-horse',
    });

    expect(user.passwordHash).not.toBe('correct-horse');
    await expect(user.comparePassword('correct-horse')).resolves.toBe(true);
    await expect(user.comparePassword('wrong-password')).resolves.toBe(false);
  });

  test('excludes the password hash from default queries', async () => {
    await User.create({
      name: 'Adityaraj Singh',
      email: 'adityaraj@example.com',
      passwordHash: 'correct-horse',
    });

    const fetched = await User.findOne({ where: { email: 'adityaraj@example.com' } });
    expect(fetched.passwordHash).toBeUndefined();

    const withPassword = await User.scope('withPassword').findOne({ where: { email: 'adityaraj@example.com' } });
    expect(withPassword.passwordHash).toBeDefined();
  });

  test('rejects an invalid email', async () => {
    await expect(
      User.create({ name: 'Sparsh Khandelwal', email: 'not-an-email', passwordHash: 'correct-horse' })
    ).rejects.toThrow();
  });

  test('rejects a password shorter than 8 characters', async () => {
    await expect(
      User.create({ name: 'Sparsh Khandelwal', email: 'sparsh@example.com', passwordHash: 'short' })
    ).rejects.toThrow();
  });

  test('rejects an unrecognized role', async () => {
    await expect(
      User.create({
        name: 'Sparsh Khandelwal',
        email: 'sparsh2@example.com',
        passwordHash: 'correct-horse',
        role: 'superadmin',
      })
    ).rejects.toThrow();
  });

  test('rejects a duplicate email', async () => {
    await User.create({ name: 'First', email: 'duplicate@example.com', passwordHash: 'correct-horse' });
    await expect(
      User.create({ name: 'Second', email: 'duplicate@example.com', passwordHash: 'correct-horse' })
    ).rejects.toThrow();
  });

  describe('HEAD_ADMIN protection', () => {
    test('rejects changing a HEAD_ADMIN role away, even to ADMIN', async () => {
      const head = await User.create({
        name: 'Dr. Sukhpal Singh',
        email: 'head@example.com',
        passwordHash: 'correct-horse',
        role: 'HEAD_ADMIN',
      });

      head.role = 'ADMIN';
      await expect(head.save()).rejects.toThrow(/HEAD_ADMIN role cannot be changed/i);
    });

    test('rejects deleting a HEAD_ADMIN', async () => {
      const head = await User.create({
        name: 'Another Head',
        email: 'head2@example.com',
        passwordHash: 'correct-horse',
        role: 'HEAD_ADMIN',
      });

      await expect(head.destroy()).rejects.toThrow(/HEAD_ADMIN account cannot be deleted/i);
    });

    test('allows deleting a regular ADMIN', async () => {
      const admin = await User.create({
        name: 'Regular Admin',
        email: 'regularadmin@example.com',
        passwordHash: 'correct-horse',
        role: 'ADMIN',
      });

      await expect(admin.destroy()).resolves.not.toThrow();
    });
  });
});
