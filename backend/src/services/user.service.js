const { User, AuditLog } = require('../models');
const AppError = require('../utils/AppError');

// The only roles ever assignable through this API. HEAD_ADMIN is never
// grantable here — it exists exactly once, seeded via `npm run seed-admin`
// or promoted from the pre-existing admin by the role-hierarchy migration.
// Closing off "promote someone to HEAD_ADMIN via a role change" is a
// deliberate privilege-escalation guard, not an oversight.
const ASSIGNABLE_ROLES = ['ADMIN', 'USER'];

function toSafeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    createdBy: user.createdBy,
  };
}

function assertAssignableRole(role) {
  if (!ASSIGNABLE_ROLES.includes(role)) {
    throw new AppError(`Role must be one of: ${ASSIGNABLE_ROLES.join(', ')}`, 400);
  }
}

async function logAction(action, performedBy, targetUser, details) {
  await AuditLog.create({ action, performedBy, targetUser, details });
}

async function createUser({ name, email, password, role }, actor) {
  assertAssignableRole(role);

  const user = await User.create({ name, email, passwordHash: password, role, createdBy: actor.id });
  await logAction('CREATE_USER', actor.id, user.id, { role });
  return user;
}

async function listUsers() {
  return User.findAll({ order: [['createdAt', 'ASC']] });
}

async function changeRole(targetId, newRole, actor) {
  assertAssignableRole(newRole);

  const target = await User.findByPk(targetId);
  if (!target) {
    throw new AppError('User not found', 404);
  }
  // The model's own beforeUpdate hook would also catch this, but checking
  // here first means a clear 403 instead of a hook-thrown error surfacing
  // through the generic Sequelize error path.
  if (target.role === 'HEAD_ADMIN') {
    throw new AppError('The HEAD_ADMIN role cannot be changed', 403);
  }

  const previousRole = target.role;
  if (previousRole === newRole) {
    return target;
  }

  target.role = newRole;
  await target.save();
  await logAction('CHANGE_ROLE', actor.id, target.id, { from: previousRole, to: newRole });
  return target;
}

async function removeUser(targetId, actor) {
  if (targetId === actor.id) {
    throw new AppError('You cannot delete your own account', 400);
  }

  const target = await User.findByPk(targetId);
  if (!target) {
    throw new AppError('User not found', 404);
  }
  if (target.role === 'HEAD_ADMIN') {
    throw new AppError('A HEAD_ADMIN account cannot be deleted', 403);
  }

  // Written before the delete so the log captures who/what was deleted;
  // the FK's ON DELETE SET NULL means this row survives the user's removal
  // with target_user nulled out, rather than being cascade-deleted itself.
  await logAction('DELETE_USER', actor.id, target.id, { role: target.role, email: target.email });
  await target.destroy();
}

module.exports = { createUser, listUsers, changeRole, removeUser, toSafeUser, ASSIGNABLE_ROLES };
