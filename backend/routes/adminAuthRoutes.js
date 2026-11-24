
const express = require('express');
const router = express.Router();

const adminAuthController = require('../controllers/adminAuthController');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');

// ==========================================
// PUBLIC ADMIN AUTH APIs
// ==========================================

// 1. Admin Login
router.post('/login', adminAuthController.login);

// 2. Admin Logout
router.post('/logout', adminAuthController.logout);

// 3. Send OTP
router.post('/send-otp', adminAuthController.sendOtp);

// 4. Verify OTP
router.post('/verify-otp', adminAuthController.verifyOtp);

// 5. Refresh Access Token
router.post('/refresh', adminAuthController.refreshToken);

// 6. Forgot Password
router.post('/forgot-password', adminAuthController.forgotPassword);

// 7. Reset Password
router.post('/reset-password', adminAuthController.resetPassword);


// ==========================================
// PROTECTED ADMIN AUTH APIs
// ==========================================

// 8. Change Password
router.post(
    '/change-password',
    adminAuthMiddleware,
    adminAuthController.changePassword
);

// 9. Admin Profile
router.get(
    '/profile',
    adminAuthMiddleware,
    adminAuthController.profile
);

module.exports = router;
