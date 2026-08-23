const userService = require('../services/user.service');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    throw new AppError('name, email, password, and role are required', 400);
  }

  const user = await userService.createUser({ name, email, password, role }, req.user);
  res.status(201).json({ user: userService.toSafeUser(user) });
});

const listUsers = asyncHandler(async (req, res) => {
  const users = await userService.listUsers();
  res.json({ users: users.map(userService.toSafeUser) });
});

const changeRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!role) {
    throw new AppError('role is required', 400);
  }

  const user = await userService.changeRole(req.params.id, role, req.user);
  res.json({ user: userService.toSafeUser(user) });
});

const removeUser = asyncHandler(async (req, res) => {
  await userService.removeUser(req.params.id, req.user);
  res.status(204).send();
});

module.exports = { createUser, listUsers, changeRole, removeUser };
