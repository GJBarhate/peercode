'use strict';

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

function initSocket(httpServer) {
  const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
    throw new Error('FRONTEND_URL must be configured in production');
  }

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    path: '/socket.io/',
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.userId = decoded.id || decoded.userId;
      socket.data.username = decoded.username;
      socket.userId = socket.data.userId; // For backward compatibility
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('disconnect', (reason) => {
      logger.debug(`Socket disconnected for user ${socket.userId}: ${reason}`);
    });

    socket.on('error', (err) => {
      logger.error(`Socket error for ${socket.userId}:`, err);
    });

    // Handle reconnection with room rejoin
    socket.on('rejoin-room', async (data) => {
      const { roomId, previousSocketId } = data || {};
      if (!roomId || !previousSocketId) {
        return socket.emit('rejoin-error', { message: 'roomId and previousSocketId required' });
      }

      try {
        // Update roomHandler's activeRooms to use new socket ID
        const activeRooms = roomHandlerInstance.getActiveRooms ? roomHandlerInstance.getActiveRooms() : new Map();
        
        const room = activeRooms.get(roomId);
        if (room) {
          const participant = room.participants.find(p => p.socketId === previousSocketId);
          if (participant) {
            participant.socketId = socket.id;
            participant.connected = true;
            logger.info(`Rejoined user ${socket.data.username} to room ${roomId}`);
          }
        }

        // Rejoin socket.io room
        socket.join(roomId);

        // Emit current room state
        socket.emit('rejoined', { roomId });
        
        // Notify others in room
        socket.to(roomId).emit('participant-rejoined', {
          userId: socket.data.userId,
          username: socket.data.username,
          socketId: socket.id,
        });
      } catch (err) {
        logger.error('Rejoin room error:', err);
        socket.emit('rejoin-error', { message: 'Failed to rejoin room' });
      }
    });
  });

  require('./webrtcSignaling')(io);
  require('./codeSync')(io);
  require('./matchingQueue')(io);
  const roomHandlerInstance = require('./roomHandler')(io);

  return io;
}

module.exports = { initSocket };
