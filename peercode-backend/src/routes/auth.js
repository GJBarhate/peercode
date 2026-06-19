'use strict';

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { authLimiter, refreshLimiter, googleAuthLimiter } = require('../middleware/rateLimiter');
const { validate, schemas } = require('../middleware/validate');
const { register, login, refresh, logout, verifyOTP, resendOTP, googleAuth, linkGoogleAccount, unlinkGoogleAccount } = require('../controllers/authController');

router.post('/register', authLimiter, validate(schemas.register), register);
router.post('/login', authLimiter, validate(schemas.login), login);
router.post('/refresh', refreshLimiter, refresh);
router.post('/logout', logout);
router.post('/verify-otp', authLimiter, validate(schemas.verifyOTP), verifyOTP);
router.post('/resend-otp', authLimiter, validate(schemas.resendOTP), resendOTP);
router.post('/google', googleAuthLimiter, googleAuth);
router.post('/link-google', auth, authLimiter, linkGoogleAccount);
router.post('/unlink-google', auth, unlinkGoogleAccount);

module.exports = router;
