const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const logger = require('./utils/logger');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());

if (env.nodeEnv !== 'test') {
  app.use(
    morgan(env.nodeEnv === 'production' ? 'combined' : 'dev', {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
}

app.use('/api', routes);

// Serves whatever the "local" storage driver has written to disk — matches
// the "/uploads/..." path localStorageService.getUrl() already returns.
// A no-op under the "s3" driver: nothing is ever written to this directory,
// so requests here just 404 rather than doing anything unexpected.
app.use('/uploads', express.static(env.uploadDir));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
