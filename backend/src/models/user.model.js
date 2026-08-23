const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');

// HEAD_ADMIN is the single top-of-hierarchy role, seeded via `npm run
// seed-admin` (or promoted from an existing account by the users migration)
// — never created through the API. ADMIN and USER are the only roles
// assignable through POST /api/admin/users or PATCH .../role.
const ROLES = ['HEAD_ADMIN', 'ADMIN', 'USER'];
const SALT_ROUNDS = 12;

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Name is required' },
          len: { args: [2, 100], msg: 'Name must be between 2 and 100 characters' },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: { msg: 'An account with this email already exists' },
        validate: {
          notEmpty: { msg: 'Email is required' },
          isEmail: { msg: 'Must be a valid email address' },
        },
        set(value) {
          // Normalize so "Admin@Foo.com" and "admin@foo.com" collide on the
          // unique index instead of creating two accounts.
          this.setDataValue('email', typeof value === 'string' ? value.trim().toLowerCase() : value);
        },
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Password is required' },
          len: { args: [8, 100], msg: 'Password must be at least 8 characters' },
        },
      },
      role: {
        type: DataTypes.ENUM(...ROLES),
        allowNull: false,
        defaultValue: 'USER',
        validate: {
          isIn: { args: [ROLES], msg: `Role must be one of: ${ROLES.join(', ')}` },
        },
      },
      // Null for self-registered USERs and the seeded HEAD_ADMIN (nobody
      // "created" the bootstrap account) — set whenever an admin creates an
      // account through POST /api/admin/users.
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'users',
      underscored: true,
      // Never let a plain `findAll`/`findByPk` leak a password hash by
      // accident — callers that genuinely need it (login) opt in explicitly
      // via `User.scope('withPassword')`.
      defaultScope: {
        attributes: { exclude: ['passwordHash'] },
      },
      scopes: {
        withPassword: {
          attributes: { include: ['passwordHash'] },
        },
      },
      hooks: {
        beforeSave: async (user) => {
          if (user.changed('passwordHash')) {
            user.passwordHash = await bcrypt.hash(user.passwordHash, SALT_ROUNDS);
          }
        },
        // HEAD_ADMIN is "cannot be removed/demoted accidentally" — enforced
        // here as a last line of defense independent of whatever the
        // service layer already checked, the same pattern used to protect
        // published Presentation rows.
        beforeUpdate: (user) => {
          if (user.changed('role') && user.previous('role') === 'HEAD_ADMIN') {
            throw new AppError('The HEAD_ADMIN role cannot be changed', 403);
          }
        },
        beforeDestroy: (user) => {
          if (user.role === 'HEAD_ADMIN') {
            throw new AppError('A HEAD_ADMIN account cannot be deleted', 403);
          }
        },
      },
    }
  );

  User.prototype.comparePassword = function comparePassword(candidate) {
    return bcrypt.compare(candidate, this.passwordHash);
  };

  User.associate = (models) => {
    User.hasMany(models.Presentation, { foreignKey: 'createdBy', as: 'presentations' });
    User.hasMany(models.File, { foreignKey: 'uploadedBy', as: 'uploadedFiles' });
    User.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    User.hasMany(models.User, { foreignKey: 'createdBy', as: 'createdUsers' });
    User.hasMany(models.AuditLog, { foreignKey: 'performedBy', as: 'auditActions' });
    User.hasMany(models.AuditLog, { foreignKey: 'targetUser', as: 'auditedEvents' });
  };

  return User;
};
