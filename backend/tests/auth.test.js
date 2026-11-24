require('dotenv').config({ path: __dirname + '/../.env' });
const http = require('http');
const app = require('../app');
const db = require('../config/db');

let server;
const PORT = 5005;

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
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

async function runTests() {
    console.log('--- Starting ApnaPay Auth APIs Verification ---');

    const testEmail = 'postman_test_' + Date.now() + '@example.com';
    const testPhone = '9' + Math.floor(100000000 + Math.random() * 900000000);
    const testPassword = 'Password123@';
    const newPassword = 'NewSecretPassword456@';

    server = app.listen(PORT);

    try {
        // 1. Send OTP
        const res1 = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/auth/send-otp',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: testEmail });

        if (res1.status !== 200 || !res1.data.success || !res1.data.otp) {
            throw new Error('Test 1 Failed: Send OTP did not return 200 with OTP');
        }
        const otp = res1.data.otp;

        // 2. Verify OTP
        const res2 = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/auth/verify-otp',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: testEmail, otp: otp });

        if (res2.status !== 200 || !res2.data.success) {
            throw new Error('Test 2 Failed: Verify OTP did not return 200');
        }

        // 3. Register Account
        const res3 = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/auth/register',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            full_name: 'Postman Test User',
            phone: testPhone,
            email: testEmail,
            password: testPassword
        });

        if (res3.status !== 201 || !res3.data.success || !res3.data.user) {
            throw new Error('Test 3 Failed: Register did not return 201 with user');
        }
        const userId = res3.data.user.id;

        // 4. Login
        const res4 = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            identifier: testEmail,
            password: testPassword
        });

        if (res4.status !== 200 || !res4.data.refreshToken) {
            throw new Error('Test 4 Failed: Login did not return tokens');
        }
        let refreshToken = res4.data.refreshToken;

        // 5. Refresh Token
        const res5 = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/auth/refresh',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { refreshToken });

        if (res5.status !== 200 || !res5.data.refreshToken) {
            throw new Error('Test 5 Failed: Refresh Token failed');
        }
        refreshToken = res5.data.refreshToken;

        // 6. Logout
        const res6 = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/auth/logout',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { refreshToken });

        if (res6.status !== 200 || !res6.data.success) {
            throw new Error('Test 6 Failed: Logout failed');
        }

        // 7. Forgot Password
        const res7 = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/auth/forgot-password',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: testEmail });

        if (res7.status !== 200 || !res7.data.resetToken) {
            throw new Error('Test 7 Failed: Forgot password failed');
        }
        const resetToken = res7.data.resetToken;

        // 8. Reset Password
        const res8 = await request({
            hostname: '127.0.0.1',
            port: PORT,
            path: '/auth/reset-password',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, {
            token: resetToken,
            newPassword: newPassword
        });

        if (res8.status !== 200 || !res8.data.success) {
            throw new Error('Test 8 Failed: Reset password failed');
        }

        console.log('SUCCESS! All 8 Authentication APIs passed verification.');

    } catch (err) {
        console.error('TEST SUITE FAILED:', err.message);
        process.exitCode = 1;
    } finally {
        if (server) server.close();
        await db.end();
    }
}

runTests();

