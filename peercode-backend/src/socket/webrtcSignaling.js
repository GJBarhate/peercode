'use strict';

const Room = require('../models/Room');
const Problem = require('../models/Problem');
const Session = require('../models/Session');
const User = require('../models/User');
const AiDebrief = require('../models/AiDebrief');
const logger = require('../utils/logger');
const { agenda } = require('../config/agenda');

async function findRoom(roomId) {
  let room = null;

  try {
    room = await Room.findById(roomId);
  } catch (_) {}

  if (!room) {
    room = await Room.findOne({ roomId });
  }

  return room;
}

async function buildRoomPayload(roomId) {
  const room = await Room.findOne({ roomId })
    .populate('participants.user', 'username elo role')
    .populate('problemId');

  if (!room) {
    return null;
  }

  return {
    _id: room._id,
    roomId: room.roomId,
    host: room.host,
    participants: room.participants.map(p => ({
      user: p.user,
      role: p.role,
      joinedAt: p.joinedAt,
      username: p.user?.username || 'Unknown',
    })),
    status: room.status,
    problem: room.problemId,
    maxParticipants: room.maxParticipants,
    createdAt: room.createdAt,
  };
}

module.exports = function (io) {
  io.on('connection', (socket) => {
    socket.on('join-room', async (data) => {
      try {
        const { roomId, role, username } = typeof data === 'string' ? { roomId: data } : data;
        const room = await findRoom(roomId);

        if (!room) {
          socket.emit('room-error', { error: 'Room not found', message: 'Room not found' });
          return;
        }

        const alreadyInRoom = room.participants.some(
          (participant) => participant.user && participant.user.toString() === socket.user.id.toString()
        );

        if (!alreadyInRoom && room.participants.length >= room.maxParticipants) {
          socket.emit('room-error', { error: 'Room is full', message: 'Room is full' });
          return;
        }

        if (!alreadyInRoom) {
          const nextRole = ['interviewer', 'interviewee', 'observer'].includes(role) ? role : 'observer';
          room.participants.push({
            user: socket.user.id,
            role: nextRole,
            joinedAt: new Date(),
          });
          if (room.status === 'waiting') {
            room.status = 'active';
          }
          await room.save();
        }

        socket.join(room.roomId);
        socket.currentRoom = room.roomId;

        await Session.findOneAndUpdate(
          { roomId: room.roomId },
          {
            $setOnInsert: {
              roomId: room.roomId,
              startTime: new Date(),
              isRecording: true,
            },
            $addToSet: {
              participants: socket.user.id,
            },
          },
          { upsert: true, new: true }
        );

        const roomPayload = await buildRoomPayload(room.roomId);
        if (roomPayload) {
          io.to(room.roomId).emit('room-updated', roomPayload);
        }

        // Always announce the new SOCKET to existing peers so a WebRTC
        // connection can bootstrap — even if this user already has a
        // participants record from another tab/device. `alreadyInRoom`
        // only governs the Mongo dedup above; it must not gate the
        // peer-connection handshake, otherwise two sessions of the same
        // account (or a reconnect that raced the cleanup) never connect.
        io.to(room.roomId).except(socket.id).emit('participant-joined', {
          socketId: socket.id,
          userId: socket.user.id,
          username: socket.user.username || username,
        });
      } catch (err) {
        logger.error('Join room error:', err);
        socket.emit('room-error', { error: 'Failed to join room', message: 'Failed to join room' });
      }
    });

    socket.on('offer', ({ to, sdp }) => {
      if (!socket.currentRoom) return;
      const roomSockets = io.sockets.adapter.rooms.get(socket.currentRoom);
      if (!roomSockets || !roomSockets.has(to)) return;
      io.to(to).emit('offer', { from: socket.id, sdp });
    });

    socket.on('answer', ({ to, sdp }) => {
      if (!socket.currentRoom) return;
      const roomSockets = io.sockets.adapter.rooms.get(socket.currentRoom);
      if (!roomSockets || !roomSockets.has(to)) return;
      io.to(to).emit('answer', { from: socket.id, sdp });
    });

    socket.on('ice-candidate', ({ to, candidate }) => {
      if (!socket.currentRoom) return;
      const roomSockets = io.sockets.adapter.rooms.get(socket.currentRoom);
      if (!roomSockets || !roomSockets.has(to)) return;
      io.to(to).emit('ice-candidate', { from: socket.id, candidate });
    });

    socket.on('user-mic-status', ({ roomId, isMuted, isVideoOff }) => {
      if (!roomId) return
      socket.to(roomId).emit('user-mic-status', {
        socketId: socket.id,
        userId: socket.user?.id,
        isMuted,
        isVideoOff,
      })
    });

    socket.on('screen-share-started', ({ roomId }) => {
      if (!roomId) return
      socket.to(roomId).emit('screen-share-started', {
        socketId: socket.id,
      })
    });

    socket.on('screen-share-stopped', ({ roomId }) => {
      if (!roomId) return
      socket.to(roomId).emit('screen-share-stopped', {
        socketId: socket.id,
      })
    });

    socket.on('leave-room', async (roomId) => {
      socket.leave(roomId);
      if (socket.currentRoom === roomId) {
        socket.currentRoom = null;
      }

      try {
        await Room.findOneAndUpdate(
          { roomId },
          { $pull: { participants: { user: socket.user?.id } } }
        );
      } catch (err) {
        logger.error(`Failed to remove participant on leave-room ${roomId}:`, err.message);
      }

      io.to(roomId).emit('participant-left', {
        socketId: socket.id,
        username: socket.user.username,
      });
    });

    socket.on('end-call', async (data) => {
      try {
        const { roomId, finalCode, finalLanguage } = data || {};
        if (!roomId) return;

        await Room.findOneAndUpdate({ roomId }, { $set: { status: 'completed' } });

        const session = await Session.findOne({ roomId });
        if (session) {
          if (!session.endTime) {
            session.endTime = new Date();
            session.duration = session.startTime
              ? Math.max(0, Math.round((session.endTime - session.startTime) / 60000))
              : 0;
          }
          session.status = 'completed';
          if (finalCode) session.finalCode = finalCode;
          if (finalLanguage) session.finalLanguage = finalLanguage;
          session.isRecording = false;
          await session.save();

          // Queue AI debrief generation using all session participants
          const participantIds = (session.participants || []).map(p => p.toString ? p.toString() : String(p));
          if (participantIds.length > 0) {
            try {
              await agenda.now('ai-debrief', {
                roomId,
                participantIds,
              });
              logger.info(`Queued ai-debrief for room ${roomId} with ${participantIds.length} participants`);
            } catch (jobErr) {
              logger.error('Failed to queue debrief job:', jobErr.message);
            }
          }
        }

        socket.leave(roomId);
        if (socket.currentRoom === roomId) socket.currentRoom = null;

        io.to(roomId).emit('room-ended', {
          message: 'The session has ended',
          sessionId: session?._id,
          timestamp: new Date(),
        });
      } catch (err) {
        logger.error('End call error:', err.message);
      }
    });

    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.user?.id}:`, error);
    });

    socket.on('kick-participant', async (data) => {
      try {
        const { participantSocketId, reason } = data || {};
        if (!participantSocketId || !socket.currentRoom) return;

        const dbRoom = await Room.findOne({ roomId: socket.currentRoom }).lean();
        const isHost = dbRoom && dbRoom.host?.toString() === socket.user?.id?.toString();
        const isInterviewer = dbRoom?.participants?.some(
          p => p.user?.toString() === socket.user?.id?.toString() && p.role === 'interviewer'
        );
        if (!isHost && !isInterviewer) {
          return socket.emit('error', { message: 'Only the host or interviewer can kick participants' });
        }

        io.to(participantSocketId).emit('participant-kicked', {
          message: reason || 'You were removed from the session',
          timestamp: new Date(),
        });
      } catch (err) {
        logger.error('Kick participant error:', err.message);
      }
    });

    socket.on('problem-selected', async (data) => {
      try {
        const { roomId, problemId, problemTitle } = data || {};
        if (!roomId || !problemId) return;

        // Fetch full problem data
        const problem = await Problem.findById(problemId).lean();
        if (!problem) {
          logger.warn(`Problem not found: ${problemId}`);
          return;
        }

        // Update room with selected problem
        await Room.findOneAndUpdate(
          { roomId },
          { $set: { problemId } },
          { new: true }
        );

        // Broadcast problem change to all participants with full data
        io.to(roomId).emit('problem-updated', {
          problem: {
            _id: problem._id,
            title: problem.title,
            slug: problem.slug,
            difficulty: problem.difficulty,
            description: problem.description,
            examples: problem.examples,
            testCases: problem.testCases,
            constraints: problem.constraints,
            tags: problem.tags,
            hints: problem.hints,
            editorial: problem.editorial,
          },
          problemId,
          problemTitle: problemTitle || problem.title,
          selectedBy: socket.user.username,
          timestamp: Date.now(),
        });

        logger.info(`📋 Problem selected in room ${roomId}: ${problem.title}`);
      } catch (err) {
        logger.error('Problem selection error:', err.message);
      }
    });

    socket.on('disconnect', async () => {
      if (socket.currentRoom) {
        const roomId = socket.currentRoom;

        // Remove user from MongoDB Room document
        try {
          await Room.findOneAndUpdate(
            { roomId },
            { $pull: { participants: { user: socket.user?.id } } }
          );
        } catch (err) {
          logger.error(`Failed to remove user from room ${roomId}:`, err.message);
        }

        // Leave Socket.IO room
        socket.leave(roomId);

        // Notify other participants
        io.to(roomId).emit('participant-left', {
          socketId: socket.id,
          username: socket.user?.username,
        });
      }
    });
  });
};
