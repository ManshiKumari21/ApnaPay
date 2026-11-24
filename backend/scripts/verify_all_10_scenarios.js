require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../config/db');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5000';

async function run10Scenarios() {
    console.log('===============================================================');
    console.log('TESTING ALL 10 NOTIFICATION MARK AS READ SCENARIOS (HTTP LIVE)');
    console.log('===============================================================\n');

    const results = [];

    try {
        const secret = process.env.JWT_SECRET || 'apnapay_access_secret_key_2026';

        // 1. Prepare Customer Tokens
        // User 1 (Owner of Notification 11)
        const tokenUser1 = jwt.sign({ userId: 1 }, secret, { expiresIn: '1h' });

        // User 2 (Owner of Notification 10, NOT 11)
        const tokenUser2 = jwt.sign({ userId: 2 }, secret, { expiresIn: '1h' });

        // Expired Token
        const expiredToken = jwt.sign({ userId: 1 }, secret, { expiresIn: '-10s' });

        // 2. Prepare Database State
        // Ensure Notification 11 belongs to User 1 and is UNREAD
        await db.execute(
            `UPDATE notifications
             SET user_id = 1, is_read = 0, read_at = NULL
             WHERE id = 11`
        );

        // Ensure Notification 10 belongs to User 2 and is UNREAD
        await db.execute(
            `UPDATE notifications
             SET user_id = 2, is_read = 0, read_at = NULL
             WHERE id = 10`
        );

        console.log('Database state reset:');
        console.log('  - Notification 11: user_id = 1, is_read = 0');
        console.log('  - Notification 10: user_id = 2, is_read = 0\n');

        // Helper function for API requests
        async function sendRequest(scenarioNum, name, method, path, token, body = null, expectedStatus = 200) {
            const url = `${BASE_URL}${path}`;
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined
            });

            const data = await res.json().catch(() => ({}));
            const pass = res.status === expectedStatus;

            console.log(`Test ${scenarioNum}: ${name}`);
            console.log(`  Expected Status: ${expectedStatus} | Actual Status: ${res.status}`);
            console.log(`  Response:`, JSON.stringify(data));
            console.log(`  Status: ${pass ? 'PASSED ✅' : 'FAILED ❌'}\n`);

            results.push({
                test: scenarioNum,
                scenario: name,
                expected: expectedStatus,
                actual: res.status,
                passed: pass,
                response: data
            });

            return { status: res.status, data };
        }

        // Test 1: Valid customer token and own unread notification (User 1 -> Notif 11)
        await sendRequest(1, 'Valid customer token and own unread notification', 'PATCH', '/api/notifications/11/read', tokenUser1, null, 200);

        // Test 2: Valid customer token and already-read notification (User 1 -> Notif 11 again)
        await sendRequest(2, 'Valid customer token and already-read notification', 'PATCH', '/api/notifications/11/read', tokenUser1, null, 200);

        // Test 3: Notification does not exist (ID 99999999)
        await sendRequest(3, 'Notification does not exist', 'PATCH', '/api/notifications/99999999/read', tokenUser1, null, 404);

        // Test 4: Invalid notification ID ('abc')
        await sendRequest(4, 'Invalid notification ID', 'PATCH', '/api/notifications/abc/read', tokenUser1, null, 400);

        // Test 5: Missing Bearer Token
        await sendRequest(5, 'Missing Bearer Token', 'PATCH', '/api/notifications/11/read', null, null, 401);

        // Test 6: Invalid Bearer Token
        await sendRequest(6, 'Invalid Bearer Token', 'PATCH', '/api/notifications/11/read', 'invalid_token_string_here_123', null, 401);

        // Test 7: Expired Bearer Token
        await sendRequest(7, 'Expired Bearer Token', 'PATCH', '/api/notifications/11/read', expiredToken, null, 401);

        // Test 8: Customer tries another customer\'s notification (User 2 tries Notif 11)
        await sendRequest(8, 'Customer tries another customer notification (Ownership check)', 'PATCH', '/api/notifications/11/read', tokenUser2, null, 403);

        // Test 9: Valid notification ID with correct owner (User 2 -> Notif 10)
        await sendRequest(9, 'Valid notification ID with correct owner (User 2 on Notif 10)', 'PATCH', '/api/notifications/10/read', tokenUser2, null, 200);

        // Test 10: Verify updated notification in MySQL
        console.log('Test 10: Verify updated notification in MySQL:');
        const [rows11] = await db.execute(
            `SELECT id, user_id, is_read, read_at
             FROM notifications
             WHERE id = 11`
        );
        const [rows10] = await db.execute(
            `SELECT id, user_id, is_read, read_at
             FROM notifications
             WHERE id = 10`
        );

        const row11 = rows11[0];
        const row10 = rows10[0];

        console.log('  MySQL row for ID 11:', row11);
        console.log('  MySQL row for ID 10:', row10);

        const dbPass = row11 && row11.is_read === 1 && row11.read_at !== null &&
                       row10 && row10.is_read === 1 && row10.read_at !== null;

        console.log(`  MySQL verification: ${dbPass ? 'PASSED ✅ (is_read = 1, read_at is not null)' : 'FAILED ❌'}\n`);

        results.push({
            test: 10,
            scenario: 'Verify updated notification in MySQL',
            expected: 'is_read = 1',
            actual: `is_read = ${row11?.is_read}`,
            passed: dbPass,
            dbRow11: row11,
            dbRow10: row10
        });

        // Summary
        console.log('===============================================================');
        const passedCount = results.filter(r => r.passed).length;
        console.log(`SUMMARY: ${passedCount}/10 Scenarios Passed!`);
        console.log('===============================================================');

    } catch (err) {
        console.error('Test execution error:', err);
    } finally {
        await db.end();
    }
}

run10Scenarios();

