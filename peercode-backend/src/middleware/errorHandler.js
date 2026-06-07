'use strict';

const mongoose = require('mongoose');
const { fail } = require('../utils/httpResponse');

function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV !== 'production';

  // Mongoose Validation Error
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    return fail(res, 400, 'Validation error', messages);
  }

  // Mongoose CastError (invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    return fail(res, 400, 'Invalid ID format');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return fail(res, 409, `Duplicate value for ${field}`);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return fail(res, 401, 'Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    return fail(res, 401, 'Token expired');
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  const response = {
    success: false,
    error: message,
    message,
  };
  if (isDev && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
