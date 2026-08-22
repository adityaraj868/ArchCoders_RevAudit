const STATUSES = ['draft', 'uploading', 'processing', 'uploaded', 'published', 'failed'];

module.exports = (sequelize, DataTypes) => {
  const Presentation = sequelize.define(
    'Presentation',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Title is required' },
          len: { args: [1, 200], msg: 'Title must be at most 200 characters' },
        },
      },
      version: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Version is required' },
          is: {
            args: /^\d+(\.\d+)*$/,
            msg: 'Version must look like "1", "1.0", or "2.3.1"',
          },
        },
      },
      // Stored as JSON text so the column works identically across every
      // Sequelize dialect (Postgres in production, SQLite in tests) — a
      // native Postgres ARRAY column has no SQLite equivalent.
      authors: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '[]',
        get() {
          const raw = this.getDataValue('authors');
          try {
            return raw ? JSON.parse(raw) : [];
          } catch {
            return [];
          }
        },
        set(value) {
          this.setDataValue('authors', JSON.stringify(value ?? []));
        },
        validate: {
          isValidAuthorList() {
            const authors = this.authors;
            if (!Array.isArray(authors) || authors.length === 0) {
              throw new Error('At least one author is required');
            }
            if (!authors.every((author) => typeof author === 'string' && author.trim().length > 0)) {
              throw new Error('Each author must be a non-empty string');
            }
          },
        },
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: { msg: 'Date must be a valid date', args: true },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: { args: [0, 2000], msg: 'Description must be at most 2000 characters' },
        },
      },
      status: {
        type: DataTypes.ENUM(...STATUSES),
        allowNull: false,
        defaultValue: 'draft',
        validate: {
          isIn: { args: [STATUSES], msg: `Status must be one of: ${STATUSES.join(', ')}` },
        },
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      tableName: 'presentations',
      underscored: true,
      indexes: [{ unique: true, fields: ['title', 'version'] }],
      hooks: {
        // Mirrors the "publishing never overwrites or deletes an earlier
        // version" rule from the system architecture plan.
        beforeDestroy: (presentation) => {
          if (presentation.status === 'published') {
            throw new Error('A published presentation version cannot be deleted');
          }
        },
      },
    }
  );

  Presentation.associate = (models) => {
    Presentation.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    Presentation.hasMany(models.File, { foreignKey: 'presentationId', as: 'files', onDelete: 'CASCADE' });
  };

  return Presentation;
};
