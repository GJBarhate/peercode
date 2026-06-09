'use strict';

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { register, login, refresh, logout, verifyEmail, resendVerificationEmail, googleAuth, linkGoogleAccount, unlinkGoogleAccount } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/google', googleAuth);
router.post('/link-google', auth, linkGoogleAccount);
router.post('/unlink-google', auth, unlinkGoogleAccount);

module.exports = router;
