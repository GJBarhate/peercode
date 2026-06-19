'use strict';

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { ok: success, fail } = require('../utils/httpResponse');
const logger = require('../utils/logger');

async function updateProfile(req, res) {
  try {
    const { username, email } = req.body;
    const userId = req.user?.id || req.user?.userId;

    if (!userId) {
      return fail(res, 401, 'User not authenticated');
    }

    const user = await User.findById(userId);
    if (!user) {
      return fail(res, 404, 'User not found');
    }

    // Update username if provided
    if (username !== undefined) {
      if (username && username.length < 3) {
        return fail(res, 400, 'Username must be at least 3 characters');
      }
      if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
        return fail(res, 400, 'Username can only contain letters, numbers, and underscores');
      }

      if (username) {
        const existing = await User.findOne({ username: username.toLowerCase(), _id: { $ne: userId } });
        if (existing) {
          return fail(res, 400, 'Username is already taken');
        }
        user.username = username;
      }
    }

    // Update email if provided
    if (email !== undefined) {
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return fail(res, 400, 'Invalid email format');
      }
      if (email) {
        const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
        if (existing) {
          return fail(res, 400, 'Email is already in use');
        }
        user.email = email.toLowerCase();
      }
    }

    await user.save();
    return success(res, { user: { id: user._id, username: user.username, email: user.email } }, 'Profile updated');
  } catch (err) {
    logger.error('Update profile error:', err);
    return fail(res, 500, 'Failed to update profile');
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user?.id || req.user?.userId;

    if (!userId) {
      return fail(res, 401, 'User not authenticated');
    }

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      return fail(res, 400, 'All password fields are required');
    }

    if (newPassword.length < 8) {
      return fail(res, 400, 'New password must be at least 8 characters');
    }

    if (newPassword !== confirmPassword) {
      return fail(res, 400, 'Passwords do not match');
    }

    // Fetch user with password hash (normally not selected)
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      return fail(res, 404, 'User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return fail(res, 400, 'Current password is incorrect');
    }

    // Check that new password is different from current
    const isSameAsCurrent = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSameAsCurrent) {
      return fail(res, 400, 'New password must be different from current password');
    }

    // Hash new password and update
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    return success(res, {}, 'Password updated successfully');
  } catch (err) {
    logger.error('Change password error:', err);
    return fail(res, 500, 'Failed to change password');
  }
}

module.exports = { updateProfile, changePassword };
