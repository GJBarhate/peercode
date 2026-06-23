'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { signToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwtUtils');
const nodemailer = require('nodemailer');
const { fail, ok: success } = require('../utils/httpResponse');
const logger = require('../utils/logger');

const mailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

function generateOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}

function buildTokenPayload(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
    subscription: user.subscription
      ? { plan: user.subscription.plan || 'free', status: user.subscription.status || 'active' }
      : { plan: 'free', status: 'active' },
  };
}

async function sendOTPEmail(user, otp) {
  if (process.env.NODE_ENV === 'development') {
    logger.info(`[DEV MODE] OTP for ${user.email}: ${otp}`);
  }
  await mailTransporter.sendMail({
    from: process.env.SMTP_USER,
    to: user.email,
    subject: 'Your PeerCode Verification Code',
    html: `
      <p>Hi ${user.username},</p>
      <p>Your verification code is: <strong style="font-size: 24px; letter-spacing: 4px;">${otp}</strong></p>
      <p>This code expires in 3 minutes.</p>
      <p>If you didn't request this code, you can safely ignore this email.</p>
    `,
  });
}

async function register(req, res) {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return fail(res, 400, 'username, email and password are required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 400, 'Invalid email address');
  if (password.length < 8) return fail(res, 400, 'Password must be at least 8 characters');

  const existingUser = await User.findOne({ email });
  if (existingUser && existingUser.verified) return fail(res, 409, 'Email already registered');

  const passwordHash = await bcrypt.hash(password, 10);
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

  let user;
  if (existingUser) {
    existingUser.username = username;
    existingUser.passwordHash = passwordHash;
    existingUser.emailVerificationToken = otp;
    existingUser.emailVerificationExpires = otpExpires;
    user = await existingUser.save();
  } else {
    user = await User.create({
      username,
      email,
      passwordHash,
      verified: false,
      emailVerificationToken: otp,
      emailVerificationExpires: otpExpires,
    });
  }

  try {
    await sendOTPEmail(user, otp);
  } catch (err) {
    logger.error('Failed to send OTP email:', err);
  }

  res.status(201).json({
    message: 'Registration successful. Please check your email for the verification code.',
    requiresVerification: true,
  });
}

async function verifyOTP(req, res) {
  const { email, otp } = req.body;
  if (!email || !otp) return fail(res, 400, 'email and OTP are required');

  const user = await User.findOne({
    email,
    emailVerificationToken: otp,
    emailVerificationExpires: { $gt: new Date() },
  });

  if (!user) return fail(res, 400, 'Invalid or expired OTP');

  user.verified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  const tokenPayload = buildTokenPayload(user);
  const accessToken = signToken(tokenPayload);
  const refreshToken = signRefreshToken({ id: user._id.toString(), tokenVersion: user.tokenVersion || 0 });

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
  res.json({ accessToken, user: tokenPayload });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, 400, 'email and password are required');

  const user = await User.findOne({ email }).select('+passwordHash +loginAttempts +lockUntil');
  if (!user) return fail(res, 401, 'Invalid credentials');
  if (user.isBanned) return fail(res, 403, 'Account is banned');

  if (user.lockUntil && user.lockUntil > new Date()) {
    const remainingMinutes = Math.ceil((user.lockUntil - new Date()) / 60000);
    return fail(res, 429, `Account temporarily locked. Try again in ${remainingMinutes} minute(s).`);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    await user.save();
    return fail(res, 401, 'Invalid credentials');
  }

  user.loginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  const tokenPayload = buildTokenPayload(user);
  const accessToken = signToken(tokenPayload);
  const refreshToken = signRefreshToken({ id: user._id.toString(), tokenVersion: user.tokenVersion || 0 });

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
  res.json({ accessToken, user: tokenPayload });
}

async function refresh(req, res) {
  const token = req.cookies?.refreshToken;
  if (!token) return fail(res, 401, 'No refresh token');

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    return fail(res, 401, 'Invalid or expired refresh token');
  }

  // Atomic check-and-increment: prevents race condition where two concurrent requests
  // both pass the version check before either increments it
  const expectedVersion = decoded.tokenVersion ?? 0;
  const user = await User.findOneAndUpdate(
    { _id: decoded.id, isBanned: { $ne: true }, tokenVersion: expectedVersion },
    { $inc: { tokenVersion: 1 } },
    { new: true }
  ).select('_id username email role subscription elo usage apiKey tokenVersion');

  if (!user) {
    logger.warn(`Refresh token reuse or version mismatch for user id: ${decoded.id}`);
    return fail(res, 401, 'Invalid or expired refresh token. Please login again.');
  }

  const tokenPayload = buildTokenPayload(user);
  const accessToken = signToken(tokenPayload);
  const refreshToken = signRefreshToken({ id: user._id.toString(), tokenVersion: user.tokenVersion });

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
  res.json({ accessToken, user: tokenPayload });
}

