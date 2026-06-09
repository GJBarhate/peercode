'use strict';

const { v4: uuidv4 } = require('uuid');
const Room = require('../models/Room');
const User = require('../models/User');
const MatchingQueue = require('../models/MatchingQueue');
const logger = require('../utils/logger');

module.exports = async function (io) {
  const queue = new Map();
  const userSockets = new Map(); // Track user socket IDs for duplicate prevention
  const timeoutTimers = new Map(); // Server-side 60s timeout per user
  const QUEUE_TIMEOUT_MS = 60000;
  let queueSequence = 0; // Incrementing counter for O(1) position calculation

  function removeFromQueue(userId) {
    if (!userId) return;
    queue.delete(userId);
    userSockets.delete(userId);
    clearQueueTimer(userId);
  }

  function clearQueueTimer(userId) {
    if (timeoutTimers.has(userId)) {
      clearTimeout(timeoutTimers.get(userId));
      timeoutTimers.delete(userId);
    }
  }

  function setQueueTimer(userId, socket, io) {
    clearQueueTimer(userId);
    const timer = setTimeout(async () => {
      if (queue.has(userId)) {
        const entry = queue.get(userId);
        logger.info(`⏰ Queue timeout for ${entry?.username || userId}`);
        removeFromQueue(userId);
        try {
          await MatchingQueue.deleteOne({ userId });
        } catch (err) {
          logger.error('Error removing timed-out user from MongoDB:', err.message);
        }
        io.to(userSockets.get(userId) || '').emit('queue-timeout', { message: 'Match not found within 60 seconds' });
      }
    }, QUEUE_TIMEOUT_MS);
    timeoutTimers.set(userId, timer);
  }

  // Restore queue from MongoDB on startup (without timers — stale entries will be cleaned)
  try {
    const queuedUsers = await MatchingQueue.find({});
    logger.info(`Restoring ${queuedUsers.length} users from matching queue — will be pruned on next interaction`);
    // Remove stale entries restored from DB (they have no active socket)
    await MatchingQueue.deleteMany({});
  } catch (err) {
    logger.error('Error restoring queue from MongoDB:', err.message);
  }

  function findMatch(candidate) {
    let bestMatch = null;
    let bestScore = -1;

    for (const [userId, entry] of queue.entries()) {
      // Prevent self-match
      if (userId === candidate.userId) continue;

      // Role compatibility: 'any' (Either) matches anyone; otherwise strict interviewer↔interviewee
      const roleCompatible =
        candidate.preferredRole === 'any' ||
        entry.preferredRole === 'any' ||
        (candidate.preferredRole === 'interviewer' && entry.preferredRole === 'interviewee') ||
        (candidate.preferredRole === 'interviewee' && entry.preferredRole === 'interviewer');

      if (!roleCompatible) continue;

      // ELO range matching (within 200 points)
      const eloMatch = Math.abs(candidate.elo - entry.elo) <= 200;
      if (!eloMatch) continue;

      // Topic matching (case-insensitive)
      const candidateTopic = (candidate.preferredTopic || 'any').toLowerCase();
      const entryTopic = (entry.preferredTopic || 'any').toLowerCase();
      const topicCompatible =
        candidateTopic === 'any' ||
        entryTopic === 'any' ||
        candidateTopic === entryTopic;

      if (!topicCompatible) continue;

      // Scoring: prefer closer ELO and longer wait time
      const eloDistance = Math.abs(candidate.elo - entry.elo);
      const waitTime = Date.now() - entry.joinedAt.getTime();
      const score = (1 - eloDistance / 200) * 0.5 + (waitTime / 300000) * 0.5; // Normalized score

      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    }

    return bestMatch;
  }

  io.on('connection', (socket) => {
    socket.on('queue-join', async ({ role, topic = 'any' }) => {
      try {
        // Prevent duplicate queue entries
        if (userSockets.has(socket.data.userId)) {
          const oldSocketId = userSockets.get(socket.data.userId);
          io.to(oldSocketId).emit('queue-error', { message: 'Joined queue from another device' });
          removeFromQueue(socket.data.userId);
        }

        userSockets.set(socket.data.userId, socket.id);

        const candidate = {
          userId: socket.data.userId,
          username: socket.data.username,
          elo: socket.data.elo || 1200,
          preferredRole: role || 'interviewee',
          preferredTopic: topic || 'any',
          socketId: socket.id,
          joinedAt: new Date(),
          sequence: ++queueSequence,
        };

        queue.set(socket.data.userId, candidate);

        // Start server-side 60s timeout
        setQueueTimer(socket.data.userId, socket, io);

        // Persist to MongoDB
        try {
          await MatchingQueue.findOneAndUpdate(
            { userId: socket.data.userId },
            {
              userId: socket.data.userId,
              username: candidate.username,
              elo: candidate.elo,
              preferredRole: candidate.preferredRole,
              preferredTopic: candidate.preferredTopic,
              socketId: socket.id,
              joinedAt: candidate.joinedAt,
            },
            { upsert: true, new: true }
          );
        } catch (err) {
          logger.error('Error persisting queue to MongoDB:', err.message);
        }
        
        logger.info(`👤 User ${candidate.username} joined queue - Role: ${candidate.preferredRole}, Topic: ${candidate.preferredTopic}, Queue size: ${queue.size}`);

        const match = findMatch(candidate);

        if (match) {
          removeFromQueue(candidate.userId);
          removeFromQueue(match.userId);

          // Remove from MongoDB when matched
          try {
            await MatchingQueue.deleteMany({ userId: { $in: [candidate.userId, match.userId] } });
          } catch (err) {
            logger.error('Error removing matched users from MongoDB:', err.message);
          }

          const roomId = uuidv4();

          try {
            // Assign complementary roles
            let candidateRole = candidate.preferredRole;
            let matchRole = match.preferredRole;

            // Handle role assignment
            if (candidateRole === 'observer' || matchRole === 'observer') {
              if (candidateRole === 'observer' && matchRole === 'observer') {
                candidateRole = 'interviewer';
                matchRole = 'interviewee';
              }
            } else if (candidateRole === 'any' && matchRole === 'any') {
              candidateRole = 'interviewer';
              matchRole = 'interviewee';
            } else if (candidateRole === 'any') {
              candidateRole = matchRole === 'interviewer' ? 'interviewee' : 'interviewer';
            } else if (matchRole === 'any') {
              matchRole = candidateRole === 'interviewer' ? 'interviewee' : 'interviewer';
            }

            // Create room with proper role assignment
            const room = await Room.create({
              roomId,
              host: candidate.userId,
              participants: [
                { user: candidate.userId, role: candidateRole, joinedAt: new Date() },
                { user: match.userId, role: matchRole, joinedAt: new Date() },
              ],
              status: 'waiting',
              maxParticipants: 2,
            });

            // Join both sockets to room
            socket.join(roomId);
            io.to(match.socketId).socketsJoin(roomId);

            // Emit match events with all required details
            socket.emit('queue-matched', {
              roomId,
              partnerUsername: match.username,
              partnerElo: match.elo,
              yourRole: candidateRole,
              partnerId: match.userId,
              topic: candidate.preferredTopic,
              timestamp: Date.now(),
            });

            io.to(match.socketId).emit('queue-matched', {
              roomId,
              partnerUsername: candidate.username,
              partnerElo: candidate.elo,
              yourRole: matchRole,
              partnerId: candidate.userId,
              topic: candidate.preferredTopic,
              timestamp: Date.now(),
            });

            logger.info(`✅ MATCH CREATED - Room: ${roomId}`);
            logger.info(`   ${candidate.username} (${candidateRole}, ELO: ${candidate.elo}) ↔️ ${match.username} (${matchRole}, ELO: ${match.elo})`);
            logger.info(`   Topic: ${candidate.preferredTopic}`);
          } catch (err) {
            logger.error('Error creating matched room:', err.message);
            socket.emit('queue-error', { message: 'Failed to create room. Please try again.' });
            io.to(match.socketId).emit('queue-error', { message: 'Failed to create room. Please try again.' });
          }
        } else {
          // Still in queue - send position update (O(1) using sequence counter)
          let minSequence = queueSequence;
          for (const entry of queue.values()) {
            if (entry.sequence < minSequence) minSequence = entry.sequence;
          }
          const position = candidate.sequence - minSequence + 1;
          const waitTimeSeconds = Math.ceil(queue.size * 90 / 60); // Rough estimate

          socket.emit('queue-waiting', {
            position,
            estimatedWaitSeconds: waitTimeSeconds,
            queueSize: queue.size,
          });

          logger.info(`⏳ ${candidate.username} waiting in queue - Position: #${position}, Queue: ${queue.size}`);
        }
      } catch (err) {
        logger.error('Queue join error:', err.message);
        socket.emit('queue-error', { message: 'Failed to join queue. Please try again.' });
      }
    });

    socket.on('queue-leave', async () => {
      try {
        if (socket.data.userId) {
          removeFromQueue(socket.data.userId);
          
          // Remove from MongoDB
          try {
            await MatchingQueue.deleteOne({ userId: socket.data.userId });
          } catch (err) {
            logger.error('Error removing from MongoDB queue:', err.message);
          }
          
          socket.emit('queue-left');
          logger.info(`👋 ${socket.data.username || 'unknown'} left queue`);
        }
      } catch (err) {
        logger.error('Queue leave error:', err.message);
      }
    });

    socket.on('disconnect', async () => {
      try {
        if (socket.data.userId) {
          removeFromQueue(socket.data.userId);
          
          // Remove from MongoDB
          try {
            await MatchingQueue.deleteOne({ userId: socket.data.userId });
          } catch (err) {
            logger.error('Error removing from MongoDB queue on disconnect:', err.message);
          }
          
          logger.info(`🔌 ${socket.data.username || 'unknown'} disconnected from queue`);
        }
      } catch (err) {
        logger.error('Disconnect error:', err.message);
      }
    });
  });
};
