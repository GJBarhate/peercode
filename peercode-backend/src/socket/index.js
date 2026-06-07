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
    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected for user ${socket.userId}`);
    });

    socket.on('error', (err) => {
      logger.error(`Socket error for ${socket.userId}:`, err);
    });
  });

  require('./webrtcSignaling')(io);
  require('./codeSync')(io);
  require('./matchingQueue')(io);
  require('./roomHandler')(io);

  return io;
}

module.exports = { initSocket };