async function resendOTP(req, res) {
  const { email } = req.body;
  if (!email) return fail(res, 400, 'Email is required');

  const user = await User.findOne({ email });
  if (!user) return success(res, { message: 'If the email exists, an OTP has been sent.' });
  if (user.verified) return fail(res, 400, 'Account is already verified');

  // 60-second cooldown between resends
  const lastSent = user.emailVerificationExpires
    ? new Date(user.emailVerificationExpires).getTime() - 3 * 60 * 1000
    : 0;
  if (Date.now() - lastSent < 60 * 1000) {
    return fail(res, 429, 'Please wait 60 seconds before requesting a new OTP');
  }

  const otp = generateOTP();
  user.emailVerificationToken = otp;
  user.emailVerificationExpires = new Date(Date.now() + 3 * 60 * 1000);
  await user.save();

  try {
    await sendOTPEmail(user, otp);
  } catch (err) {
    logger.error('Failed to resend OTP:', err);
  }

  return success(res, { message: 'If the email exists, a new OTP has been sent.' });
}

async function googleAuth(req, res) {
  const { code } = req.body;
  if (!code) return fail(res, 400, 'Authorization code is required');

  try {
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    if (!email) return fail(res, 400, 'Email not provided by Google');

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        user.profilePicture = picture;
        await user.save();
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
        passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
        googleId,
        authProvider: 'google',
        profilePicture: picture,
        verified: true,
      });
    }

    // Atomic tokenVersion increment to prevent race conditions
    user = await User.findOneAndUpdate(
      { _id: user._id },
      { $inc: { tokenVersion: 1 } },
      { new: true }
    ).select('_id username email role subscription elo usage apiKey tokenVersion');

    const tokenPayload = buildTokenPayload(user);
    const accessToken = signToken(tokenPayload);

    const refreshToken = signRefreshToken({ id: user._id.toString(), tokenVersion: user.tokenVersion });
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.json({ accessToken, user: tokenPayload });
  } catch (err) {
    logger.error('Google auth error:', err);
    if (err.message?.includes('invalid_grant')) return fail(res, 400, 'Invalid authorization code');
    return fail(res, 500, 'Google authentication failed');
  }
}

async function linkGoogleAccount(req, res) {
  const { code } = req.body;
  const userId = req.user.id;
  if (!code) return fail(res, 400, 'Authorization code is required');

  try {
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);
    const ticket = await googleClient.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GOOGLE_CLIENT_ID });
    const { sub: googleId, picture } = ticket.getPayload();

    const existingGoogleUser = await User.findOne({ googleId });
    if (existingGoogleUser && existingGoogleUser._id.toString() !== userId) {
      return fail(res, 400, 'This Google account is already linked to another PeerCode account');
    }

    const user = await User.findById(userId);
    if (!user) return fail(res, 404, 'User not found');

    user.googleId = googleId;
    user.authProvider = 'google';
    user.profilePicture = picture;
    user.verified = true;
    await user.save();

    return success(res, { message: 'Google account linked successfully' });
  } catch (err) {
    logger.error('Link Google account error:', err);
    return fail(res, 500, 'Failed to link Google account');
  }
}

async function unlinkGoogleAccount(req, res) {
  const userId = req.user.id;
  const user = await User.findById(userId);
  if (!user) return fail(res, 404, 'User not found');
  if (!user.googleId) return fail(res, 400, 'No Google account linked');
  if (user.authProvider === 'google' && !user.passwordHash) {
    return fail(res, 400, 'Cannot unlink Google account without a password. Please set a password first.');
  }

  user.googleId = undefined;
  user.authProvider = 'local';
  user.profilePicture = undefined;
  await user.save();

  return success(res, { message: 'Google account unlinked successfully' });
}

async function logout(req, res) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  res.status(200).json({ message: 'Logged out successfully' });
}

module.exports = { register, login, refresh, logout, verifyOTP, resendOTP, googleAuth, linkGoogleAccount, unlinkGoogleAccount };
