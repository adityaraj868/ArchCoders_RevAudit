// The only way a HEAD_ADMIN account comes into existence: there is no API
// path that grants it, on purpose (see src/services/user.service.js). Run
// this directly on the server, once, to bootstrap the top of the hierarchy
// on a fresh database.
//
// Usage:
//   HEAD_ADMIN_EMAIL="admin@example.com" HEAD_ADMIN_PASSWORD="a-strong-password" npm run seed-admin
//   HEAD_ADMIN_NAME is optional (defaults to "Head Admin").
const { sequelize, User } = require('../src/models');
const logger = require('../src/utils/logger');

async function main() {
  const name = process.env.HEAD_ADMIN_NAME || 'Head Admin';
  const email = process.env.HEAD_ADMIN_EMAIL;
  const password = process.env.HEAD_ADMIN_PASSWORD;

  if (!email || !password) {
    logger.error('HEAD_ADMIN_EMAIL and HEAD_ADMIN_PASSWORD environment variables are both required');
    process.exitCode = 1;
    return;
  }

  const [user, created] = await User.findOrCreate({
    where: { email: email.trim().toLowerCase() },
    defaults: { name, passwordHash: password, role: 'HEAD_ADMIN' },
  });

  if (!created && user.role !== 'HEAD_ADMIN') {
    user.role = 'HEAD_ADMIN';
    await user.save();
    logger.info(`Promoted existing user ${user.email} to HEAD_ADMIN`);
  } else if (created) {
    logger.info(`Created HEAD_ADMIN account ${user.email}`);
  } else {
    logger.info(`${user.email} is already HEAD_ADMIN`);
  }
}

main()
  .catch((err) => {
    logger.error(`Failed to seed HEAD_ADMIN: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
