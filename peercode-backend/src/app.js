'use strict';

require('express-async-errors');
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const mongoose = require('mongoose');

const { authLimiter, generalLimiter, dashboardLimiter, apiLimiter, userGeminiLimiter, executeLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const auth = require('./middleware/auth');
const { getKeyPoolStatus } = require('./config/gemini');
const { fail } = require('./utils/httpResponse');

const authRouter = require('./routes/auth');
const roomsRouter = require('./routes/rooms');
const problemsRouter = require('./routes/problems');
const sessionsRouter = require('./routes/sessions');
const usersRouter = require('./routes/users');
const profileRouter = require('./routes/profile');
const debriefRouter = require('./routes/debrief');
const dashboardRouter = require('./routes/dashboard');
const geminiRouter = require('./routes/gemini');
const executeRouter = require('./routes/execute');
const tracksRouter = require('./routes/tracks');
const adminRouter = require('./routes/admin');
const geminiKeyRouter = require('./routes/geminiKey');
const subscriptionRouter = require('./routes/subscription');
const solutionsRouter = require('./routes/solutions');
const interviewRouter = require('./routes/interview');
const ratingsRouter = require('./routes/ratings');
const statsRouter = require('./routes/stats');
const leaderboardRouter = require('./routes/leaderboard');
const notificationsRouter = require('./routes/notifications');
const contestRouter = require('./routes/contest');

const app = express();

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
app.use(mongoSanitize());

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// Rate limiting
app.use(generalLimiter);

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: Math.round(process.uptime()),
    memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    nodeVersion: process.version,
    env: process.env.NODE_ENV,
    geminiPool: getKeyPoolStatus(),
  });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/rooms', auth, apiLimiter, roomsRouter);
app.use('/api/problems', apiLimiter, problemsRouter);
app.use('/api/sessions', auth, dashboardLimiter, sessionsRouter);
app.use('/api/users', auth, dashboardLimiter, usersRouter);
app.use('/api/profile', auth, dashboardLimiter, profileRouter);
app.use('/api/dashboard', auth, dashboardLimiter, dashboardRouter);
app.use('/api/debrief', auth, dashboardLimiter, debriefRouter);
app.use('/api/gemini', auth, userGeminiLimiter, geminiRouter);
app.use('/api/execute', auth, executeLimiter, executeRouter);
app.use('/api/tracks', tracksRouter);
app.use('/api/admin', auth, adminRouter);
app.use('/api/gemini-key', auth, geminiKeyRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/solutions', auth, apiLimiter, solutionsRouter);
app.use('/api/interview', auth, userGeminiLimiter, interviewRouter);
app.use('/api/ratings', apiLimiter, ratingsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/contests', apiLimiter, contestRouter);

// 404 handler
app.use((req, res) => {
  return fail(res, 404, 'Route not found');
});

// Global error handler
app.use(errorHandler);

module.exports = app;
