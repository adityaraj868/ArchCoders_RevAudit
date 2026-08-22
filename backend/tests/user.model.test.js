const { db, resetDb, closeDb } = require('./helpers/db');

const { User } = db;

beforeAll(() => resetDb());
afterAll(() => closeDb());

describe('User model', () => {
  test('creates a valid user with a default role of viewer', async () => {
    const user = await User.create({
      name: 'Dheeraj Kumar',
      email: 'Dheeraj@Example.com',
      password: 'correct-horse',
    });

    expect(user.role).toBe('viewer');
    expect(user.email).toBe('dheeraj@example.com'); // normalized
  });

  test('hashes the password instead of storing it in plain text', async () => {
    const user = await User.create({
      name: 'Vaibhav Goyal',
      email: 'vaibhav@example.com',
      password: 'correct-horse',
    });

    expect(user.password).not.toBe('correct-horse');
    await expect(user.comparePassword('correct-horse')).resolves.toBe(true);
    await expect(user.comparePassword('wrong-password')).resolves.toBe(false);
  });

  test('excludes the password hash from default queries', async () => {
    await User.create({
      name: 'Adityaraj Singh',
      email: 'adityaraj@example.com',
      password: 'correct-horse',
    });

    const fetched = await User.findOne({ where: { email: 'adityaraj@example.com' } });
    expect(fetched.password).toBeUndefined();

    const withPassword = await User.scope('withPassword').findOne({ where: { email: 'adityaraj@example.com' } });
    expect(withPassword.password).toBeDefined();
  });

  test('rejects an invalid email', async () => {
    await expect(
      User.create({ name: 'Sparsh Khandelwal', email: 'not-an-email', password: 'correct-horse' })
    ).rejects.toThrow();
  });

  test('rejects a password shorter than 8 characters', async () => {
    await expect(
      User.create({ name: 'Sparsh Khandelwal', email: 'sparsh@example.com', password: 'short' })
    ).rejects.toThrow();
  });

  test('rejects an unrecognized role', async () => {
    await expect(
      User.create({
        name: 'Sparsh Khandelwal',
        email: 'sparsh2@example.com',
        password: 'correct-horse',
        role: 'superadmin',
      })
    ).rejects.toThrow();
  });

  test('rejects a duplicate email', async () => {
    await User.create({ name: 'First', email: 'duplicate@example.com', password: 'correct-horse' });
    await expect(
      User.create({ name: 'Second', email: 'duplicate@example.com', password: 'correct-horse' })
    ).rejects.toThrow();
  });
});
