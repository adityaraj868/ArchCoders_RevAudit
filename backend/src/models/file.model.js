// Kept intentionally permissive-but-bounded: presentation decks, PDFs, and
// the images/archives a slide export commonly produces.
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'application/zip',
  'image/png',
  'image/jpeg',
  'image/svg+xml',
];

module.exports = (sequelize, DataTypes) => {
  const File = sequelize.define(
    'File',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      filename: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Filename is required' },
        },
      },
      originalName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Original filename is required' },
        },
      },
      storagePath: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Storage path is required' },
        },
      },
      size: {
        type: DataTypes.BIGINT,
        allowNull: false,
        validate: {
          min: { args: [1], msg: 'Size must be a positive number of bytes' },
        },
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'File type is required' },
          isIn: { args: [ALLOWED_MIME_TYPES], msg: `File type must be one of: ${ALLOWED_MIME_TYPES.join(', ')}` },
        },
      },
      presentationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      uploadedBy: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      tableName: 'files',
      underscored: true,
    }
  );

  File.ALLOWED_MIME_TYPES = ALLOWED_MIME_TYPES;

  File.associate = (models) => {
    File.belongsTo(models.Presentation, { foreignKey: 'presentationId', as: 'presentation', onDelete: 'CASCADE' });
    File.belongsTo(models.User, { foreignKey: 'uploadedBy', as: 'uploader' });
  };

  return File;
};
