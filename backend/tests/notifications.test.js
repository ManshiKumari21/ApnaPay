require('dotenv').config({ path: __dirname + '/../.env' });
const http = require('http');
const db = require('../config/db');
const app = require('../app');
const bcrypt = require('bcrypt');
const NotificationService = require('../services/notificationService');

const PORT = 5006;
let server;
let baseUrl;

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
    totalTests++;
    if (!condition) {
        console.error(`  ❌ [FAIL] ${message}`);
        throw new Error(`Assertion failed: ${message}`);
    }
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
}

async function apiRequest(method, path, body = null, token = null) {
    const url = new URL(path, baseUrl);
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    });

    const contentType = res.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
        data = await res.json().catch(() => ({}));
    } else {
        data = await res.text().catch(() => '');
    }

    return { status: res.status, data, headers: res.headers };
}

async function runNotificationTests() {
    console.log('========================================================');
    console.log('RUNNING COMPREHENSIVE NOTIFICATION MODULE API TEST SUITE');
    console.log('========================================================\n');

    let userAId, userBId;
    let tokenA, tokenB;

    try {
        // Start test server on dedicated port 5006
        server = http.createServer(app);
        await new Promise((resolve) => server.listen(PORT, resolve));
        baseUrl = `http://127.0.0.1:${PORT}`;
        console.log(`Test server running at ${baseUrl}\n`);

        const timestamp = Date.now();
        const emailA = `test_notif_a_${timestamp}@example.com`;
        const emailB = `test_notif_b_${timestamp}@example.com`;
        const phoneA = `98${String(timestamp).slice(-8)}`;
        const phoneB = `97${String(timestamp).slice(-8)}`;
        const password = 'Password@123';
        const passwordHash = await bcrypt.hash(password, 10);

        // 1. Create Test Users in MySQL
        console.log('--- SETUP: Creating Test Users ---');
        const [resA] = await db.execute(
            `INSERT INTO users (full_name, email, phone, password_hash, email_verified_at, status)
             VALUES (?, ?, ?, ?, NOW(), 'active')`,
            ['User Alpha Notifications', emailA, phoneA, passwordHash]
        );
        userAId = resA.insertId;

        const [resB] = await db.execute(
            `INSERT INTO users (full_name, email, phone, password_hash, email_verified_at, status)
             VALUES (?, ?, ?, ?, NOW(), 'active')`,
            ['User Beta Notifications', emailB, phoneB, passwordHash]
        );
        userBId = resB.insertId;

        // Login User A
        const loginResA = await apiRequest('POST', '/api/v1/auth/login', {
            identifier: emailA,
            password: password
        });
        assert(loginResA.status === 200, 'User A login should succeed');
        tokenA = loginResA.data.token || loginResA.data.accessToken || loginResA.data.data?.accessToken;
        assert(!!tokenA, 'User A should receive valid JWT access token');

        // Login User B
        const loginResB = await apiRequest('POST', '/api/v1/auth/login', {
            identifier: emailB,
            password: password
        });
        assert(loginResB.status === 200, 'User B login should succeed');
        tokenB = loginResB.data.token || loginResB.data.accessToken || loginResB.data.data?.accessToken;
        assert(!!tokenB, 'User B should receive valid JWT access token');

        console.log(`User A (ID: ${userAId}) and User B (ID: ${userBId}) ready.\n`);

        // =========================================================================
        // TEST SUITE 1: GET /api/notifications (Authentication & Empty state)
        // =========================================================================
        console.log('--- TEST 1: GET /api/notifications (Auth & Empty State) ---');
        const unauthGet = await apiRequest('GET', '/api/notifications');
        assert(unauthGet.status === 401, 'GET /api/notifications without token returns 401 Unauthorized');

        const initialGetA = await apiRequest('GET', '/api/notifications', null, tokenA);
        assert(initialGetA.status === 200, 'GET /api/notifications with valid token returns 200 OK');
        assert(initialGetA.data.success === true, 'Response payload has success: true');
        assert(Array.isArray(initialGetA.data.data.records), 'data.records is an array');
        assert(typeof initialGetA.data.data.unreadCount === 'number', 'data.unreadCount is a number');

        // =========================================================================
        // TEST SUITE 2: Populate Notifications & Test Scoping + Filters
        // =========================================================================
        console.log('\n--- TEST 2: Notification Scoping, Pagination & Filters ---');
        // Insert 3 notifications for User A (2 unread, 1 read)
        const [n1] = await db.execute(
            `INSERT INTO notifications (user_id, title, message, category, type, is_read, reference_id, reference_type)
             VALUES (?, 'Bank Account Linked', 'Your SBI account ending in 1234 was linked.', 'bank', 'success', 0, 'ref_b1', 'bank_account')`,
            [userAId]
        );
        const notifA1_Id = n1.insertId;

        const [n2] = await db.execute(
            `INSERT INTO notifications (user_id, title, message, category, type, is_read, reference_id, reference_type)
             VALUES (?, 'UPI Handle Registered', 'Your UPI ID alpha@apnapay is ready.', 'upi', 'success', 0, 'ref_u1', 'upi_handle')`,
            [userAId]
        );
        const notifA2_Id = n2.insertId;

        const [n3] = await db.execute(
            `INSERT INTO notifications (user_id, title, message, category, type, is_read, read_at, reference_id, reference_type)
             VALUES (?, 'Security Notice', 'Password changed successfully.', 'security', 'warning', 1, NOW(), 'ref_s1', 'security_event')`,
            [userAId]
        );
        const notifA3_Id = n3.insertId;

        // Insert 1 notification for User B (must NOT be visible to User A)
        const [nB] = await db.execute(
            `INSERT INTO notifications (user_id, title, message, category, type, is_read, reference_id, reference_type)
             VALUES (?, 'User B Notification', 'Private notification for Beta.', 'wallet', 'info', 0, 'ref_b_w1', 'wallet_event')`,
            [userBId]
        );
        const notifB_Id = nB.insertId;

        // User A fetches all notifications
        const getAAll = await apiRequest('GET', '/api/notifications?status=all', null, tokenA);
        assert(getAAll.status === 200, 'User A fetches all notifications (200 OK)');
        assert(getAAll.data.data.totalRecords === 3, 'User A has exactly 3 total notifications');
        assert(getAAll.data.data.unreadCount === 2, 'User A has exactly 2 unread notifications');
        assert(
            !getAAll.data.data.records.some(r => r.id === notifB_Id),
            'IDOR Isolation: User B notification is NOT visible to User A'
        );

        // User A filters by unread
        const getAUnread = await apiRequest('GET', '/api/notifications?status=unread', null, tokenA);
        assert(getAUnread.status === 200, 'User A filters by unread (200 OK)');
        assert(getAUnread.data.data.records.length === 2, 'Unread filter returns exactly 2 records');
        assert(getAUnread.data.data.records.every(r => r.is_read === 0), 'All filtered records have is_read === 0');

        // User A filters by read
        const getARead = await apiRequest('GET', '/api/notifications?status=read', null, tokenA);
        assert(getARead.status === 200, 'User A filters by read (200 OK)');
        assert(getARead.data.data.records.length === 1, 'Read filter returns exactly 1 record');
        assert(getARead.data.data.records[0].id === notifA3_Id, 'Returned record matches read notification ID');

        // User A pagination
        const getPage1 = await apiRequest('GET', '/api/notifications?page=1&limit=2', null, tokenA);
        assert(getPage1.data.data.records.length === 2, 'Pagination page 1 returns 2 records');
        assert(getPage1.data.data.pagination.totalPages === 2, 'Pagination metadata reports 2 total pages');

        const getPage2 = await apiRequest('GET', '/api/notifications?page=2&limit=2', null, tokenA);
        assert(getPage2.data.data.records.length === 1, 'Pagination page 2 returns remaining 1 record');

        // =========================================================================
        // TEST SUITE 3: PATCH /api/notifications/:id/read (Single Mark as Read & IDOR)
        // =========================================================================
        console.log('\n--- TEST 3: PATCH /api/notifications/:id/read (Mark Single & IDOR Protection) ---');
        // Unauthenticated check
        const unauthPatch = await apiRequest('PATCH', `/api/notifications/${notifA1_Id}/read`);
        assert(unauthPatch.status === 401, 'PATCH without token returns 401 Unauthorized');

        // Non-existent ID check
        const notFoundPatch = await apiRequest('PATCH', '/api/notifications/99999999/read', null, tokenA);
        assert(notFoundPatch.status === 404, 'PATCH non-existent notification returns 404 Not Found');

        // IDOR Protection: User A attempts to mark User B's notification as read
        const idorPatch = await apiRequest('PATCH', `/api/notifications/${notifB_Id}/read`, null, tokenA);
        assert(idorPatch.status === 403, 'IDOR Protection: User A marking User B notification returns 403 Forbidden');

        // Valid mark as read: User A marks notifA1
        const validPatch = await apiRequest('PATCH', `/api/notifications/${notifA1_Id}/read`, null, tokenA);
        assert(validPatch.status === 200, 'User A marks own notification as read (200 OK)');
        assert(validPatch.data.success === true, 'Response returns success: true');
        assert(validPatch.data.data.is_read === 1, 'Response data indicates is_read: 1');

        // Verify unread count decreased from 2 to 1
        const verifyCount = await apiRequest('GET', '/api/notifications', null, tokenA);
        assert(verifyCount.data.data.unreadCount === 1, 'Unread count updated from 2 to 1');

        // Idempotency: marking already-read notification again should safely return 200
        const repeatPatch = await apiRequest('PATCH', `/api/notifications/${notifA1_Id}/read`, null, tokenA);
        assert(repeatPatch.status === 200, 'Repeat mark as read returns 200 safely');
        assert(repeatPatch.data.alreadyRead === true, 'Response indicates alreadyRead: true');

        // =========================================================================
        // TEST SUITE 4: POST /api/notifications/read-all (Mark All as Read)
        // =========================================================================
        console.log('\n--- TEST 4: POST /api/notifications/read-all ---');
        // Unauthenticated check
        const unauthReadAll = await apiRequest('POST', '/api/notifications/read-all');
        assert(unauthReadAll.status === 401, 'POST /read-all without token returns 401 Unauthorized');

        // User A marks all as read
        const readAllRes = await apiRequest('POST', '/api/notifications/read-all', null, tokenA);
        assert(readAllRes.status === 200, 'POST /read-all returns 200 OK');
        assert(readAllRes.data.success === true, 'Response returns success: true');
        assert(readAllRes.data.data.updatedCount === 1, 'updatedCount equals 1 (only notifA2 was remaining unread)');

        // Verify User A unread count is now 0
        const afterReadAll = await apiRequest('GET', '/api/notifications', null, tokenA);
        assert(afterReadAll.data.data.unreadCount === 0, 'User A unread count is now 0');

        // Verify User B notification is STILL unread (untouched)
        const checkUserB = await apiRequest('GET', '/api/notifications', null, tokenB);
        assert(checkUserB.data.data.unreadCount === 1, 'User B notification is untouched and remains unread (1)');

        // Calling read-all when nothing is unread returns updatedCount: 0
        const repeatReadAll = await apiRequest('POST', '/api/notifications/read-all', null, tokenA);
        assert(repeatReadAll.status === 200, 'Repeat read-all returns 200 OK');
        assert(repeatReadAll.data.data.updatedCount === 0, 'updatedCount is 0 when all are already read');

        // =========================================================================
        // TEST SUITE 5: GET /api/notification-preferences (Preferences API)
        // =========================================================================
        console.log('\n--- TEST 5: GET /api/notification-preferences ---');
        const unauthPrefs = await apiRequest('GET', '/api/notification-preferences');
        assert(unauthPrefs.status === 401, 'GET /preferences without token returns 401 Unauthorized');

        const prefsRes = await apiRequest('GET', '/api/notification-preferences', null, tokenA);
        assert(prefsRes.status === 200, 'GET /notification-preferences returns 200 OK');
        assert(prefsRes.data.success === true, 'Preferences response has success: true');

        const prefsData = prefsRes.data.data;
        assert(typeof prefsData === 'object', 'Preferences data is an object');
        assert(typeof prefsData.payment_notifications === 'boolean', 'payment_notifications is boolean');
        assert(typeof prefsData.wallet_notifications === 'boolean', 'wallet_notifications is boolean');
        assert(typeof prefsData.bank_notifications === 'boolean', 'bank_notifications is boolean');
        assert(typeof prefsData.upi_notifications === 'boolean', 'upi_notifications is boolean');
        assert(typeof prefsData.kyc_notifications === 'boolean', 'kyc_notifications is boolean');
        assert(typeof prefsData.digital_land_notifications === 'boolean', 'digital_land_notifications is boolean');
        assert(typeof prefsData.security_notifications === 'boolean', 'security_notifications is boolean');
        assert(typeof prefsData.general_notifications === 'boolean', 'general_notifications is boolean');
        assert(prefsData.bank_notifications === true, 'Default bank_notifications is true');

        // =========================================================================
        // TEST SUITE 6: NotificationService Integration (Deduplication & Preference suppression)
        // =========================================================================
        console.log('\n--- TEST 6: NotificationService Service Logic (Deduplication & Suppression) ---');
        // Service notification creation
        const createdId = await NotificationService.notify({
            userId: userAId,
            title: 'Service Notification Test',
            message: 'Testing NotificationService notify helper.',
            category: 'digital_land',
            type: 'info',
            referenceId: 'dl_order_99',
            referenceType: 'digital_land_order'
        });
        assert(!!createdId, 'NotificationService.notify() inserts record and returns ID');

        // Test duplicate suppression within 5 minutes for identical reference
        const dupId = await NotificationService.notify({
            userId: userAId,
            title: 'Duplicate Attempt',
            message: 'Should be suppressed.',
            category: 'digital_land',
            type: 'info',
            referenceId: 'dl_order_99',
            referenceType: 'digital_land_order'
        });
        assert(dupId === createdId, 'Deduplication: Returns existing notification ID without duplicate insert');

        // Test preference suppression: Disable kyc notifications for User A in MySQL
        await db.execute(
            `UPDATE notification_preferences SET kyc_notifications = 0 WHERE user_id = ?`,
            [userAId]
        );
        const suppressedId = await NotificationService.notify({
            userId: userAId,
            title: 'KYC Alert',
            message: 'This should be suppressed because preference is turned off.',
            category: 'kyc',
            type: 'info'
        });
        assert(suppressedId === null, 'Preference Suppression: Returns null and skips insert when preference is 0');

        console.log('\n========================================================');
        console.log(`ALL TESTS PASSED! (${passedTests}/${totalTests} assertions passed)`);
        console.log('========================================================\n');

    } catch (err) {
        console.error('\n❌ Test suite failed with error:', err);
        process.exitCode = 1;
    } finally {
        // Cleanup Test Data
        console.log('--- CLEANUP: Removing Test Records ---');
        try {
            if (userAId || userBId) {
                await db.execute(`DELETE FROM notifications WHERE user_id IN (?, ?)`, [userAId || 0, userBId || 0]);
                await db.execute(`DELETE FROM notification_preferences WHERE user_id IN (?, ?)`, [userAId || 0, userBId || 0]);
                await db.execute(`DELETE FROM sessions WHERE user_id IN (?, ?)`, [userAId || 0, userBId || 0]);
                await db.execute(`DELETE FROM wallets WHERE user_id IN (?, ?)`, [userAId || 0, userBId || 0]);
                await db.execute(`DELETE FROM users WHERE id IN (?, ?)`, [userAId || 0, userBId || 0]);
                console.log('Test records successfully cleaned up.');
            }
        } catch (cleanErr) {
            console.error('Cleanup warning:', cleanErr.message);
        }

        if (server) {
            server.close();
        }
        await db.end();
    }
}

runNotificationTests();
