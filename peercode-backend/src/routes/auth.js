'use strict';

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { register, login, refresh, logout, verifyOTP, resendOTP, googleAuth, linkGoogleAccount, unlinkGoogleAccount } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/google', googleAuth);
router.post('/link-google', auth, linkGoogleAccount);
router.post('/unlink-google', auth, unlinkGoogleAccount);

module.exports = router;
