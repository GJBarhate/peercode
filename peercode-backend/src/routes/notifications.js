'use strict';

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');
const { ok: success, fail } = require('../utils/httpResponse');

router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const userId = req.user.id || req.user.userId;
    const [notifications, total] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId }),
    ]);

    return success(res, { notifications, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return fail(res, 500, 'Failed to fetch notifications');
  }
});

router.patch('/read-all', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
    return success(res, { message: 'All notifications marked as read' });
  } catch (err) {
    return fail(res, 500, 'Failed to mark notifications as read');
  }
});

router.patch('/:id/read', auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    await Notification.updateOne({ _id: req.params.id, userId }, { $set: { isRead: true } });
    return success(res, { message: 'Notification marked as read' });
  } catch (err) {
    return fail(res, 500, 'Failed to update notification');
  }
});

module.exports = router;
