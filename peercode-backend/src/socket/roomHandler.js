'use strict';

const logger = require('../utils/logger');
const Session = require('../models/Session');
const Problem = require('../models/Problem');
const User = require('../models/User');
const { calculateEloDelta, updateEloRating } = require('../utils/eloSystem');
const { agenda } = require('../config/agenda');

// Store active rooms in memory for quick access
const activeRooms = new Map();

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
          io.to(roomId).emit('participant_left', {
            userId: socket.data.userId,
            username: socket.data.username,
            participants: room.participants
          });
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
        const room = activeRooms.get(roomId);
        if (!room) return socket.emit('error', { message: 'Room not found' });

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

        // Reset code when problem changes
        room.currentCode = '';
        room.language = 'javascript';

        io.to(roomId).emit('problem_changed', {
          problem: room.currentProblem,
          code: '',
          language: 'javascript'
        });
        io.to(roomId).emit('problem-updated', {
          problem: room.currentProblem,
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

      const room = activeRooms.get(roomId);
      if (!room) return;

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

      const room = activeRooms.get(roomId);
      if (!room) return;

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

      try {
        const room = activeRooms.get(roomId);
        if (!room) return;

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
        const room = activeRooms.get(roomId);
        if (!room || !room.currentProblem) {
          return socket.emit('error', { message: 'Invalid room state' });
        }

        // Check if session already exists for this room (prevent duplicates)
        const existingSession = await Session.findOne({ roomId, status: 'completed' });
        if (existingSession) {
          return io.in(roomId).emit('session_ended', {
            sessionId: existingSession._id,
            duration: existingSession.duration
          });
        }

        // Create session record
        const session = new Session({
          roomId,
          problem: room.currentProblem.id,
          problemSnapshot: {
            title: room.currentProblem.title,
            difficulty: room.currentProblem.difficulty,
            slug: room.currentProblem.slug,
            tags: room.currentProblem.tags
          },
          participants: room.participants.map(p => p.userId),
          finalCode,
          finalLanguage,
          testResults,
          status: 'completed',
          endTime: new Date(),
          duration: data.duration || 0
        });

        await session.save();

        // Notify room that session ended
        io.in(roomId).emit('session_ended', {
          sessionId: session._id,
          duration: session.duration
        });
        io.in(roomId).emit('room-ended', {
          sessionId: session._id,
          duration: session.duration
        });

        // Queue debrief generation job
        try {
          // Filter to only include interviewer and interviewee (not observers)
          const matchedPair = room.participants.filter(p =>
            p.role === 'interviewer' || p.role === 'interviewee'
          ).map(p => p.userId);
          await agenda.now('ai-debrief', {
            roomId,
            participantIds: matchedPair
          });
          logger.info(`Queued AI debrief for session ${session._id}`);
        } catch (jobErr) {
          logger.error('Failed to queue debrief job:', jobErr);
        }

        logger.info(`Session ended: ${roomId}`);

        // Remove room from activeRooms to prevent memory leak
        activeRooms.delete(roomId);
        logger.info(`Removed room ${roomId} from activeRooms`);
      } catch (err) {
        logger.error('end_session error:', err);
        socket.emit('error', { message: 'Failed to end session' });
      }
    };
    socket.on('end_session', handleEndSession);
    socket.on('end-call', handleEndSession);

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
