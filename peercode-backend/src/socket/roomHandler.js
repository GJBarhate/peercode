'use strict';

const logger = require('../utils/logger');
const Session = require('../models/Session');
const Problem = require('../models/Problem');
const User = require('../models/User');
const Room = require('../models/Room');
const { calculateEloDelta, updateEloRating } = require('../utils/eloSystem');
const { agenda } = require('../config/agenda');
const { checkAndAwardBadges } = require('../services/BadgeService');

// Store active rooms in memory for quick access
const activeRooms = new Map();

// Lazily initialize room state when first accessed via socket events.
// Rooms are normally populated by webrtcSignaling.js join-room, but if a
// code_change or set_problem arrives first we still need an entry.
function getOrInitRoom(roomId) {
  if (!activeRooms.has(roomId)) {
    activeRooms.set(roomId, {
      participants: [],
      currentCode: '',
      language: 'javascript',
      currentProblem: null,
      messages: [],
      createdAt: Date.now(),
    });
  }
  return activeRooms.get(roomId);
}

// Cleanup function to remove stale rooms (older than 2 hours)
function cleanupStaleRooms() {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  for (const [roomId, room] of activeRooms.entries()) {
    if (room.createdAt && room.createdAt < twoHoursAgo) {
      activeRooms.delete(roomId);
      logger.info(`Cleaned up stale room: ${roomId}`);
    }
  }
}

// Run cleanup every 30 minutes
setInterval(cleanupStaleRooms, 30 * 60 * 1000);

