'use strict';

const rateLimit = require('express-rate-limit');

function makeRedisStore(prefix) {
  if (!process.env.REDIS_URL) return undefined;
  try {
    const { RedisStore } = require('rate-limit-redis');
    const { createClient } = require('redis');
    const client = createClient({ url: process.env.REDIS_URL });
    client.connect().catch(() => {});
    return new RedisStore({ prefix: `rl:${prefix}:`, sendCommand: (...args) => client.sendCommand(args) });
  } catch {
    return undefined;
  }
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 200 : 100,
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('auth'),
  message: { error: 'Too many authentication attempts. Please try again later.' },
});

const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('refresh'),
  message: { error: 'Too many refresh attempts. Please try again later.' },
});

const googleAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('gauth'),
  message: { error: 'Too many Google auth attempts. Please try again later.' },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('general'),
  message: { error: 'Too many requests, please try again later.' },
});

const dashboardLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 300,
  keyGenerator: (req) => (req.user && req.user.id ? req.user.id.toString() : req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.user?.role === 'admin',
  store: makeRedisStore('dashboard'),
  message: { error: 'Dashboard rate limit exceeded. Please try again later.' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  keyGenerator: (req) => (req.user && req.user.id ? req.user.id.toString() : req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('api'),
  message: { error: 'API rate limit exceeded. Please try again later.' },
});

const userGeminiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => (req.user && req.user.id ? req.user.id.toString() : req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('gemini'),
  message: { error: 'Gemini rate limit exceeded. Max 60 requests per minute.' },
});

const executeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => (req.user && req.user.id ? req.user.id.toString() : req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('execute'),
  message: { error: 'Execution rate limit exceeded. Max 60 requests per minute.' },
});

module.exports = { authLimiter, refreshLimiter, googleAuthLimiter, generalLimiter, dashboardLimiter, apiLimiter, userGeminiLimiter, executeLimiter };
