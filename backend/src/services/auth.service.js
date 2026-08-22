const { User } = require('../models');
const { signAccessToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

function toSafeUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

async function register({ name, email, password }) {
  // `role` is intentionally never accepted from the request body — public
  // registration must never be able to self-grant the admin role.
  const user = await User.create({ name, email, password, role: 'viewer' });
  return { user: toSafeUser(user), token: signAccessToken(user) };
}

async function login({ email, password }) {
  const invalidCredentials = () => new AppError('Invalid email or password', 401);

  if (!email || !password) {
    throw invalidCredentials();
  }

  const user = await User.scope('withPassword').findOne({
    where: { email: String(email).trim().toLowerCase() },
  });

  // Same error for "no such user" and "wrong password" — don't reveal which
  // one it was.
  if (!user || !(await user.comparePassword(password))) {
    throw invalidCredentials();
  }

  return { user: toSafeUser(user), token: signAccessToken(user) };
}

module.exports = { register, login, toSafeUser };
