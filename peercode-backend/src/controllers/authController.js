'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { signToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwtUtils');
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const { fail, ok: success } = require('../utils/httpResponse');
const logger = require('../utils/logger');

let mailTransporter;
let useSendGrid = false;
try {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

  if (!smtpHost || !smtpUser || !smtpPass) {
    logger.warn(`SMTP not configured — OTP emails disabled. Missing: ${[!smtpHost && 'SMTP_HOST', !smtpUser && 'SMTP_USER', !smtpPass && 'SMTP_PASS'].filter(Boolean).join(', ')}`);
  } else if (smtpHost === 'smtp.sendgrid.net') {
    // Use SendGrid Web API (HTTPS port 443 — never blocked by cloud providers)
    sgMail.setApiKey(smtpPass);
    useSendGrid = true;
    logger.info(`SendGrid API configured for email sending`);
  } else {
    mailTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
    mailTransporter.verify()
      .then(() => logger.info(`SMTP connected: ${smtpHost}:${smtpPort} as ${smtpUser}`))
      .catch((err) => logger.error(`SMTP verification failed (${smtpHost}:${smtpPort}): ${err.message}. For Gmail, use an App Password from https://myaccount.google.com/apppasswords`));
  }
} catch (err) {
  logger.error('Failed to create mail transporter:', err);
}

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
  logger.info(`[OTP] Verification code for ${user.email}: ${otp}`);
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@peercode.app';
  
  if (useSendGrid) {
    try {
      await sgMail.send({
        to: user.email,
        from: fromEmail,
        subject: 'Your PeerCode Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f0f23; border-radius: 12px; color: #e2e8f0;">
            <h2 style="color: #818cf8; margin: 0 0 16px;">PeerCode Verification</h2>
            <p style="margin: 0 0 24px; color: #94a3b8;">Hi ${user.username},</p>
            <div style="text-align: center; padding: 24px; background: #1e1e3f; border-radius: 8px; margin: 0 0 24px;">
              <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #818cf8;">${otp}</span>
            </div>
            <p style="margin: 0 0 8px; color: #94a3b8; font-size: 14px;">This code expires in 3 minutes.</p>
            <p style="margin: 0; color: #64748b; font-size: 12px;">If you didn't request this code, you can safely ignore this email.</p>
          </div>
        `,
      });
      logger.info(`OTP email sent to ${user.email} via SendGrid`);
    } catch (err) {
      logger.error(`Failed to send OTP via SendGrid to ${user.email}: ${err.message}`);
      if (err.response?.body) logger.error('SendGrid response:', JSON.stringify(err.response.body));
    }
    return;
  }

  if (!mailTransporter) {
    logger.error('SMTP not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS in .env');
    return;
  }
  try {
    await mailTransporter.sendMail({
      from: `"PeerCode" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Your PeerCode Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f0f23; border-radius: 12px; color: #e2e8f0;">
          <h2 style="color: #818cf8; margin: 0 0 16px;">PeerCode Verification</h2>
          <p style="margin: 0 0 24px; color: #94a3b8;">Hi ${user.username},</p>
          <div style="text-align: center; padding: 24px; background: #1e1e3f; border-radius: 8px; margin: 0 0 24px;">
            <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #818cf8;">${otp}</span>
          </div>
          <p style="margin: 0 0 8px; color: #94a3b8; font-size: 14px;">This code expires in 3 minutes.</p>
          <p style="margin: 0; color: #64748b; font-size: 12px;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
      `,
    });
    logger.info(`OTP email sent to ${user.email}`);
  } catch (err) {
    logger.error(`Failed to send OTP to ${user.email}: ${err.message}`);
  }
}

async function register(req, res) {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return fail(res, 400, 'username, email and password are required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 400, 'Invalid email address');
  if (password.length < 8) return fail(res, 400, 'Password must be at least 8 characters');

  // In development, always allow registration (delete existing user if any)
  const normalizedEmail = email.toLowerCase().trim();

  // Check for existing user
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (process.env.NODE_ENV === 'development') {
    // Dev: always allow fresh registration
    if (existingUser) await User.deleteOne({ email: normalizedEmail });
  } else {
    // Production: block re-registration of verified users
    if (existingUser && existingUser.verified) {
      return fail(res, 409, 'Email already registered');
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

  let user;
  if (existingUser && !existingUser.verified) {
    // Update existing unverified user instead of crashing on duplicate
    existingUser.username = username;
    existingUser.passwordHash = passwordHash;
    existingUser.emailVerificationToken = otp;
    existingUser.emailVerificationExpires = otpExpires;
    user = await existingUser.save();
  } else {
    user = await User.create({
      username,
      email: normalizedEmail,
      passwordHash,
      verified: false,
      emailVerificationToken: otp,
      emailVerificationExpires: otpExpires,
    });
  }

  let emailFailed = false;
  try {
    await sendOTPEmail(user, otp);
  } catch (err) {
    emailFailed = true;
    logger.error('Failed to send OTP email:', err);
  }

  const response = {
    message: 'Registration successful. Please check your email for the verification code.',
    requiresVerification: true,
  };
  if (emailFailed) {
    response.fallbackOtp = otp;
    response.message = 'Email service unavailable. Use the fallback code below to verify.';
  }
  res.status(201).json(response);
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

  // Block unverified accounts — resend OTP so they can verify
  if (!user.verified) {
    const otp = generateOTP();
    user.emailVerificationToken = otp;
    user.emailVerificationExpires = new Date(Date.now() + 3 * 60 * 1000);
    await user.save();
    try {
      await sendOTPEmail(user, otp);
    } catch (err) {
      logger.error('Failed to send OTP during login:', err);
    }
    return res.status(403).json({
      error: 'Account not verified. A new verification code has been sent to your email.',
      requiresVerification: true,
      email: user.email,
      fallbackOtp: otp,
    });
  }

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
    return fail(res, 500, 'Failed to send verification email. Please try again or contact support.');
  }

  return success(res, { message: 'A new verification code has been sent to your email.' });
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
