'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('files', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      filename: { type: Sequelize.STRING, allowNull: false },
      original_name: { type: Sequelize.STRING, allowNull: false },
      storage_path: { type: Sequelize.STRING, allowNull: false },
      size: { type: Sequelize.BIGINT, allowNull: false },
      type: { type: Sequelize.STRING, allowNull: false },
      presentation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'presentations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      uploaded_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('files');
  },
};
