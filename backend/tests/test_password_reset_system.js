const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const http = require('http');
const db = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const app = require('../app');

const PORT = 5001;

function apiRequest(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const options = {
            hostname: '127.0.0.1',
            port: PORT,
            path: '/api/v1' + path,
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

async function runTests() {
    const server = await new Promise((resolve) => {
        const s = app.listen(PORT, '127.0.0.1', () => {
            console.log(`Test server listening on port ${PORT}`);
            resolve(s);
        });
    });

    console.log('========================================================');
    console.log('STARTING SECURE EMAIL OTP PASSWORD RESET VERIFICATION');
    console.log('========================================================\n');

    let passed = 0;
    let failed = 0;

    function assert(condition, testName) {
        if (condition) {
            console.log(`  [PASS] ${testName}`);
            passed++;
        } else {
            console.error(`  [FAIL] ${testName}`);
            failed++;
        }
    }

    try {
        // ----------------------------------------------------
        // SETUP: Test Customer & Test Admin
        // ----------------------------------------------------
        const testUserEmail = 'test_cust_' + Date.now() + '@apnapay.com';
        const testUserPhone = '98' + Math.floor(10000000 + Math.random() * 90000000);
        const originalUserPass = 'CustInitialPass123!';
        const newUserPass = 'CustUpdatedPass456!';
        const initialUserHash = await bcrypt.hash(originalUserPass, 10);

        const [custRes] = await db.execute(
            `INSERT INTO users (full_name, email, phone, password_hash, status, email_verified_at)
             VALUES ('Test Customer', ?, ?, ?, 'active', NOW())`,
            [testUserEmail, testUserPhone, initialUserHash]
        );
        const testUserId = custRes.insertId;

        const testAdminEmail = 'test_admin_' + Date.now() + '@apnapay.com';
        const originalAdminPass = 'AdminInitialPass123!';
        const newAdminPass = 'AdminUpdatedPass456!';
        const initialAdminHash = await bcrypt.hash(originalAdminPass, 12);

        const [adminRes] = await db.execute(
            `INSERT INTO admins (full_name, email, password_hash, role, status, email_verified_at)
             VALUES ('Test Admin', ?, ?, 'superadmin', 'active', NOW())`,
            [testAdminEmail, initialAdminHash]
        );
        const testAdminId = adminRes.insertId;

        console.log(`Test Customer Created: ID ${testUserId}, Email: ${testUserEmail}`);
        console.log(`Test Admin Created:    ID ${testAdminId}, Email: ${testAdminEmail}\n`);

        // ----------------------------------------------------
        // 1. CUSTOMER: FORGOT PASSWORD REQUEST
        // ----------------------------------------------------
        console.log('--- 1. Testing Customer Forgot Password ---');
        
        // 1.1 Non-existent user enumeration protection
        const nonExistentRes = await apiRequest('POST', '/auth/forgot-password', { email: 'nonexistent_ghost@apnapay.com' });
        assert(nonExistentRes.status === 200, 'Non-existent email returns status 200');
        assert(nonExistentRes.data.message === 'If an account exists, a 6-digit OTP has been sent to your registered email address.', 'Generic non-leaking message returned for non-existent email');

        // 1.2 Registered user forgot password
        const custForgotRes = await apiRequest('POST', '/auth/forgot-password', { email: testUserEmail });
        assert(custForgotRes.status === 200, 'Registered customer returns status 200');
        assert(custForgotRes.data.message === 'If an account exists, a 6-digit OTP has been sent to your registered email address.', 'Correct generic message returned for customer');
        assert(custForgotRes.data.otp === undefined, 'Strict Security: OTP is NOT returned in API response');
        assert(custForgotRes.data.devOtp === undefined, 'Strict Security: devOtp is NOT returned in API response');
        assert(custForgotRes.data.resetToken === undefined, 'Strict Security: resetToken is NOT returned in API response');
        assert(custForgotRes.data.resetUrl === undefined, 'Strict Security: resetUrl is NOT returned in API response');

        // 1.3 Cooldown enforcement (< 60 seconds)
        const cooldownRes = await apiRequest('POST', '/auth/forgot-password', { email: testUserEmail });
        assert(cooldownRes.status === 429, 'Immediate second forgot password request blocked with 429 Cooldown');

        // Check database storage
        const [custOtps] = await db.execute(
            `SELECT id, otp_hash, purpose, attempts, verified_at, expires_at
             FROM otp_verifications
             WHERE email = ? AND purpose = 'password_reset'
             ORDER BY id DESC LIMIT 1`,
            [testUserEmail]
        );
        assert(custOtps.length === 1, 'OTP record saved in otp_verifications');
        const custOtpRecord = custOtps[0];
        assert(custOtpRecord.otp_hash.startsWith('$2'), 'OTP is stored as a secure bcrypt hash, not plain text');
        assert(custOtpRecord.verified_at === null, 'verified_at is initially NULL');

        // To test OTP verification without intercepting real email inbox, we find the 6-digit matching OTP from the hash
        let matchedCustomerOtp = null;
        for (let num = 100000; num <= 999999; num++) {
            const str = num.toString();
            // Test quickly or test using a known candidate
            // Since bcrypt is slow (100000 would take minutes), we can directly verify bcrypt compare with a test OTP
            // Or generate a known OTP hash for testing
            break;
        }

        // Let's create an OTP with a known value for precise verification test
        const knownOtp = '739201';
        const knownOtpHash = await bcrypt.hash(knownOtp, 10);
        await db.execute(
            `UPDATE otp_verifications SET otp_hash = ? WHERE id = ?`,
            [knownOtpHash, custOtpRecord.id]
        );

        // ----------------------------------------------------
        // 2. CUSTOMER: VERIFY OTP
        // ----------------------------------------------------
        console.log('\n--- 2. Testing Customer Verify OTP ---');

        // 2.1 Incorrect OTP
        const wrongOtpRes = await apiRequest('POST', '/auth/verify-otp', {
            email: testUserEmail,
            otp: '000000',
            purpose: 'password_reset'
        });
        assert(wrongOtpRes.status === 400, 'Incorrect OTP returns status 400');
        const [attemptCheck] = await db.execute(`SELECT attempts FROM otp_verifications WHERE id = ?`, [custOtpRecord.id]);
        assert(attemptCheck[0].attempts === 1, 'Failed attempt incremented attempts counter in DB');

        // 2.2 Correct OTP
        const correctOtpRes = await apiRequest('POST', '/auth/verify-otp', {
            email: testUserEmail,
            otp: knownOtp,
            purpose: 'password_reset'
        });
        assert(correctOtpRes.status === 200, 'Correct OTP verification returns status 200');
        const customerAuthToken = correctOtpRes.data.resetAuthorizationToken || correctOtpRes.data.resetToken;
        assert(typeof customerAuthToken === 'string' && customerAuthToken.length === 64, 'Returned valid single-use resetAuthorizationToken (64 hex chars)');

        // Check verified_at
        const [verifiedCheck] = await db.execute(`SELECT verified_at FROM otp_verifications WHERE id = ?`, [custOtpRecord.id]);
        assert(verifiedCheck[0].verified_at !== null, 'verified_at is timestamped in DB');

        // ----------------------------------------------------
        // 3. CUSTOMER: RESET PASSWORD
        // ----------------------------------------------------
        console.log('\n--- 3. Testing Customer Reset Password ---');

        // 3.1 Short password rejected
        const shortPassRes = await apiRequest('POST', '/auth/reset-password', {
            token: customerAuthToken,
            newPassword: 'short'
        });
        assert(shortPassRes.status === 400, 'Password < 8 characters rejected with 400');

        // 3.2 Invalid token rejected
        const invalidTokenRes = await apiRequest('POST', '/auth/reset-password', {
            token: 'deadbeef1234567890abcdefdeadbeef1234567890abcdefdeadbeef12345678',
            newPassword: newUserPass
        });
        assert(invalidTokenRes.status === 400, 'Invalid reset token rejected with 400');

        // 3.3 Valid password reset
        const validResetRes = await apiRequest('POST', '/auth/reset-password', {
            token: customerAuthToken,
            newPassword: newUserPass
        });
        assert(validResetRes.status === 200, 'Valid resetPassword returns 200');
        assert(validResetRes.data.message === 'Password reset successfully. Please login with your new password.', 'Correct customer reset confirmation message');

        // 3.4 Token reuse prevention (single-use)
        const reuseTokenRes = await apiRequest('POST', '/auth/reset-password', {
            token: customerAuthToken,
            newPassword: 'AnotherPassword999!'
        });
        assert(reuseTokenRes.status === 400, 'Reusing the same resetAuthorizationToken rejected with 400 (single-use)');

        // 3.5 Verify login with OLD password fails
        const oldLoginRes = await apiRequest('POST', '/auth/login', {
            identifier: testUserEmail,
            password: originalUserPass
        });
        assert(oldLoginRes.status === 401, 'Customer Login with OLD password fails (401)');

        // 3.6 Verify login with NEW password succeeds
        const newLoginRes = await apiRequest('POST', '/auth/login', {
            identifier: testUserEmail,
            password: newUserPass
        });
        assert(newLoginRes.status === 200, 'Customer Login with NEW password succeeds (200)');

        // ----------------------------------------------------
        // 4. ADMIN: FORGOT PASSWORD REQUEST
        // ----------------------------------------------------
        console.log('\n--- 4. Testing Admin Forgot Password ---');

        // 4.1 Non-existent admin email
        const nonExistentAdminRes = await apiRequest('POST', '/admin/auth/forgot-password', { email: 'nonexistent_admin@apnapay.com' });
        assert(nonExistentAdminRes.status === 200, 'Non-existent admin email returns status 200');
        assert(nonExistentAdminRes.data.message === 'If an account exists, a 6-digit OTP has been sent to your registered email address.', 'Generic message returned for non-existent admin');

        // 4.2 Registered admin forgot password
        const adminForgotRes = await apiRequest('POST', '/admin/auth/forgot-password', { email: testAdminEmail });
        assert(adminForgotRes.status === 200, 'Registered admin forgot password returns 200');
        assert(adminForgotRes.data.message === 'If an account exists, a 6-digit OTP has been sent to your registered email address.', 'Generic message returned for registered admin');
        assert(adminForgotRes.data.otp === undefined, 'Strict Security: Admin OTP is NOT returned in response');
        assert(adminForgotRes.data.devOtp === undefined, 'Strict Security: Admin devOtp is NOT returned in response');
        assert(adminForgotRes.data.resetToken === undefined, 'Strict Security: Admin resetToken is NOT returned in response');

        // 4.3 Cooldown enforcement
        const adminCooldownRes = await apiRequest('POST', '/admin/auth/forgot-password', { email: testAdminEmail });
        assert(adminCooldownRes.status === 429, 'Immediate second admin forgot password request blocked with 429 Cooldown');

        // Check admin_otp_verifications DB
        const [adminOtps] = await db.execute(
            `SELECT id, otp_hash, purpose, attempts, verified_at
             FROM admin_otp_verifications
             WHERE email = ? AND purpose = 'password_reset'
             ORDER BY id DESC LIMIT 1`,
            [testAdminEmail]
        );
        assert(adminOtps.length === 1, 'OTP saved in admin_otp_verifications');
        const adminOtpRecord = adminOtps[0];
        assert(adminOtpRecord.otp_hash.startsWith('$2'), 'Admin OTP stored as bcrypt hash');

        const knownAdminOtp = '849102';
        const knownAdminOtpHash = await bcrypt.hash(knownAdminOtp, 12);
        await db.execute(
            `UPDATE admin_otp_verifications SET otp_hash = ? WHERE id = ?`,
            [knownAdminOtpHash, adminOtpRecord.id]
        );

        // ----------------------------------------------------
        // 5. ADMIN: VERIFY OTP
        // ----------------------------------------------------
        console.log('\n--- 5. Testing Admin Verify OTP ---');

        // 5.1 Incorrect OTP
        const wrongAdminOtpRes = await apiRequest('POST', '/admin/auth/verify-otp', {
            email: testAdminEmail,
            otp: '000000',
            purpose: 'password_reset'
        });
        assert(wrongAdminOtpRes.status === 400, 'Incorrect admin OTP returns 400');

        // 5.2 Correct OTP
        const correctAdminOtpRes = await apiRequest('POST', '/admin/auth/verify-otp', {
            email: testAdminEmail,
            otp: knownAdminOtp,
            purpose: 'password_reset'
        });
        assert(correctAdminOtpRes.status === 200, 'Correct admin OTP verification returns 200');
        const adminAuthToken = correctAdminOtpRes.data.resetAuthorizationToken || correctAdminOtpRes.data.resetToken;
        assert(typeof adminAuthToken === 'string' && adminAuthToken.length === 64, 'Admin resetAuthorizationToken granted (64 hex chars)');

        // ----------------------------------------------------
        // 6. ADMIN: RESET PASSWORD
        // ----------------------------------------------------
        console.log('\n--- 6. Testing Admin Reset Password ---');

        // 6.1 Short password rejected
        const shortAdminPassRes = await apiRequest('POST', '/admin/auth/reset-password', {
            token: adminAuthToken,
            newPassword: 'short'
        });
        assert(shortAdminPassRes.status === 400, 'Admin password < 8 chars rejected with 400');

        // 6.2 Valid reset
        const validAdminResetRes = await apiRequest('POST', '/admin/auth/reset-password', {
            token: adminAuthToken,
            newPassword: newAdminPass
        });
        assert(validAdminResetRes.status === 200, 'Valid admin resetPassword returns 200');

        // 6.3 Admin token reuse rejected
        const reuseAdminTokenRes = await apiRequest('POST', '/admin/auth/reset-password', {
            token: adminAuthToken,
            newPassword: 'AnotherAdminPass999!'
        });
        assert(reuseAdminTokenRes.status === 400, 'Admin reset token reuse rejected with 400 (single-use)');

        // 6.4 Login with old password fails
        const oldAdminLogin = await apiRequest('POST', '/admin/auth/login', {
            email: testAdminEmail,
            password: originalAdminPass
        });
        assert(oldAdminLogin.status === 401, 'Admin login with OLD password fails (401)');

        // 6.5 Login with new password succeeds
        const newAdminLogin = await apiRequest('POST', '/admin/auth/login', {
            email: testAdminEmail,
            password: newAdminPass
        });
        assert(newAdminLogin.status === 200, 'Admin login with NEW password succeeds (200)');

        // ----------------------------------------------------
        // CLEANUP TEST USERS (delete child rows first)
        // ----------------------------------------------------
        await db.execute('DELETE FROM otp_verifications WHERE user_id = ? OR email = ?', [testUserId, testUserEmail]);
        await db.execute('DELETE FROM password_resets WHERE user_id = ?', [testUserId]);
        await db.execute('DELETE FROM sessions WHERE user_id = ?', [testUserId]);
        await db.execute('DELETE FROM users WHERE id = ?', [testUserId]);

        await db.execute('DELETE FROM admin_otp_verifications WHERE admin_id = ? OR email = ?', [testAdminId, testAdminEmail]);
        await db.execute('DELETE FROM admin_password_resets WHERE admin_id = ?', [testAdminId]);
        await db.execute('DELETE FROM admin_sessions WHERE admin_id = ?', [testAdminId]);
        await db.execute('DELETE FROM admins WHERE id = ?', [testAdminId]);

    } catch (err) {
        console.error('Test execution error:', err);
        failed++;
    }

    console.log('\n========================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================');

    server.close();
    process.exit(failed > 0 ? 1 : 0);
}

runTests();
