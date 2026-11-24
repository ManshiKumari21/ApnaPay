require('dotenv').config({ path: __dirname + '/../.env' });
const http = require('http');
const bcrypt = require('bcrypt');
const app = require('../app');
const db = require('../config/db');

let server;
const PORT = 5010;

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
                let json;
                try {
                    json = JSON.parse(body);
                } catch {
                    json = body;
                }
                resolve({ status: res.statusCode, data: json });
            });
        });
        req.on('error', reject);
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runTestSuite() {
    console.log('====================================================');
    console.log('   ApnaPay - Verification of All 17 Auth APIs       ');
    console.log('====================================================');

    server = app.listen(PORT);
    console.log(`Backend server running on port ${PORT}`);

    const timestamp = Date.now();
    const userEmail = `cust_${timestamp}@example.com`;
    const userPhone = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
    const userPassword = 'UserPassword123@';
    const userNewPassword = 'UserNewPassword456@';

    const adminEmail = `admin_${timestamp}@apnapay.com`;
    const adminPassword = 'AdminPassword123@';
    const adminNewPassword = 'AdminNewPassword456@';
    const adminResetPassword = 'AdminResetPassword789@';

    try {
        // =================================================================
        // SECTION 1: 8 USER AUTHENTICATION APIs
        // =================================================================
        console.log('\n--- TESTING 8 USER AUTHENTICATION APIs ---');

        // 1. User Send OTP
        console.log('[1/17] POST /api/v1/auth/send-otp');
        const resUserSendOtp = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/v1/auth/send-otp',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: userEmail });

        if (resUserSendOtp.status !== 200 || !resUserSendOtp.data.otp) {
            throw new Error(`User Send OTP failed: ${JSON.stringify(resUserSendOtp.data)}`);
        }
        const userOtp = resUserSendOtp.data.otp;
        console.log('  ✓ User Send OTP success. OTP:', userOtp);

        // 2. User Verify OTP
        console.log('[2/17] POST /api/v1/auth/verify-otp');
        const resUserVerifyOtp = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/v1/auth/verify-otp',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: userEmail, otp: userOtp });

        if (resUserVerifyOtp.status !== 200 || !resUserVerifyOtp.data.success) {
            throw new Error(`User Verify OTP failed: ${JSON.stringify(resUserVerifyOtp.data)}`);
        }
        console.log('  ✓ User Verify OTP success.');

        // 3. User Register
        console.log('[3/17] POST /api/v1/auth/register');
        const resUserRegister = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/v1/auth/register',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            full_name: 'Test Customer',
            phone: userPhone,
            email: userEmail,
            password: userPassword
        });

        if (resUserRegister.status !== 201 || !resUserRegister.data.user) {
            throw new Error(`User Register failed: ${JSON.stringify(resUserRegister.data)}`);
        }
        console.log('  ✓ User Register success. ID:', resUserRegister.data.user.id);

        // 4. User Login
        console.log('[4/17] POST /api/v1/auth/login');
        const resUserLogin = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/v1/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            identifier: userEmail,
            password: userPassword
        });

        if (resUserLogin.status !== 200 || !resUserLogin.data.refreshToken) {
            throw new Error(`User Login failed: ${JSON.stringify(resUserLogin.data)}`);
        }
        let userAccessToken = resUserLogin.data.token;
        let userRefreshToken = resUserLogin.data.refreshToken;
        console.log('  ✓ User Login success. Tokens received.');

        // 5. User Refresh Token
        console.log('[5/17] POST /api/v1/auth/refresh');
        const resUserRefresh = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/v1/auth/refresh',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { refreshToken: userRefreshToken });

        if (resUserRefresh.status !== 200 || !resUserRefresh.data.refreshToken) {
            throw new Error(`User Refresh failed: ${JSON.stringify(resUserRefresh.data)}`);
        }
        userAccessToken = resUserRefresh.data.token;
        userRefreshToken = resUserRefresh.data.refreshToken;
        console.log('  ✓ User Refresh Token success. Rotated tokens received.');

        // 6. User Logout
        console.log('[6/17] POST /api/v1/auth/logout');
        const resUserLogout = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/v1/auth/logout',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { refreshToken: userRefreshToken });

        if (resUserLogout.status !== 200 || !resUserLogout.data.success) {
            throw new Error(`User Logout failed: ${JSON.stringify(resUserLogout.data)}`);
        }
        console.log('  ✓ User Logout success.');

        // 7. User Forgot Password
        console.log('[7/17] POST /api/v1/auth/forgot-password');
        const resUserForgot = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/v1/auth/forgot-password',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: userEmail });

        if (resUserForgot.status !== 200 || !resUserForgot.data.resetToken) {
            throw new Error(`User Forgot Password failed: ${JSON.stringify(resUserForgot.data)}`);
        }
        const userResetToken = resUserForgot.data.resetToken;
        console.log('  ✓ User Forgot Password success. Reset token received.');

        // 8. User Reset Password
        console.log('[8/17] POST /api/v1/auth/reset-password');
        const resUserReset = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/v1/auth/reset-password',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            token: userResetToken,
            newPassword: userNewPassword
        });

        if (resUserReset.status !== 200 || !resUserReset.data.success) {
            throw new Error(`User Reset Password failed: ${JSON.stringify(resUserReset.data)}`);
        }
        console.log('  ✓ User Reset Password success.');


        // =================================================================
        // SECTION 2: 9 ADMIN AUTHENTICATION APIs
        // =================================================================
        console.log('\n--- TESTING 9 ADMIN AUTHENTICATION APIs ---');

        // Setup test admin in DB
        const adminPassHash = await bcrypt.hash(adminPassword, 12);
        const [adminInsert] = await db.execute(
            `INSERT INTO admins (full_name, email, password_hash, role, status, email_verified_at)
             VALUES (?, ?, ?, 'admin', 'active', NOW())`,
            ['Admin Tester', adminEmail, adminPassHash]
        );
        const adminId = adminInsert.insertId;
        console.log(`Created test admin account (ID: ${adminId}, Email: ${adminEmail})`);

        // 9. Admin Login
        console.log('[9/17] POST /api/v1/admin/auth/login');
        const resAdminLogin = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/v1/admin/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            email: adminEmail,
            password: adminPassword
        });

        if (resAdminLogin.status !== 200 || !resAdminLogin.data.data?.accessToken) {
            throw new Error(`Admin Login failed: ${JSON.stringify(resAdminLogin.data)}`);
        }
        let adminAccessToken = resAdminLogin.data.data.accessToken;
        let adminRefreshToken = resAdminLogin.data.data.refreshToken;
        console.log('  ✓ Admin Login success.');

        // 10. Admin Profile (GET)
        console.log('[10/17] GET /api/v1/admin/auth/profile');
        const resAdminProfile = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/v1/admin/auth/profile',
            method: 'GET',
            headers: {
                Authorization: `Bearer ${adminAccessToken}`
            }
        });

        if (resAdminProfile.status !== 200 || !resAdminProfile.data.data?.admin) {
            throw new Error(`Admin Profile failed: ${JSON.stringify(resAdminProfile.data)}`);
        }
        console.log('  ✓ Admin Profile success. Admin:', resAdminProfile.data.data.admin.email);

        // 11. Admin Refresh Token
        console.log('[11/17] POST /api/v1/admin/auth/refresh');
        const resAdminRefresh = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/v1/admin/auth/refresh',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { refreshToken: adminRefreshToken });

        if (resAdminRefresh.status !== 200 || !resAdminRefresh.data.data?.accessToken) {
            throw new Error(`Admin Refresh failed: ${JSON.stringify(resAdminRefresh.data)}`);
        }
        adminAccessToken = resAdminRefresh.data.data.accessToken;
        adminRefreshToken = resAdminRefresh.data.data.refreshToken;
        console.log('  ✓ Admin Refresh success.');

        // 12. Admin Change Password
        console.log('[12/17] POST /api/v1/admin/auth/change-password');
        const resAdminChangePass = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/v1/admin/auth/change-password',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${adminAccessToken}`
            }
        }, {
            currentPassword: adminPassword,
            newPassword: adminNewPassword
        });

        if (resAdminChangePass.status !== 200 || !resAdminChangePass.data.success) {
            throw new Error(`Admin Change Password failed: ${JSON.stringify(resAdminChangePass.data)}`);
        }
        console.log('  ✓ Admin Change Password success.');

        // Log in again with changed password
        const resReLogin = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/v1/admin/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            email: adminEmail,
            password: adminNewPassword
        });
        adminAccessToken = resReLogin.data.data.accessToken;
        adminRefreshToken = resReLogin.data.data.refreshToken;

        // 13. Admin Send OTP
        console.log('[13/17] POST /api/v1/admin/auth/send-otp');
        const resAdminSendOtp = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/v1/admin/auth/send-otp',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            email: adminEmail,
            purpose: 'login'
        });

        if (resAdminSendOtp.status !== 200 || !resAdminSendOtp.data.devOtp) {
            throw new Error(`Admin Send OTP failed: ${JSON.stringify(resAdminSendOtp.data)}`);
        }
        const adminOtp = resAdminSendOtp.data.devOtp;
        console.log('  ✓ Admin Send OTP success. Dev OTP:', adminOtp);

        // 14. Admin Verify OTP
        console.log('[14/17] POST /api/v1/admin/auth/verify-otp');
        const resAdminVerifyOtp = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/v1/admin/auth/verify-otp',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            email: adminEmail,
            otp: adminOtp,
            purpose: 'login'
        });

        if (resAdminVerifyOtp.status !== 200 || !resAdminVerifyOtp.data.success) {
            throw new Error(`Admin Verify OTP failed: ${JSON.stringify(resAdminVerifyOtp.data)}`);
        }
        console.log('  ✓ Admin Verify OTP success.');

        // 15. Admin Forgot Password
        console.log('[15/17] POST /api/v1/admin/auth/forgot-password');
        const resAdminForgot = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/v1/admin/auth/forgot-password',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: adminEmail });

        if (resAdminForgot.status !== 200 || !resAdminForgot.data.resetToken) {
            throw new Error(`Admin Forgot Password failed: ${JSON.stringify(resAdminForgot.data)}`);
        }
        const adminResetToken = resAdminForgot.data.resetToken;
        console.log('  ✓ Admin Forgot Password success. Reset token received.');

        // 16. Admin Reset Password
        console.log('[16/17] POST /api/v1/admin/auth/reset-password');
        const resAdminReset = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/v1/admin/auth/reset-password',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            token: adminResetToken,
            newPassword: adminResetPassword
        });

        if (resAdminReset.status !== 200 || !resAdminReset.data.success) {
            throw new Error(`Admin Reset Password failed: ${JSON.stringify(resAdminReset.data)}`);
        }
        console.log('  ✓ Admin Reset Password success.');

        // 17. Admin Logout
        console.log('[17/17] POST /api/v1/admin/auth/logout');
        const resAdminLogout = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/v1/admin/auth/logout',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { refreshToken: adminRefreshToken });

        if (resAdminLogout.status !== 200 || !resAdminLogout.data.success) {
            throw new Error(`Admin Logout failed: ${JSON.stringify(resAdminLogout.data)}`);
        }
        console.log('  ✓ Admin Logout success.');


        // =================================================================
        // SECTION 3: ROLE & AUTHENTICATION SEPARATION VERIFICATION
        // =================================================================
        console.log('\n--- TESTING USER / ADMIN AUTHENTICATION SEPARATION ---');

        // Customer token attempting Admin Protected Route -> Must be 401
        console.log('[TEST] Customer token accessing /api/v1/admin/auth/profile');
        const resCrossCheck1 = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/v1/admin/auth/profile',
            method: 'GET',
            headers: { Authorization: `Bearer ${userAccessToken}` }
        });

        if (resCrossCheck1.status !== 401) {
            throw new Error(`Security breach: Customer token accessed Admin profile with status ${resCrossCheck1.status}`);
        }
        console.log('  ✓ Customer token blocked from Admin route (401 Unauthorized)');

        console.log('\n====================================================');
        console.log('ALL 17 AUTHENTICATION APIS PASSED VERIFICATION 100%!');
        console.log('User and Admin Separation Verified Successfully!');
        console.log('====================================================');

    } catch (err) {
        console.error('\nFAILED VERIFICATION:', err.message);
        process.exitCode = 1;
    } finally {
        if (server) server.close();
        await db.end();
    }
}

runTestSuite();

