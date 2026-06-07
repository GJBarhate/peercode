'use strict';

require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const { initSocket } = require('./src/socket/index');
const { startScheduler } = require('./src/jobs/scheduler');
const logger = require('./src/utils/logger');
const { migrateSessionProblemSnapshots } = require('./src/migrations/sessionSnapshotMigration');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();

    // Run migrations
    await migrateSessionProblemSnapshots();

    const httpServer = http.createServer(app);

    initSocket(httpServer);

    await startScheduler();

    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });

    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      httpServer.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
