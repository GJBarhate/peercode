'use strict';

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwtUtils');
const { fail } = require('../utils/httpResponse');

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/', // Ensure cookie is available across all paths
};

async function register(req, res) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return fail(res, 400, 'username, email and password are required');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ username, email, passwordHash });

  const tokenPayload = {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
    apiKey: user.apiKey || null,
  };

  const accessToken = signToken(tokenPayload);
  const refreshToken = signRefreshToken({ id: user._id.toString() });

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
  res.status(201).json({ accessToken, user: tokenPayload });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return fail(res, 400, 'email and password are required');
  }

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    return fail(res, 401, 'Invalid credentials');
  }

  if (user.isBanned) {
    return fail(res, 403, 'Account is banned');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return fail(res, 401, 'Invalid credentials');
  }

  const tokenPayload = {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
    apiKey: user.apiKey || null,
  };

  const accessToken = signToken(tokenPayload);
  const refreshToken = signRefreshToken({ id: user._id.toString() });

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
  res.json({ accessToken, user: tokenPayload });
}

async function refresh(req, res) {
  const token = req.cookies && req.cookies.refreshToken;
  if (!token) {
    return fail(res, 401, 'No refresh token');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    return fail(res, 401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.id);
  if (!user || user.isBanned) {
    return fail(res, 401, 'User not found or banned');
  }

  const tokenPayload = {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
    apiKey: user.apiKey || null,
  };

  const accessToken = signToken(tokenPayload);
  const refreshToken = signRefreshToken({ id: user._id.toString() });

  // Re-set the refresh token cookie on each refresh (extends expiry)
  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
  
  res.json({ accessToken, user: tokenPayload });
}

async function logout(req, res) {
  res.clearCookie('refreshToken');
  res.status(200).json({ message: 'Logged out successfully' });
}

module.exports = { register, login, refresh, logout };
