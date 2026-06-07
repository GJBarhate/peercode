'use strict';

const { v4: uuidv4 } = require('uuid');
const Room = require('../models/Room');
const User = require('../models/User');
const logger = require('../utils/logger');

module.exports = function (io) {
  const queue = new Map();
  const userSockets = new Map(); // Track user socket IDs for duplicate prevention

  function findMatch(candidate) {
    let bestMatch = null;
    let bestScore = -1;

    for (const [userId, entry] of queue.entries()) {
      // Prevent duplicates
      if (userId === candidate.userId) continue;

      // Role compatibility: interviewer ↔ interviewee, or anyone accepts observer
      const roleCompatible =
        (candidate.preferredRole === 'interviewer' && entry.preferredRole === 'interviewee') ||
        (candidate.preferredRole === 'interviewee' && entry.preferredRole === 'interviewer') ||
        candidate.preferredRole === 'observer' ||
        entry.preferredRole === 'observer';

      if (!roleCompatible) continue;

      // ELO range matching (within 200 points)
      const eloMatch = Math.abs(candidate.elo - entry.elo) <= 200;
      if (!eloMatch) continue;

      // Topic matching
      const topicCompatible =
        candidate.preferredTopic === 'any' ||
        entry.preferredTopic === 'any' ||
        candidate.preferredTopic === entry.preferredTopic;

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
          queue.delete(socket.data.userId);
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
        };

        queue.set(socket.data.userId, candidate);
        logger.info(`👤 User ${candidate.username} joined queue - Role: ${candidate.preferredRole}, Topic: ${candidate.preferredTopic}, Queue size: ${queue.size}`);

        const match = findMatch(candidate);

        if (match) {
          queue.delete(candidate.userId);
          queue.delete(match.userId);
          userSockets.delete(candidate.userId);
          userSockets.delete(match.userId);

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
          // Still in queue - send position update
          const position = Array.from(queue.keys()).indexOf(candidate.userId) + 1;
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

    socket.on('queue-leave', () => {
      try {
        if (socket.data.userId) {
          queue.delete(socket.data.userId);
          userSockets.delete(socket.data.userId);
          socket.emit('queue-left');
          logger.info(`👋 ${socket.data.username || 'unknown'} left queue`);
        }
      } catch (err) {
        logger.error('Queue leave error:', err.message);
      }
    });

    socket.on('disconnect', () => {
      try {
        if (socket.data.userId) {
          queue.delete(socket.data.userId);
          userSockets.delete(socket.data.userId);
          logger.info(`🔌 ${socket.data.username || 'unknown'} disconnected from queue`);
        }
      } catch (err) {
        logger.error('Disconnect error:', err.message);
      }
    });
  });
};
