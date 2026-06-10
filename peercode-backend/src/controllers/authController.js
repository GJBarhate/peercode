'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { signToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwtUtils');
const { fail, ok: success } = require('../utils/httpResponse');
const logger = require('../utils/logger');
const { agenda } = require('../config/agenda');

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function sendVerificationEmail(user, token) {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    logger.info(`[DEV MODE] Verification token for ${user.email}: ${token}`);
    logger.info(`[DEV MODE] Verification URL: ${verifyUrl}`);
  }

  await agenda.now('send-email', {
    to: user.email,
    subject: 'Verify your PeerCode account',
    html: `
      <p>Hi ${user.username},</p>
      <p>Thanks for signing up for PeerCode! Please verify your email address by clicking the link below:</p>
      <p><a href="${verifyUrl}">Verify Email</a></p>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `,
  });
}

async function register(req, res) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return fail(res, 400, 'username, email and password are required');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const verificationToken = generateVerificationToken();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const user = await User.create({ 
    username, 
    email, 
    passwordHash,
    verified: false,
    emailVerificationToken: verificationToken,
    emailVerificationExpires: verificationExpires,
  });

  // Send verification email
  try {
    await sendVerificationEmail(user, verificationToken);
  } catch (err) {
    logger.error('Failed to send verification email:', err);
  }

  // Return success but don't log in the user yet
  res.status(201).json({ 
    message: 'Registration successful. Please check your email to verify your account.',
    requiresVerification: true 
  });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return fail(res, 400, 'email and password are required');
  }

  const user = await User.findOne({ email }).select('+passwordHash +loginAttempts +lockUntil');
  if (!user) {
    return fail(res, 401, 'Invalid credentials');
  }

  if (user.isBanned) {
    return fail(res, 403, 'Account is banned');
  }

  // Check account lockout
  if (user.lockUntil && user.lockUntil > new Date()) {
    const remainingMinutes = Math.ceil((user.lockUntil - new Date()) / 60000);
    return fail(res, 429, `Account temporarily locked. Try again in ${remainingMinutes} minute(s).`);
  }

  // Allow login without verification in development mode
  const isDev = process.env.NODE_ENV === 'development';
  if (!user.verified && !isDev) {
    return fail(res, 403, 'Please verify your email address before logging in. Check your inbox for a verification link.');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    // Increment login attempts
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
    }
    await user.save();
    return fail(res, 401, 'Invalid credentials');
  }

  // Reset login attempts on successful login
  user.loginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  const tokenPayload = {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
    apiKey: user.apiKey || null,
  };

  const accessToken = signToken(tokenPayload);
  const refreshToken = signRefreshToken({ id: user._id.toString(), tokenVersion: user.tokenVersion || 0 });

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

  // Reuse detection: if tokenVersion in token doesn't match user's current tokenVersion,
  // it means this token was already used (replay attack)
  // Allow a small grace period for concurrent requests (tokenVersion difference of 1)
  if (decoded.tokenVersion !== undefined && decoded.tokenVersion < (user.tokenVersion || 0)) {
    logger.warn(`Refresh token reuse detected for user ${user.username}. Possible token theft.`);
    // Invalidate all tokens by incrementing tokenVersion
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    return fail(res, 401, 'Refresh token reuse detected. Please login again.');
  }

  const tokenPayload = {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
    apiKey: user.apiKey || null,
  };

  const accessToken = signToken(tokenPayload);

  // Token rotation: increment tokenVersion and issue new refresh token
  const newTokenVersion = (user.tokenVersion || 0) + 1;
  const refreshToken = signRefreshToken({ id: user._id.toString(), tokenVersion: newTokenVersion });

  // Update user's tokenVersion in database
  user.tokenVersion = newTokenVersion;
  await user.save();

  // Re-set the refresh token cookie on each refresh (extends expiry)
  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
   
  res.json({ accessToken, user: tokenPayload });
}

