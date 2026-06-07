'use strict';

const Room = require('../models/Room');
const Session = require('../models/Session');
const logger = require('../utils/logger');

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
      io.to(to).emit('offer', { from: socket.id, sdp });
    });

    socket.on('answer', ({ to, sdp }) => {
      io.to(to).emit('answer', { from: socket.id, sdp });
    });

    socket.on('ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('ice-candidate', { from: socket.id, candidate });
    });

    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
      if (socket.currentRoom === roomId) {
        socket.currentRoom = null;
      }
      io.to(roomId).emit('participant-left', {
        socketId: socket.id,
        username: socket.user.username,
      });
    });

    socket.on('end-call', async (data) => {
      try {
        const { roomId } = data || {};
        if (!roomId) {
          return;
        }

        await Room.findOneAndUpdate({ roomId }, { $set: { status: 'completed' } });

        const session = await Session.findOne({ roomId });
        if (session && !session.endTime) {
          session.endTime = new Date();
          session.duration = session.startTime
            ? Math.max(0, Math.round((session.endTime - session.startTime) / 60000))
            : 0;
          session.isRecording = false;
          await session.save();
        }

        socket.leave(roomId);
        if (socket.currentRoom === roomId) {
          socket.currentRoom = null;
        }

        io.to(roomId).emit('room-ended', {
          message: 'The session has ended',
          timestamp: new Date(),
        });
      } catch (err) {
        logger.error('End call error:', err.message);
      }
    });

    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.user?.id}:`, error);
    });

    socket.on('kick-participant', (data) => {
      try {
        const { participantSocketId, reason } = data || {};
        if (!participantSocketId) return;

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
        if (!roomId) return;

        // Update room with selected problem
        await Room.findOneAndUpdate(
          { roomId },
          { $set: { problemId } },
          { new: true }
        );

        // Broadcast problem change to all participants
        io.to(roomId).emit('problem-updated', {
          problemId,
          problemTitle,
          selectedBy: socket.user.username,
          timestamp: Date.now(),
        });

        logger.info(`📋 Problem selected in room ${roomId}: ${problemTitle}`);
      } catch (err) {
        logger.error('Problem selection error:', err.message);
      }
    });

    socket.on('disconnect', () => {
      if (socket.currentRoom) {
        io.to(socket.currentRoom).emit('participant-left', {
          socketId: socket.id,
          username: socket.user?.username,
        });
      }
    });
  });
};
