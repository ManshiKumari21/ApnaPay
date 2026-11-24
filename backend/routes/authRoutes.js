
const express = require('express');
const router = express.Router();

const {
    register,
    login,
    loginLookupPhone,
    loginSendOtp,
    loginVerifyOtp,
    refreshToken,
    logout,
    forgotPassword,
    resetPassword,
    sendOtp,
    verifyOtp
} = require('../controllers/authController');

// Register API
router.post('/register', register);

// Login APIs
router.post('/login', login);
router.post('/login/lookup-phone', loginLookupPhone);
router.post('/login/initiate', loginLookupPhone);
router.post('/login/send-otp', loginSendOtp);
router.post('/login/verify-otp', loginVerifyOtp);

// Refresh Token API
router.post('/refresh', refreshToken);

// Logout API
router.post('/logout', logout);

// Forgot Password API
router.post('/forgot-password', forgotPassword);

// Reset Password API
router.post('/reset-password', resetPassword);

// Send Email OTP API
router.post('/send-otp', sendOtp);

// Verify Email OTP API
router.post('/verify-otp', verifyOtp);

module.exports = router;
