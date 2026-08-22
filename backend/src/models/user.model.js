const bcrypt = require('bcryptjs');

const ROLES = ['admin', 'viewer'];
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
      password: {
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
        defaultValue: 'viewer',
        validate: {
          isIn: { args: [ROLES], msg: `Role must be one of: ${ROLES.join(', ')}` },
        },
      },
    },
    {
      tableName: 'users',
      underscored: true,
      // Never let a plain `findAll`/`findByPk` leak a password hash by
      // accident — callers that genuinely need it (login) opt in explicitly
      // via `User.scope('withPassword')`.
      defaultScope: {
        attributes: { exclude: ['password'] },
      },
      scopes: {
        withPassword: {
          attributes: { include: ['password'] },
        },
      },
      hooks: {
        beforeSave: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
          }
        },
      },
    }
  );

  User.prototype.comparePassword = function comparePassword(candidate) {
    return bcrypt.compare(candidate, this.password);
  };

  User.associate = (models) => {
    User.hasMany(models.Presentation, { foreignKey: 'createdBy', as: 'presentations' });
    User.hasMany(models.File, { foreignKey: 'uploadedBy', as: 'uploadedFiles' });
  };

  return User;
};
