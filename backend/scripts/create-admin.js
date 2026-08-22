// Public registration always creates a "viewer" — there is deliberately no
// API path to self-grant the admin role. This script is how the first (and
// any subsequent) admin/instructor account gets created, run directly on
// the server by whoever controls it.
//
// Usage:
//   ADMIN_NAME="Dr. Sukhpal Singh" ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="a-strong-password" npm run create-admin
const { sequelize, User } = require('../src/models');
const logger = require('../src/utils/logger');

async function main() {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    logger.error('ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD environment variables are all required');
    process.exitCode = 1;
    return;
  }

  const [user, created] = await User.findOrCreate({
    where: { email: email.trim().toLowerCase() },
    defaults: { name, password, role: 'admin' },
  });

  if (!created && user.role !== 'admin') {
    user.role = 'admin';
    await user.save();
    logger.info(`Promoted existing user ${user.email} to admin`);
  } else if (created) {
    logger.info(`Created admin account ${user.email}`);
  } else {
    logger.info(`${user.email} is already an admin`);
  }
}

main()
  .catch((err) => {
    logger.error(`Failed to create admin: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
