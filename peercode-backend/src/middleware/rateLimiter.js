'use strict';

const rateLimit = require('express-rate-limit');

// General limiter - for public endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased from 100
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Dashboard limiter - for dashboard data endpoints
const dashboardLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200, // 200 requests per 5 minutes = 40 per minute
  keyGenerator: (req) => (req.user && req.user.id ? req.user.id.toString() : req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.user?.role === 'admin', // Skip rate limiting for admins
  message: { error: 'Dashboard rate limit exceeded. Please try again later.' },
});

// API limiter - for general API endpoints
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute
  keyGenerator: (req) => (req.user && req.user.id ? req.user.id.toString() : req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'API rate limit exceeded. Please try again later.' },
});

// Gemini limiter - for AI requests
const userGeminiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // Increased from 10 to 30
  keyGenerator: (req) => (req.user && req.user.id ? req.user.id.toString() : req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Gemini rate limit exceeded. Max 30 requests per minute.' },
});

// Code execution limiter
const executeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => (req.user && req.user.id ? req.user.id.toString() : req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Execution rate limit exceeded. Max 30 requests per minute.' },
});

module.exports = { generalLimiter, dashboardLimiter, apiLimiter, userGeminiLimiter, executeLimiter };
