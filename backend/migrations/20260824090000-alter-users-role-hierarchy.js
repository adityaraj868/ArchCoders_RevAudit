'use strict';

// Introduces the three-tier role hierarchy (HEAD_ADMIN / ADMIN / USER) in
// place of the old two-tier (admin / viewer), renames password -> password_hash
// to match what the column actually holds, and adds created_by so every
// admin-created account records who created it.
//
// Data is preserved, not dropped: the existing 'admin' role becomes
// HEAD_ADMIN (the currently-deployed admin account becomes the top of the
// new hierarchy, per the migration's whole purpose) and 'viewer' becomes
// USER.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('users', 'password', 'password_hash');

    await queryInterface.addColumn('users', 'created_by', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // Postgres enums can't be renamed-in-place with new members swapped in
    // one statement — rebuild the type and re-point the column at it,
    // mapping old values to new ones as part of the same cast.
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_users_role" RENAME TO "enum_users_role_old";
      CREATE TYPE "enum_users_role" AS ENUM('HEAD_ADMIN', 'ADMIN', 'USER');
      ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
      ALTER TABLE "users" ALTER COLUMN "role" TYPE "enum_users_role" USING (
        CASE "role"::text
          WHEN 'admin' THEN 'HEAD_ADMIN'
          WHEN 'viewer' THEN 'USER'
          ELSE 'USER'
        END
      )::"enum_users_role";
      ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';
      DROP TYPE "enum_users_role_old";
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_users_role" RENAME TO "enum_users_role_new";
      CREATE TYPE "enum_users_role" AS ENUM('admin', 'viewer');
      ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
      ALTER TABLE "users" ALTER COLUMN "role" TYPE "enum_users_role" USING (
        CASE "role"::text
          WHEN 'HEAD_ADMIN' THEN 'admin'
          WHEN 'ADMIN' THEN 'admin'
          ELSE 'viewer'
        END
      )::"enum_users_role";
      ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'viewer';
      DROP TYPE "enum_users_role_new";
    `);

    await queryInterface.removeColumn('users', 'created_by');
    await queryInterface.renameColumn('users', 'password_hash', 'password');
  },
};
