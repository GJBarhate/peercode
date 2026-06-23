'use strict';

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

async function attachRedisAdapter(io) {
  if (!process.env.REDIS_URL) return;
  try {
    const { createClient } = require('redis');
    const { createAdapter } = require('@socket.io/redis-adapter');
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    logger.info('Socket.IO Redis adapter connected');
  } catch (err) {
    logger.warn('Socket.IO Redis adapter unavailable, using in-memory adapter:', err.message);
  }
}

async function initSocket(httpServer) {
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

  attachRedisAdapter(io).catch(err => logger.error('Redis adapter init failed:', err));

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

  require('./webrtcSignaling')(io);
  require('./codeSync')(io);
  await require('./matchingQueue')(io);
  require('./stats.socket')(io);
  const { initNotificationsSocket } = require('./notifications.socket');
  initNotificationsSocket(io);
  const initLeaderboardSocket = require('./leaderboard.socket');
  initLeaderboardSocket(io);
  const roomHandlerInstance = require('./roomHandler')(io);

  io.on('connection', (socket) => {
    // Latency measurement for connection quality indicator
    socket.on('ping-measure', () => {
      socket.emit('pong-measure');
    });

    socket.on('disconnect', (reason) => {
      logger.debug(`Socket disconnected for user ${socket.userId}: ${reason}`);
    });

    socket.on('error', (err) => {
      logger.error(`Socket error for ${socket.userId}:`, err);
    });

    socket.on('rejoin-room', async (data) => {
      const { roomId, previousSocketId } = data || {};
      if (!roomId || !previousSocketId) {
        return socket.emit('rejoin-error', { message: 'roomId and previousSocketId required' });
      }

      try {
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

        socket.join(roomId);
        socket.emit('rejoined', { roomId });

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

  return io;
}

module.exports = { initSocket };
