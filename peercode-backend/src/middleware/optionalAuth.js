'use strict';

const { verifyToken } = require('../utils/jwtUtils');

async function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.slice(7);
  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id, _id: decoded.id, username: decoded.username, role: decoded.role };
  } catch (_) {
    // ignore — treat as anonymous
  }
  next();
}

module.exports = optionalAuth;
