'use strict';

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { authLimiter, refreshLimiter, googleAuthLimiter } = require('../middleware/rateLimiter');
const { register, login, refresh, logout, verifyOTP, resendOTP, googleAuth, linkGoogleAccount, unlinkGoogleAccount } = require('../controllers/authController');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshLimiter, refresh);
router.post('/logout', logout);
router.post('/verify-otp', authLimiter, verifyOTP);
router.post('/resend-otp', authLimiter, resendOTP);
router.post('/google', googleAuthLimiter, googleAuth);
router.post('/link-google', auth, authLimiter, linkGoogleAccount);
router.post('/unlink-google', auth, unlinkGoogleAccount);

module.exports = router;
