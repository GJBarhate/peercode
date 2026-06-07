'use strict';

function ok(res, data = null, message = null, status = 200) {
  return res.status(status).json({
    success: true,
    data,
    message,
    error: null,
  });
}

function fail(res, status, message, details = undefined) {
  const payload = {
    success: false,
    data: null,
    error: message,
    message,
  };

  if (details !== undefined) {
    payload.details = details;
  }

  return res.status(status).json(payload);
}

module.exports = { ok, fail };
