'use strict';

const Session = require('../models/Session');
const Problem = require('../models/Problem');
const Migration = require('../models/Migration');
const logger = require('../utils/logger');

/**
 * One-time migration to backfill problemSnapshot for sessions that don't have it
 */
async function migrateSessionProblemSnapshots() {
  try {
    // Only run once (check a flag in DB)
    const FLAG_KEY = 'MIGRATION_SESSION_SNAPSHOT_COMPLETED';

    const existingMigration = await Migration.findOne({ key: FLAG_KEY });
    if (existingMigration?.completed) {
      logger.info('Session snapshot migration already completed. Skipping.');
      return;
    }

    logger.info('Starting session snapshot migration...');

    // Find all sessions without problemSnapshot but with a problem reference
    const sessionsToMigrate = await Session.find({
      problem: { $exists: true, $ne: null },
      problemSnapshot: { $exists: false }
    }).populate('problem');

    logger.info(`Found ${sessionsToMigrate.length} sessions to migrate`);

    let migrated = 0;
    for (const session of sessionsToMigrate) {
      if (session.problem) {
        session.problemSnapshot = {
          title: session.problem.title,
          difficulty: session.problem.difficulty,
          slug: session.problem.slug,
          tags: session.problem.tags
        };
        await session.save();
        migrated++;
      }
    }

    logger.info(`Migrated ${migrated} sessions with problem snapshots`);

    // Mark migration as complete
    await Migration.findOneAndUpdate(
      { key: FLAG_KEY },
      {
        key: FLAG_KEY,
        completed: true,
        completedAt: new Date()
      },
      { upsert: true }
    );

    logger.info('Session snapshot migration completed');
  } catch (err) {
    logger.error('Session snapshot migration error:', err);
    // Don't throw - continue server startup
  }
}

module.exports = { migrateSessionProblemSnapshots };
