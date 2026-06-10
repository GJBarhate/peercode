'use strict';

const rateLimit = require('express-rate-limit');

// Auth limiter - increased for production to handle page refreshes + Google OAuth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 200 : 100,
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
});

// Separate, more lenient limiter for token refresh (called on every page load)
const refreshLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 refresh attempts per minute per IP
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many refresh attempts. Please try again later.' },
});

// Google OAuth limiter - separate from login limiter
const googleAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many Google auth attempts. Please try again later.' },
});

// General limiter - for public endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Dashboard limiter - for dashboard data endpoints
const dashboardLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 300,
  keyGenerator: (req) => (req.user && req.user.id ? req.user.id.toString() : req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.user?.role === 'admin',
  message: { error: 'Dashboard rate limit exceeded. Please try again later.' },
});

// API limiter - for general API endpoints
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 500,
  keyGenerator: (req) => (req.user && req.user.id ? req.user.id.toString() : req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'API rate limit exceeded. Please try again later.' },
});

// Gemini limiter - for AI requests
const userGeminiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => (req.user && req.user.id ? req.user.id.toString() : req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Gemini rate limit exceeded. Max 60 requests per minute.' },
});

// Code execution limiter
const executeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => (req.user && req.user.id ? req.user.id.toString() : req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Execution rate limit exceeded. Max 60 requests per minute.' },
});

module.exports = { authLimiter, refreshLimiter, googleAuthLimiter, generalLimiter, dashboardLimiter, apiLimiter, userGeminiLimiter, executeLimiter };
