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

    // Run migrations with a ledger guard to prevent duplicate runs on multi-instance deployments
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const alreadyRan = await db.collection('migrations').findOne({ name: 'sessionSnapshotMigration' }).catch(() => null);
    if (!alreadyRan) {
      await migrateSessionProblemSnapshots();
      await db.collection('migrations').insertOne({ name: 'sessionSnapshotMigration', ranAt: new Date() }).catch(() => {});
    }

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
      });
      try {
        const { agenda } = require('./src/config/agenda');
        await agenda.stop();
        logger.info('Agenda scheduler stopped');
      } catch (_) {}
      try {
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
      } catch (_) {}
      setTimeout(() => process.exit(0), 3000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught exception:', err);
      gracefulShutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection:', reason);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
