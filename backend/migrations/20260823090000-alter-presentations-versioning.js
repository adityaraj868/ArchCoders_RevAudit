'use strict';

// Replaces the speculative upload-lifecycle `status` enum with the simpler
// `published` boolean the presentation-management API actually uses, and
// renames `description` to `change_summary` to match what the field is for.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('presentations', 'description', 'change_summary');
    await queryInterface.addColumn('presentations', 'published', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.removeColumn('presentations', 'status');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_presentations_status";');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('presentations', 'status', {
      type: Sequelize.ENUM('draft', 'uploading', 'processing', 'uploaded', 'published', 'failed'),
      allowNull: false,
      defaultValue: 'draft',
    });
    await queryInterface.removeColumn('presentations', 'published');
    await queryInterface.renameColumn('presentations', 'change_summary', 'description');
  },
};
