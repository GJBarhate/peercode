'use strict';

const logger = require('../utils/logger');
const Notification = require('../models/Notification');

const userSockets = new Map();

function initNotificationsSocket(io) {
  const notifNs = io.of('/notifications');

  notifNs.use((socket, next) => {
    const jwt = require('jsonwebtoken');
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.userId = decoded.id || decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  notifNs.on('connection', async (socket) => {
    const userId = socket.data.userId;
    if (!userId) return;

    userSockets.set(userId, socket.id);

    try {
      const unreadCount = await Notification.countDocuments({ userId, isRead: false });
      socket.emit('unread-count', unreadCount);
    } catch (err) {
      logger.error('Notification socket init error:', err.message);
    }

    socket.on('disconnect', () => {
      if (userSockets.get(userId) === socket.id) {
        userSockets.delete(userId);
      }
    });
  });

  return notifNs;
}

async function pushNotification(io, userId, notification) {
  try {
    const doc = await Notification.create({ userId, ...notification });

    const cap = 50;
    const count = await Notification.countDocuments({ userId });
    if (count > cap) {
      const oldest = await Notification.find({ userId })
        .sort({ createdAt: 1 })
        .limit(count - cap)
        .select('_id');
      await Notification.deleteMany({ _id: { $in: oldest.map(o => o._id) } });
    }

    const notifNs = io.of('/notifications');
    const socketId = userSockets.get(userId.toString());
    if (socketId) {
      notifNs.to(socketId).emit('new-notification', doc);
      const unreadCount = await Notification.countDocuments({ userId, isRead: false });
      notifNs.to(socketId).emit('unread-count', unreadCount);
    }

    return doc;
  } catch (err) {
    logger.error('Push notification error:', err.message);
  }
}

module.exports = { initNotificationsSocket, pushNotification };
