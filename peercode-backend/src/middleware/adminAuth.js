'use strict';

const { fail } = require('../utils/httpResponse');

function adminAuth(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return fail(res, 403, 'Admin access required');
  }
  next();
}

module.exports = adminAuth;
