'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('presentations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      title: { type: Sequelize.STRING, allowNull: false },
      version: { type: Sequelize.STRING, allowNull: false },
      // JSON-encoded string array — see src/models/presentation.model.js for
      // why this isn't a native Postgres ARRAY column.
      authors: { type: Sequelize.TEXT, allowNull: false, defaultValue: '[]' },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM('draft', 'uploading', 'processing', 'uploaded', 'published', 'failed'),
        allowNull: false,
        defaultValue: 'draft',
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addIndex('presentations', ['title', 'version'], {
      unique: true,
      name: 'presentations_title_version_unique',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('presentations');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_presentations_status";');
  },
};
