'use strict';

const { verifyToken } = require('../utils/jwtUtils');
const { fail } = require('../utils/httpResponse');
const User = require('../models/User');

async function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return fail(res, 401, 'No token provided');
  }

  const token = authHeader.slice(7);
  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return fail(res, 401, 'User not found');
    }
    req.user = user;
    next();
  } catch (err) {
    return fail(res, 401, 'Invalid or expired token');
  }
}

module.exports = auth;
