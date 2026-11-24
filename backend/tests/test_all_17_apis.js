const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const http = require('http');
const db = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const app = require('../app');

const PORT = 5002;

function apiRequest(method, endpoint, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const options = {
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/v1' + endpoint,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch (_) {
                    parsed = data;
                }
                resolve({ status: res.statusCode, data: parsed });
            });
        });

        req.on('error', (err) => reject(err));
        if (payload) req.write(payload);
        req.end();
    });
}

async function runAll17ApiTests() {
    console.log('========================================================');
    console.log('RUNNING FULL TEST SUITE FOR ALL 17 APNAPAY AUTH APIs');
    console.log('========================================================\n');

    const server = await new Promise((resolve) => {
        const s = app.listen(PORT, '127.0.0.1', () => {
            console.log(`Test server running on port ${PORT}\n`);
            resolve(s);
        });
    });

    let passed = 0;
    let failed = 0;

    function assert(cond, name) {
        if (cond) {
            console.log(`  [PASS] ${name}`);
            passed++;
        } else {
            console.error(`  [FAIL] ${name}`);
            failed++;
        }
    }

    let customerId = null;
    let adminId = null;
    const timestamp = Date.now();
    const custEmail = `cust_test_${timestamp}@apnapay.com`;
    const custPhone = '98' + Math.floor(10000000 + Math.random() * 90000000);
    const custPass = 'UserPassSecure123!';
    const custNewPass = 'UserNewPassSecure456!';

    const adminEmail = `admin_test_${timestamp}@apnapay.com`;
    const adminPass = 'AdminPassSecure123!';
    const adminNewPass = 'AdminNewPassSecure456!';

    try {
        // ========================================================
        // PART 1: CUSTOMER AUTHENTICATION (8 APIs)
        // ========================================================
        console.log('=== PART 1: CUSTOMER AUTHENTICATION APIs ===');

        // 1. POST /auth/send-otp (registration)
        console.log('\n1. Testing POST /auth/send-otp (Customer)');
        const sendOtpRes = await apiRequest('POST', '/auth/send-otp', {
            email: custEmail,
            phone: custPhone,
            purpose: 'email_verification'
        });
        assert(sendOtpRes.status === 200, 'POST /auth/send-otp returns 200');
        assert(sendOtpRes.data.success === true, 'send-otp success is true');

        // Query the generated OTP record from DB
        const [otpRecords] = await db.execute(
            `SELECT id, otp_hash FROM otp_verifications WHERE email = ? AND purpose = 'email_verification' ORDER BY id DESC LIMIT 1`,
            [custEmail]
        );
        assert(otpRecords.length === 1, 'OTP record saved in otp_verifications table');
        const knownOtp = '582910';
        const knownOtpHash = await bcrypt.hash(knownOtp, 10);
        await db.execute('UPDATE otp_verifications SET otp_hash = ? WHERE id = ?', [knownOtpHash, otpRecords[0].id]);

        // 2. POST /auth/verify-otp (verify email)
        console.log('\n2. Testing POST /auth/verify-otp (Customer)');
        const verifyOtpRes = await apiRequest('POST', '/auth/verify-otp', {
            email: custEmail,
            otp: knownOtp,
            purpose: 'email_verification'
        });
        assert(verifyOtpRes.status === 200, 'POST /auth/verify-otp returns 200');
        assert(verifyOtpRes.data.success === true, 'verify-otp success is true');

        // 3. POST /auth/register (create account)
        console.log('\n3. Testing POST /auth/register (Customer)');
        const registerRes = await apiRequest('POST', '/auth/register', {
            full_name: 'Test Customer Full',
            email: custEmail,
            phone: custPhone,
            password: custPass
        });
        assert(registerRes.status === 201, 'POST /auth/register returns 201 Created');
        assert(registerRes.data.user && registerRes.data.user.id, 'User created with valid ID');
        customerId = registerRes.data.user.id;

        // 4. POST /auth/login (login customer)
        console.log('\n4. Testing POST /auth/login (Customer)');
        const loginRes = await apiRequest('POST', '/auth/login', {
            identifier: custEmail,
            password: custPass
        });
        assert(loginRes.status === 200, 'POST /auth/login returns 200');
        assert(loginRes.data.accessToken && loginRes.data.refreshToken, 'Returns accessToken and refreshToken');
        const custAccessToken = loginRes.data.accessToken;
        let custRefreshToken = loginRes.data.refreshToken;

        // Test login with phone number as identifier
        const loginPhoneRes = await apiRequest('POST', '/auth/login', {
            identifier: custPhone,
            password: custPass
        });
        assert(loginPhoneRes.status === 200, 'POST /auth/login succeeds using Phone Number');

        // 5. POST /auth/refresh (refresh token)
        console.log('\n5. Testing POST /auth/refresh (Customer)');
        const refreshRes = await apiRequest('POST', '/auth/refresh', {
            refreshToken: custRefreshToken
        });
        assert(refreshRes.status === 200, 'POST /auth/refresh returns 200');
        assert(refreshRes.data.accessToken && refreshRes.data.refreshToken, 'Rotated new accessToken and refreshToken');
        custRefreshToken = refreshRes.data.refreshToken;

        // 6. POST /auth/logout (logout)
        console.log('\n6. Testing POST /auth/logout (Customer)');
        const logoutRes = await apiRequest('POST', '/auth/logout', {
            refreshToken: custRefreshToken
        });
        assert(logoutRes.status === 200, 'POST /auth/logout returns 200');

        // 7. POST /auth/forgot-password (request reset OTP)
        console.log('\n7. Testing POST /auth/forgot-password (Customer)');
        const forgotRes = await apiRequest('POST', '/auth/forgot-password', {
            email: custEmail
        });
        assert(forgotRes.status === 200, 'POST /auth/forgot-password returns 200');
        assert(forgotRes.data.message === 'If an account exists, a 6-digit OTP has been sent to your registered email address.', 'Returns secure generic message');
        assert(forgotRes.data.otp === undefined && forgotRes.data.resetToken === undefined, 'Does NOT leak OTP or token in response');

        // Set test OTP for password reset
        const [resetOtpRecs] = await db.execute(
            `SELECT id FROM otp_verifications WHERE email = ? AND purpose = 'password_reset' ORDER BY id DESC LIMIT 1`,
            [custEmail]
        );
        const resetOtpKnown = '918273';
        const resetOtpKnownHash = await bcrypt.hash(resetOtpKnown, 10);
        await db.execute('UPDATE otp_verifications SET otp_hash = ? WHERE id = ?', [resetOtpKnownHash, resetOtpRecs[0].id]);

        const verifyResetOtpRes = await apiRequest('POST', '/auth/verify-otp', {
            email: custEmail,
            otp: resetOtpKnown,
            purpose: 'password_reset'
        });
        const resetAuthToken = verifyResetOtpRes.data.resetAuthorizationToken || verifyResetOtpRes.data.resetToken;
        assert(typeof resetAuthToken === 'string' && resetAuthToken.length === 64, 'Obtained 64-character reset authorization token');

        // 8. POST /auth/reset-password (update password)
        console.log('\n8. Testing POST /auth/reset-password (Customer)');
        const resetPassRes = await apiRequest('POST', '/auth/reset-password', {
            token: resetAuthToken,
            newPassword: custNewPass
        });
        assert(resetPassRes.status === 200, 'POST /auth/reset-password returns 200');
        assert(resetPassRes.data.message === 'Password reset successfully. Please login with your new password.', 'Returns confirmation message');

        // Verify login works with new password
        const postResetLogin = await apiRequest('POST', '/auth/login', {
            identifier: custEmail,
            password: custNewPass
        });
        assert(postResetLogin.status === 200, 'Login succeeds with NEW customer password');

        // ========================================================
        // PART 2: ADMIN AUTHENTICATION (9 APIs)
        // ========================================================
        console.log('\n=== PART 2: ADMIN AUTHENTICATION APIs ===');

        // Create initial test admin in DB
        const initialAdminHash = await bcrypt.hash(adminPass, 12);
        const [admInsert] = await db.execute(
            `INSERT INTO admins (full_name, email, password_hash, role, status, email_verified_at)
             VALUES ('System Admin Test', ?, ?, 'superadmin', 'active', NOW())`,
            [adminEmail, initialAdminHash]
        );
        adminId = admInsert.insertId;

        // 1. POST /admin/auth/login (Admin login)
        console.log('\n9. Testing POST /admin/auth/login (Admin)');
        const adminLoginRes = await apiRequest('POST', '/admin/auth/login', {
            email: adminEmail,
            password: adminPass
        });
        assert(adminLoginRes.status === 200, 'POST /admin/auth/login returns 200');
        assert(adminLoginRes.data.data?.accessToken, 'Returns admin accessToken');
        let adminAccessToken = adminLoginRes.data.data.accessToken;
        let adminRefreshToken = adminLoginRes.data.data.refreshToken;

        // 2. GET /admin/auth/profile (Admin profile - Protected)
        console.log('\n10. Testing GET /admin/auth/profile (Admin)');
        const profileRes = await apiRequest('GET', '/admin/auth/profile', null, {
            'Authorization': `Bearer ${adminAccessToken}`
        });
        assert(profileRes.status === 200, 'GET /admin/auth/profile returns 200');
        assert(profileRes.data.data?.admin?.email === adminEmail, 'Profile contains correct admin email');

        // 3. POST /admin/auth/change-password (Admin change password - Protected)
        console.log('\n11. Testing POST /admin/auth/change-password (Admin)');
        const changePassRes = await apiRequest('POST', '/admin/auth/change-password', {
            currentPassword: adminPass,
            newPassword: adminNewPass
        }, {
            'Authorization': `Bearer ${adminAccessToken}`
        });
        assert(changePassRes.status === 200, 'POST /admin/auth/change-password returns 200');

        // Re-login with new password to get fresh tokens
        const adminRelogin = await apiRequest('POST', '/admin/auth/login', {
            email: adminEmail,
            password: adminNewPass
        });
        assert(adminRelogin.status === 200, 'Admin login with CHANGED password returns 200');
        adminAccessToken = adminRelogin.data.data.accessToken;
        adminRefreshToken = adminRelogin.data.data.refreshToken;

        // 4. POST /admin/auth/refresh (Admin token refresh)
        console.log('\n12. Testing POST /admin/auth/refresh (Admin)');
        const adminRefreshRes = await apiRequest('POST', '/admin/auth/refresh', {
            refreshToken: adminRefreshToken
        });
        assert(adminRefreshRes.status === 200, 'POST /admin/auth/refresh returns 200');
        assert(adminRefreshRes.data.data?.accessToken, 'Rotated admin accessToken');
        adminRefreshToken = adminRefreshRes.data.data.refreshToken;

        // 5. POST /admin/auth/logout (Admin logout)
        console.log('\n13. Testing POST /admin/auth/logout (Admin)');
        const adminLogoutRes = await apiRequest('POST', '/admin/auth/logout', {
            refreshToken: adminRefreshToken
        });
        assert(adminLogoutRes.status === 200, 'POST /admin/auth/logout returns 200');

        // 6. POST /admin/auth/send-otp (Send admin OTP)
        console.log('\n14. Testing POST /admin/auth/send-otp (Admin)');
        const adminSendOtpRes = await apiRequest('POST', '/admin/auth/send-otp', {
            email: adminEmail,
            purpose: 'login'
        });
        assert(adminSendOtpRes.status === 200, 'POST /admin/auth/send-otp returns 200');

        const [adminOtpRecs] = await db.execute(
            `SELECT id FROM admin_otp_verifications WHERE email = ? AND purpose = 'login' ORDER BY id DESC LIMIT 1`,
            [adminEmail]
        );
        const knownAdminLoginOtp = '628491';
        const knownAdminLoginOtpHash = await bcrypt.hash(knownAdminLoginOtp, 12);
        await db.execute('UPDATE admin_otp_verifications SET otp_hash = ? WHERE id = ?', [knownAdminLoginOtpHash, adminOtpRecs[0].id]);

        // 7. POST /admin/auth/verify-otp (Verify admin OTP)
        console.log('\n15. Testing POST /admin/auth/verify-otp (Admin)');
        const adminVerifyOtpRes = await apiRequest('POST', '/admin/auth/verify-otp', {
            email: adminEmail,
            otp: knownAdminLoginOtp,
            purpose: 'login'
        });
        assert(adminVerifyOtpRes.status === 200, 'POST /admin/auth/verify-otp returns 200');

        // 8. POST /admin/auth/forgot-password (Admin forgot password)
        console.log('\n16. Testing POST /admin/auth/forgot-password (Admin)');
        const adminForgotRes = await apiRequest('POST', '/admin/auth/forgot-password', {
            email: adminEmail
        });
        assert(adminForgotRes.status === 200, 'POST /admin/auth/forgot-password returns 200');
        assert(adminForgotRes.data.message === 'If an account exists, a 6-digit OTP has been sent to your registered email address.', 'Admin forgot-password returns generic message');

        const [admResetRecs] = await db.execute(
            `SELECT id FROM admin_otp_verifications WHERE email = ? AND purpose = 'password_reset' ORDER BY id DESC LIMIT 1`,
            [adminEmail]
        );
        const knownAdmResetOtp = '739502';
        const knownAdmResetOtpHash = await bcrypt.hash(knownAdmResetOtp, 12);
        await db.execute('UPDATE admin_otp_verifications SET otp_hash = ? WHERE id = ?', [knownAdmResetOtpHash, admResetRecs[0].id]);

        const admVerifyResetOtpRes = await apiRequest('POST', '/admin/auth/verify-otp', {
            email: adminEmail,
            otp: knownAdmResetOtp,
            purpose: 'password_reset'
        });
        const admResetAuthToken = admVerifyResetOtpRes.data.resetAuthorizationToken || admVerifyResetOtpRes.data.resetToken;
        assert(typeof admResetAuthToken === 'string' && admResetAuthToken.length === 64, 'Obtained admin reset authorization token');

        // 9. POST /admin/auth/reset-password (Admin reset password)
        console.log('\n17. Testing POST /admin/auth/reset-password (Admin)');
        const finalAdminPass = 'AdminFinalSecure789!';
        const admResetPassRes = await apiRequest('POST', '/admin/auth/reset-password', {
            token: admResetAuthToken,
            newPassword: finalAdminPass
        });
        assert(admResetPassRes.status === 200, 'POST /admin/auth/reset-password returns 200');

        // Verify admin login works with final password
        const finalAdminLogin = await apiRequest('POST', '/admin/auth/login', {
            email: adminEmail,
            password: finalAdminPass
        });
        assert(finalAdminLogin.status === 200, 'Admin login succeeds with reset password');

        // ========================================================
        // CLEANUP
        // ========================================================
        if (customerId) {
            await db.execute('DELETE FROM otp_verifications WHERE user_id = ? OR email = ?', [customerId, custEmail]);
            await db.execute('DELETE FROM password_resets WHERE user_id = ?', [customerId]);
            await db.execute('DELETE FROM sessions WHERE user_id = ?', [customerId]);
            await db.execute('DELETE FROM wallets WHERE user_id = ?', [customerId]);
            await db.execute('DELETE FROM users WHERE id = ?', [customerId]);
        }
        if (adminId) {
            await db.execute('DELETE FROM admin_otp_verifications WHERE admin_id = ? OR email = ?', [adminId, adminEmail]);
            await db.execute('DELETE FROM admin_password_resets WHERE admin_id = ?', [adminId]);
            await db.execute('DELETE FROM admin_sessions WHERE admin_id = ?', [adminId]);
            await db.execute('DELETE FROM admins WHERE id = ?', [adminId]);
        }

    } catch (err) {
        console.error('Fatal test error:', err);
        failed++;
    }

    console.log('\n========================================================');
    console.log(`ALL 17 APIs TEST RESULT: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================');

    server.close();
    process.exit(failed > 0 ? 1 : 0);
}

runAll17ApiTests();

