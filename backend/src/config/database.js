// Sequelize configuration, keyed by NODE_ENV. Consumed both by sequelize-cli
// (migrations) and by src/models/index.js (the running app).
const appEnv = require('./env');

module.exports = {
  development: {
    url: appEnv.databaseUrl,
    dialect: 'postgres',
  },
  test: {
    // No Postgres instance is assumed to exist wherever tests run, so the
    // test suite exercises the same models/associations/validations against
    // an in-memory SQLite database instead. `max: 1` is required: SQLite's
    // ":memory:" database is scoped per-connection, so a pool of more than
    // one connection would silently give each query a different, empty
    // database.
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    pool: { max: 1 },
  },
  production: {
    url: appEnv.databaseUrl,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
