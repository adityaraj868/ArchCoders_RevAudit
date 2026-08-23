// Immutable append-only log of admin actions on user accounts. Written by
// user.service.js alongside every create/role-change/delete — never
// updated, never deleted by the application itself.
const ACTIONS = ['CREATE_USER', 'CHANGE_ROLE', 'DELETE_USER'];

module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      action: {
        type: DataTypes.ENUM(...ACTIONS),
        allowNull: false,
        validate: {
          isIn: { args: [ACTIONS], msg: `Action must be one of: ${ACTIONS.join(', ')}` },
        },
      },
      performedBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      targetUser: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      // JSON-encoded free-form context (e.g. { from: 'USER', to: 'ADMIN' })
      // — what actually changed, not just that something did.
      details: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const raw = this.getDataValue('details');
          if (!raw) return null;
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
        },
        set(value) {
          this.setDataValue('details', value ? JSON.stringify(value) : null);
        },
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'audit_logs',
      underscored: true,
      // This table has its own explicit `timestamp` column instead of the
      // usual createdAt/updatedAt pair — a log entry is written once and
      // never modified, so "updated at" has no meaning here.
      timestamps: false,
    }
  );

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, { foreignKey: 'performedBy', as: 'actor' });
    AuditLog.belongsTo(models.User, { foreignKey: 'targetUser', as: 'target' });
  };

  return AuditLog;
};
