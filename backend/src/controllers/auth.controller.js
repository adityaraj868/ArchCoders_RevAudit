const authService = require('../services/auth.service');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required', 400);
  }

  const result = await authService.register({ name, email, password });
  res.status(201).json(result);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  res.json(result);
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: authService.toSafeUser(req.user) });
});

module.exports = { register, login, me };
