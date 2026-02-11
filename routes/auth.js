const express = require('express');
const router = express.Router();
const {
    register,
    login,
    requestOTP,
    verifyOTPAndChangePassword,
} = require('../controllers/authController');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', login);

// @route   POST /api/auth/request-otp
// @desc    Request OTP for password change
// @access  Public
router.post('/request-otp', requestOTP);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and change password
// @access  Public
router.post('/verify-otp', verifyOTPAndChangePassword);

module.exports = router;