module.exports = function(io) {
  // Room event handlers

  // Note: join-room handler is consolidated in webrtcSignaling.js
  // This file focuses on matching queue and session management

  io.on('connection', (socket) => {
    // leave_room: User leaves the room
    socket.on('leave_room', (data) => {
      const { roomId } = data;
      if (!roomId) return;

      socket.leave(roomId);
      
      const room = activeRooms.get(roomId);
      if (room) {
        room.participants = room.participants.filter(p => p.socketId !== socket.id);
        
        if (room.participants.length === 0) {
          activeRooms.delete(roomId);
          logger.info(`Room ${roomId} closed (empty)`);
        } else {
            io.to(roomId).emit('participant-left', {
            userId: socket.data.userId,
            username: socket.data.username,
            participants: room.participants
          });
        }
      }

      logger.info(`User ${socket.data.username} left room ${roomId}`);
    });

    // set_problem / problem-selected: Set the problem for the room (interviewer only)
    const handleSetProblem = async (data) => {
      const { roomId, problemId } = data;
      if (!roomId || !problemId) return;

      try {
        const userId = socket.user?.id || socket.data?.userId;
        if (userId) {
          const dbRoom = await Room.findOne({ roomId }).lean();
          if (dbRoom) {
            const participant = dbRoom.participants.find(p => p.user?.toString() === userId.toString());
            if (participant && participant.role !== 'interviewer') {
              return socket.emit('error', { message: 'Only the interviewer can set the problem' });
            }
          }
        }

        const room = getOrInitRoom(roomId);
        const problem = await Problem.findById(problemId);
        if (!problem) return socket.emit('error', { message: 'Problem not found' });

        room.currentProblem = {
          id: problem._id,
          title: problem.title,
          slug: problem.slug,
          difficulty: problem.difficulty,
          description: problem.description,
          examples: problem.examples,
          testCases: problem.testCases,
          constraints: problem.constraints,
          tags: problem.tags
        };

        // Persist problemId to Room document so end_session can fall back to DB
        Room.findOneAndUpdate({ roomId }, { problemId: problem._id }).catch(() => {});

        // Reset code when problem changes
        room.currentCode = '';
        room.language = 'javascript';

        io.to(roomId).emit('problem-updated', {
          problem: room.currentProblem,
          code: '',
          language: 'javascript',
          selectedBy: socket.data.username
        });

        logger.info(`Problem set in room ${roomId}: ${problem.title}`);
      } catch (err) {
        logger.error('set_problem error:', err);
        socket.emit('error', { message: 'Failed to set problem' });
      }
    };
    socket.on('set_problem', handleSetProblem);

    // code_change: User edits code (broadcast with debounce)
    socket.on('code_change', (data) => {
      const { roomId, code, language } = data;
      if (!roomId) return;

      const room = getOrInitRoom(roomId);
      room.currentCode = code;
      if (language) room.language = language;

      // Broadcast to others (not self)
      socket.to(roomId).emit('code_updated', {
        code,
        language: room.language,
        userId: socket.data.userId
      });
    });

    // language_change: Change programming language
    socket.on('language_change', (data) => {
      const { roomId, language } = data;
      if (!roomId || !language) return;

      const room = getOrInitRoom(roomId);
      room.language = language;

      io.to(roomId).emit('language_changed', {
        language,
        userId: socket.data.userId
      });
    });

    // run_code: Execute code in Judge0 (handled by frontend via HTTP POST /api/execute)
    // This event is for notifying others that code is being executed
    socket.on('code_execution_start', (data) => {
      const { roomId } = data;
      if (!roomId) return;

      socket.to(roomId).emit('partner_running_code', {
        username: socket.data.username
      });
    });

    socket.on('code_execution_result', (data) => {
      const { roomId, result } = data;
      if (!roomId || !result) return;

      io.to(roomId).emit('execution_result', {
        result,
        executedBy: socket.data.username
      });
    });

    // send_message / chat-message: Chat message (use io.in for self to also receive)
    const handleChatMessage = async (data) => {
      const { roomId, text } = data;
      if (!roomId || !text || !text.trim()) return;
      if (text.length > 500) return socket.emit('error', { message: 'Message exceeds 500 character limit' });

      try {
        const room = getOrInitRoom(roomId);

        const message = {
          userId: socket.data.userId,
          username: socket.data.username,
          text: text.trim(),
          timestamp: new Date(),
          _id: Math.random().toString(36).substr(2, 9)
        };

        room.messages.push(message);
        if (room.messages.length > 100) {
          room.messages.shift(); // Keep only last 100
        }

        // CRITICAL: Use io.in(roomId).emit so sender also receives the message
        io.in(roomId).emit('new_message', message);
        io.in(roomId).emit('chat-message', message);

        logger.debug(`Message in room ${roomId} from ${socket.data.username}`);
      } catch (err) {
        logger.error('send_message error:', err);
      }
    };
    socket.on('send_message', handleChatMessage);
    // Note: 'chat-message' is handled by codeSync.js - do NOT register here to avoid double delivery

    // get_chat_history: Request message history (legacy - use get-chat-history from codeSync.js)
    socket.on('get_chat_history', (data) => {
      const { roomId } = data;
      if (!roomId) return;
      const room = activeRooms.get(roomId);
      if (!room) {
        socket.emit('chat_history', []);
      } else {
        socket.emit('chat_history', room.messages.slice(-50));
      }
    });
    // Note: 'get-chat-history' is handled by codeSync.js - do NOT register here to avoid double delivery

    // Timer events
    socket.on('start_timer', (data) => {
      const { roomId, durationSeconds } = data;
      if (!roomId || !durationSeconds) return;

      io.to(roomId).emit('timer_started', {
        durationSeconds,
        startedAt: new Date(),
        startedBy: socket.data.username
      });
    });

    socket.on('pause_timer', (data) => {
      const { roomId } = data;
      if (!roomId) return;

      io.to(roomId).emit('timer_paused', {
        pausedBy: socket.data.username
      });
    });

    socket.on('resume_timer', (data) => {
      const { roomId } = data;
      if (!roomId) return;

      io.to(roomId).emit('timer_resumed', {
        resumedBy: socket.data.username
      });
    });

    socket.on('timer_advanced', (data) => {
      const { roomId, phaseIndex, timeLeft, bonusUsed } = data;
      if (!roomId) return;

      io.to(roomId).emit('timer_advanced', {
        phaseIndex,
        timeLeft,
        bonusUsed
      });
    });

    socket.on('timer_ended', (data) => {
      const { roomId } = data;
      if (!roomId) return;

      io.to(roomId).emit('timer_ended', {});
    });

    // end_session / end-call: Complete session and calculate ELO
    const handleEndSession = async (data) => {
      const { roomId, testResults, finalCode, finalLanguage } = data;
      if (!roomId) return;

      try {
        let room = activeRooms.get(roomId);
        let currentProblem = room?.currentProblem || null;
        let roomParticipants = (room?.participants || []).filter(p => p.userId);

        // Fall back to DB when in-memory state is incomplete (e.g. after server restart)
        if (!currentProblem || roomParticipants.length === 0) {
          const dbRoom = await Room.findOne({ roomId }).populate('problemId', 'title difficulty slug tags');
          if (!dbRoom) return socket.emit('error', { message: 'Room not found' });
          if (!currentProblem && dbRoom.problemId) {
            const p = dbRoom.problemId;
            currentProblem = { id: p._id, title: p.title, slug: p.slug, difficulty: p.difficulty, tags: p.tags };
          }
          if (roomParticipants.length === 0) {
            roomParticipants = dbRoom.participants.map(p => ({ userId: p.user?.toString() }));
          }
        }

        if (!currentProblem) {
          return socket.emit('error', { message: 'No problem set for this room' });
        }

        const isParticipant = roomParticipants.some(p => p.userId === socket.data.userId) ||
          (await Session.findOne({ roomId, participants: socket.data.userId })) !== null;
        if (!isParticipant) {
          return socket.emit('error', { message: 'Not a participant of this room' });
        }

        // Update local room reference for use below
        if (!room) room = { currentProblem, participants: roomParticipants, messages: [] };

        // Check if session already exists for this room (prevent duplicates)
        const existingSession = await Session.findOne({ roomId, status: 'completed' });
        if (existingSession) {
          return io.in(roomId).emit('session-ended', {
            sessionId: existingSession._id,
            duration: existingSession.duration
          });
        }

        // Create session record
        const session = new Session({
          roomId,
          problem: currentProblem.id,
          problemSnapshot: {
            title: currentProblem.title,
            difficulty: currentProblem.difficulty,
            slug: currentProblem.slug,
            tags: currentProblem.tags
          },
          participants: roomParticipants.map(p => p.userId).filter(Boolean),
          finalCode,
          finalLanguage,
          testResults,
          status: 'completed',
          endTime: new Date(),
          duration: data.duration || 0
        });

        await session.save();

        io.in(roomId).emit('session-ended', {
          sessionId: session._id,
          duration: session.duration
        });

        // Persist post-match stats for each participant
        try {
          const participantUserIds = roomParticipants.map(p => p.userId).filter(Boolean);
          const users = await User.find({ _id: { $in: participantUserIds } });

          for (const user of users) {
            const eloEntry = (session.eloData || []).find(
              e => e.userId?.toString() === user._id.toString()
            );
            const delta = eloEntry?.delta || 0;
            const won = testResults?.allPassed === true;

            const statsUpdate = {
              $inc: {
                'stats.totalMatches': 1,
                'stats.totalSubmissions': 1,
              },
              $push: {
                eloHistory: {
                  $each: [{ rating: user.elo + delta, delta, matchId: session._id, date: new Date() }],
                  $slice: -200,
                },
              },
            };

            if (won) {
              statsUpdate.$inc['stats.wins'] = 1;
              statsUpdate.$inc['stats.totalAccepted'] = 1;
              if (currentProblem.difficulty) {
                statsUpdate.$inc[`stats.solvedByDifficulty.${currentProblem.difficulty}`] = 1;
              }
              const tags = currentProblem.tags || [];
              for (const tag of tags) {
                const safeTag = tag.replace(/[.$]/g, '_');
                statsUpdate.$inc[`stats.solvedByTag.${safeTag}`] = 1;
              }
            } else {
              statsUpdate.$inc['stats.losses'] = 1;
            }

            if (finalLanguage) {
              const safeLang = finalLanguage.replace(/[.$]/g, '_');
              statsUpdate.$inc[`stats.languageUsage.${safeLang}`] = 1;
            }

            await User.updateOne({ _id: user._id }, statsUpdate);

            // Update computed fields
            const updated = await User.findById(user._id).select('stats').lean();
            if (updated?.stats?.totalMatches > 0) {
              const winRate = Math.round((updated.stats.wins / updated.stats.totalMatches) * 100);
              const acceptanceRate = updated.stats.totalSubmissions > 0
                ? Math.round((updated.stats.totalAccepted / updated.stats.totalSubmissions) * 100) : 0;
              await User.updateOne({ _id: user._id }, {
                $set: {
                  'stats.winRate': winRate,
                  'stats.acceptanceRate': acceptanceRate,
                  'stats.preferredLanguage': finalLanguage || updated.stats.preferredLanguage,
                },
              });
            }
          }
          // Check and award badges after stats update
          try {
            const badgeContext = {
              won,
              difficulty: room.currentProblem?.difficulty,
              duration: session.duration,
              tags: room.currentProblem?.tags || [],
            };
            const newBadges = await checkAndAwardBadges(user._id, badgeContext);
            if (newBadges.length > 0) {
              const userSocket = [...io.sockets.sockets.values()].find(
                s => s.data?.userId === user._id.toString()
              );
              if (userSocket) {
                userSocket.emit('badge:earned', newBadges);
              }
            }
          } catch (badgeErr) {
            logger.error('Badge check error:', badgeErr.message);
          }

        } catch (statsErr) {
          logger.error('Post-match stats update error:', statsErr.message);
        }

        // Queue debrief generation job
        try {
          const matchedPair = room.participants.filter(p =>
            p.role === 'interviewer' || p.role === 'interviewee'
          ).map(p => p.userId);
          // Fall back to all participants when roles aren't assigned
          const debriefParticipants = matchedPair.length > 0
            ? matchedPair
            : room.participants.map(p => p.userId).filter(Boolean);
          await agenda.now('ai-debrief', {
            roomId,
            participantIds: debriefParticipants
          });
          logger.info(`Queued AI debrief for session ${session._id}`);
        } catch (jobErr) {
          logger.error('Failed to queue debrief job:', jobErr);
        }

        logger.info(`Session ended: ${roomId}`);

        // Notify codeSync to clean up chat history for this room
        io.in(roomId).emit('room-cleanup', roomId);

        // Remove room from activeRooms to prevent memory leak
        activeRooms.delete(roomId);
        logger.info(`Removed room ${roomId} from activeRooms`);
      } catch (err) {
        logger.error('end_session error:', err);
        socket.emit('error', { message: 'Failed to end session' });
      }
    };
    socket.on('end_session', handleEndSession);

    // Cleanup on disconnect
    socket.on('disconnect_room', (data) => {
      const { roomId } = data;
      if (roomId) {
        socket.leave(roomId);
      }
    });
  });

  // Expose activeRooms for rejoin logic
  function getActiveRooms() {
    return activeRooms;
  }

  return { io, getActiveRooms };
};