async function verifyEmail(req, res) {
  const { token } = req.query;

  if (!token) {
    return fail(res, 400, 'Verification token is required');
  }

  const user = await User.findOne({ 
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() }
  });

  if (!user) {
    return fail(res, 400, 'Invalid or expired verification token');
  }

  user.verified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  success(res, { message: 'Email verified successfully. You can now log in.' });
}

async function resendVerificationEmail(req, res) {
  const { email } = req.body;

  if (!email) {
    return fail(res, 400, 'Email is required');
  }

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if user exists
    return success(res, { message: 'If the email exists, a verification link has been sent.' });
  }

  if (user.verified) {
    return fail(res, 400, 'Account is already verified');
  }

  const verificationToken = generateVerificationToken();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  user.emailVerificationToken = verificationToken;
  user.emailVerificationExpires = verificationExpires;
  await user.save();

  try {
    await sendVerificationEmail(user, verificationToken);
  } catch (err) {
    logger.error('Failed to resend verification email:', err);
  }

  success(res, { message: 'If the email exists, a verification link has been sent.' });
}

async function googleAuth(req, res) {
  const { code } = req.body;

  if (!code) {
    return fail(res, 400, 'Authorization code is required');
  }

  try {
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return fail(res, 400, 'Email not provided by Google');
    }

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        user.profilePicture = picture;
        await user.save();
      } else if (user.authProvider === 'local' && !user.googleId) {
        return fail(res, 400, 'Account exists with email/password. Please log in with password or link Google account from settings.');
      }
    } else {
      const baseUsername = name?.replace(/\s+/g, '').toLowerCase() || email.split('@')[0];
      let username = baseUsername.substring(0, 20);
      let counter = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername.substring(0, 17)}${counter}`;
        counter++;
      }

      user = await User.create({
        username,
        email,
        passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
        googleId,
        authProvider: 'google',
        profilePicture: picture,
        verified: true,
      });
    }

    const tokenPayload = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      apiKey: user.apiKey || null,
    };

    const accessToken = signToken(tokenPayload);

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    const refreshToken = signRefreshToken({ id: user._id.toString(), tokenVersion: user.tokenVersion });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.json({ accessToken, user: tokenPayload });
  } catch (err) {
    logger.error('Google auth error:', err);
    if (err.message?.includes('invalid_grant')) {
      return fail(res, 400, 'Invalid authorization code');
    }
    fail(res, 500, 'Google authentication failed');
  }
}

async function linkGoogleAccount(req, res) {
  const { code } = req.body;
  const userId = req.user.id;

  if (!code) {
    return fail(res, 400, 'Authorization code is required');
  }

  try {
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, picture } = payload;

    const existingGoogleUser = await User.findOne({ googleId });
    if (existingGoogleUser && existingGoogleUser._id.toString() !== userId) {
      return fail(res, 400, 'This Google account is already linked to another PeerCode account');
    }

    const user = await User.findById(userId);
    if (!user) {
      return fail(res, 404, 'User not found');
    }

    user.googleId = googleId;
    user.authProvider = 'google';
    user.profilePicture = picture;
    user.verified = true;
    await user.save();

    success(res, { message: 'Google account linked successfully' });
  } catch (err) {
    logger.error('Link Google account error:', err);
    fail(res, 500, 'Failed to link Google account');
  }
}

async function unlinkGoogleAccount(req, res) {
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user) {
    return fail(res, 404, 'User not found');
  }

  if (!user.googleId) {
    return fail(res, 400, 'No Google account linked');
  }

  if (user.authProvider === 'google' && !user.passwordHash) {
    return fail(res, 400, 'Cannot unlink Google account without a password. Please set a password first.');
  }

  user.googleId = undefined;
  user.authProvider = 'local';
  user.profilePicture = undefined;
  await user.save();

  success(res, { message: 'Google account unlinked successfully' });
}

async function logout(req, res) {
  res.clearCookie('refreshToken');
  res.status(200).json({ message: 'Logged out successfully' });
}

module.exports = { register, login, refresh, logout, verifyEmail, resendVerificationEmail, googleAuth, linkGoogleAccount, unlinkGoogleAccount };
