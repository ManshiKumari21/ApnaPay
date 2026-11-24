require('dotenv').config({ path: __dirname + '/../.env' });
const http = require('http');
const db = require('../config/db');
const app = require('../app');

const PORT = 5003;
let server;
let baseUrl;

function assert(condition, message) {
    if (!condition) {
        console.error(`  [FAIL] ${message}`);
        throw new Error(`Assertion failed: ${message}`);
    }
    console.log(`  [PASS] ${message}`);
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

    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
}

async function runBankUpiTests() {
    console.log('========================================================');
    console.log('RUNNING TEST SUITE FOR APNAPAY BANK ACCOUNT & UPI APIs');
    console.log('========================================================\n');

    try {
        // Start test server
        server = http.createServer(app);
        await new Promise((resolve) => server.listen(PORT, resolve));
        baseUrl = `http://127.0.0.1:${PORT}`;
        console.log(`Test server running at ${baseUrl}\n`);

        const timestamp = Date.now();
        const testEmail = `bank_test_${timestamp}@example.com`;
        const testPhone = `98${String(timestamp).slice(-8)}`;
        const testPass = 'BankTest@123456';

        // Clean any leftovers
        await db.execute('DELETE FROM users WHERE email = ?', [testEmail]);

        // Step 0: Register customer user to get JWT token
        console.log('--- Setting Up Test Customer ---');
        const regRes = await apiRequest('POST', '/auth/register', {
            full_name: 'Gopal Fintech Tester',
            email: testEmail,
            phone: testPhone,
            password: testPass
        });
        assert(regRes.status === 201, 'Customer registered successfully');
        const userId = regRes.data.user.id;

        const loginRes = await apiRequest('POST', '/auth/login', {
            identifier: testEmail,
            password: testPass
        });
        assert(loginRes.status === 200, 'Customer logged in successfully');
        const token = loginRes.data.accessToken;
        assert(Boolean(token), 'Valid Bearer JWT access token received');

        // ==========================================
        // 1. GET /bank-accounts (Initial Empty List)
        // ==========================================
        console.log('\n1. Testing GET /bank-accounts (Initially empty)');
        const getInitial = await apiRequest('GET', '/bank-accounts', null, token);
        assert(getInitial.status === 200, 'GET /bank-accounts returns 200');
        assert(Array.isArray(getInitial.data.data), 'Returns data array');
        assert(getInitial.data.data.length === 0, 'Initially has 0 linked bank accounts');

        // Test root mount /api/v1/bank-accounts as well
        const getInitialV1 = await apiRequest('GET', '/api/v1/bank-accounts', null, token);
        assert(getInitialV1.status === 200, 'GET /api/v1/bank-accounts returns 200 (both mount paths work)');

        // ==========================================
        // 2. POST /bank-accounts/link (Initiate Link)
        // ==========================================
        console.log('\n2. Testing POST /bank-accounts/link (Initiate Bank Linking)');
        const linkRes = await apiRequest('POST', '/bank-accounts/link', {
            bankName: 'HDFC Bank',
            accountNumber: '50100234567890',
            confirmAccountNumber: '50100234567890',
            ifscCode: 'HDFC0001234',
            accountHolderName: 'Gopal Fintech Tester',
            isPrimary: true
        }, token);

        assert(linkRes.status === 201, 'POST /bank-accounts/link returns 201 Created');
        assert(linkRes.data.success === true, 'Response success is true');
        assert(linkRes.data.data.bankAccountId > 0, 'Returns created bankAccountId');
        assert(linkRes.data.data.status === 'pending', 'Account status is initially "pending"');
        assert(linkRes.data.data.accountLast4 === '7890', 'Account last4 is correctly extracted (7890)');
        assert(linkRes.data.data.maskedAccountNumber === '••••••••7890', 'Account number is masked in response');

        const bankAccountId = linkRes.data.data.bankAccountId;
        let devOtp = linkRes.data.data.devOtp;
        assert(Boolean(devOtp) && /^\d{6}$/.test(devOtp), 'Generated 6-digit verification OTP');

        // Test duplicate link attempt (should prevent double pending or conflict)
        const dupLink = await apiRequest('POST', '/bank-accounts/link', {
            bankName: 'HDFC Bank',
            accountNumber: '50100234567890',
            confirmAccountNumber: '50100234567890',
            ifscCode: 'HDFC0001234'
        }, token);
        assert(dupLink.status === 201, 'Re-initiating pending link updates request with fresh OTP');
        if (dupLink.data.data.devOtp) {
            devOtp = dupLink.data.data.devOtp;
        }

        // Check invalid IFSC validation
        const badIfsc = await apiRequest('POST', '/bank-accounts/link', {
            bankName: 'HDFC Bank',
            accountNumber: '50100234567890',
            ifscCode: 'INVALID_IFSC'
        }, token);
        assert(badIfsc.status === 400, 'Rejects invalid IFSC code with 400 Bad Request');

        // ==========================================
        // 3. POST /bank-accounts/verify (Verify Linking)
        // ==========================================
        console.log('\n3. Testing POST /bank-accounts/verify (Verify OTP)');
        // Wrong OTP test
        const wrongOtpRes = await apiRequest('POST', '/bank-accounts/verify', {
            bankAccountId,
            otp: '000000'
        }, token);
        assert(wrongOtpRes.status === 400, 'Rejects incorrect OTP with 400 Bad Request');

        // Correct OTP test
        const verifyRes = await apiRequest('POST', '/bank-accounts/verify', {
            bankAccountId,
            otp: devOtp
        }, token);

        assert(verifyRes.status === 200, 'POST /bank-accounts/verify returns 200 OK');
        assert(verifyRes.data.success === true, 'Verification success is true');
        assert(verifyRes.data.data.status === 'active', 'Bank account is now "active"');
        assert(verifyRes.data.data.isPrimary === true, 'Bank account is primary');

        // ==========================================
        // 4. GET /bank-accounts (Check Verified Account)
        // ==========================================
        console.log('\n4. Testing GET /bank-accounts (Retrieve Linked Accounts)');
        const getAccounts = await apiRequest('GET', '/bank-accounts', null, token);
        assert(getAccounts.status === 200, 'GET /bank-accounts returns 200');
        assert(getAccounts.data.data.length === 1, 'Returns 1 active bank account');
        assert(getAccounts.data.data[0].bankName === 'HDFC Bank', 'Bank name is HDFC Bank');
        assert(getAccounts.data.data[0].accountLast4 === '7890', 'Account last4 matches');
        assert(getAccounts.data.data[0].status === 'active', 'Status is active');

        // ==========================================
        // 5. GET /upi/handles (Check Initial / Auto Handles)
        // ==========================================
        console.log('\n5. Testing GET /upi/handles (List UPI Handles)');
        const getUpiInitial = await apiRequest('GET', '/upi/handles', null, token);
        assert(getUpiInitial.status === 200, 'GET /upi/handles returns 200');
        assert(Array.isArray(getUpiInitial.data.data), 'Returns data array');
        assert(Array.isArray(getUpiInitial.data.availableSuffixes), 'Returns availableSuffixes array');
        assert(getUpiInitial.data.availableSuffixes.includes('@apnapay'), 'Suffix @apnapay is supported');

        // Test root mount /api/v1/upi/handles
        const getUpiV1 = await apiRequest('GET', '/api/v1/upi/handles', null, token);
        assert(getUpiV1.status === 200, 'GET /api/v1/upi/handles returns 200 (both mount paths work)');

        // ==========================================
        // 6. POST /upi/handles (Register Custom UPI Handle)
        // ==========================================
        console.log('\n6. Testing POST /upi/handles (Register Custom UPI Handle)');
        const customHandle = `gopal_${timestamp}@apnapay`;
        const createUpiRes = await apiRequest('POST', '/upi/handles', {
            upiId: customHandle,
            bankAccountId,
            isPrimary: true
        }, token);

        assert(createUpiRes.status === 201, 'POST /upi/handles returns 201 Created');
        assert(createUpiRes.data.success === true, 'Response success is true');
        assert(createUpiRes.data.data.upiId === customHandle, 'UPI ID matches requested handle');
        assert(createUpiRes.data.data.bankAccountId === bankAccountId, 'Linked to the verified bank account');
        assert(createUpiRes.data.data.isPrimary === true, 'Set as primary UPI handle');

        // Duplicate registration check
        const dupUpiRes = await apiRequest('POST', '/upi/handles', {
            upiId: customHandle,
            bankAccountId
        }, token);
        assert(dupUpiRes.status === 409, 'Rejects duplicate UPI handle registration with 409 Conflict');

        // Auto suffix test (e.g. passing 'tester99' without '@' appends '@apnapay')
        const autoSuffixRes = await apiRequest('POST', '/upi/handles', {
            upiId: `quick_${timestamp}`
        }, token);
        assert(autoSuffixRes.status === 201, 'Auto-appends @apnapay suffix when omitted');
        assert(autoSuffixRes.data.data.upiId === `quick_${timestamp}@apnapay`, 'Successfully registered with appended @apnapay');

        // Verify GET /upi/handles returns registered handles with bank details
        const getUpiAfter = await apiRequest('GET', '/upi/handles', null, token);
        assert(getUpiAfter.status === 200, 'GET /upi/handles returns 200');
        assert(getUpiAfter.data.data.length >= 2, 'Returns registered UPI handles');
        const primaryHandle = getUpiAfter.data.data.find(h => h.isPrimary);
        assert(Boolean(primaryHandle), 'Has an active primary UPI handle');
        assert(primaryHandle.bankName === 'HDFC Bank', 'Handle includes joined bankName');

        // ==========================================
        // 7. DELETE /bank-accounts/:id (Unlink Bank Account)
        // ==========================================
        console.log('\n7. Testing DELETE /bank-accounts/:id (Unlink Bank Account)');
        const deleteRes = await apiRequest('DELETE', `/bank-accounts/${bankAccountId}`, null, token);
        assert(deleteRes.status === 200, 'DELETE /bank-accounts/:id returns 200 OK');
        assert(deleteRes.data.success === true, 'Unlink response success is true');

        // Test GET /bank-accounts after unlink
        const getAfterDelete = await apiRequest('GET', '/bank-accounts', null, token);
        assert(getAfterDelete.status === 200, 'GET /bank-accounts returns 200');
        assert(getAfterDelete.data.data.length === 0, 'Unlinked account no longer appears in active accounts list');

        // Verify unlinking non-existent account returns 404
        const deleteNotFound = await apiRequest('DELETE', `/bank-accounts/999999`, null, token);
        assert(deleteNotFound.status === 404, 'Returns 404 for unlinking non-existent bank account');

        // ==========================================
        // 8. Auth Protection Check (401 without Token)
        // ==========================================
        console.log('\n8. Testing Authentication Protection (401 Unauthorized)');
        const noAuth1 = await apiRequest('GET', '/bank-accounts');
        assert(noAuth1.status === 401, 'GET /bank-accounts requires authentication');

        const noAuth2 = await apiRequest('POST', '/bank-accounts/link', {});
        assert(noAuth2.status === 401, 'POST /bank-accounts/link requires authentication');

        const noAuth3 = await apiRequest('POST', '/bank-accounts/verify', {});
        assert(noAuth3.status === 401, 'POST /bank-accounts/verify requires authentication');

        const noAuth4 = await apiRequest('DELETE', '/bank-accounts/1');
        assert(noAuth4.status === 401, 'DELETE /bank-accounts/:id requires authentication');

        const noAuth5 = await apiRequest('GET', '/upi/handles');
        assert(noAuth5.status === 401, 'GET /upi/handles requires authentication');

        const noAuth6 = await apiRequest('POST', '/upi/handles', {});
        assert(noAuth6.status === 401, 'POST /upi/handles requires authentication');

        console.log('\n========================================================');
        console.log('ALL BANK ACCOUNT & UPI API TESTS PASSED PERFECTLY!');
        console.log('========================================================');

        // Cleanup test user & data
        await db.execute('DELETE FROM upi_handles WHERE user_id = ?', [userId]);
        await db.execute('DELETE FROM bank_accounts WHERE user_id = ?', [userId]);
        await db.execute('DELETE FROM sessions WHERE user_id = ?', [userId]);
        await db.execute('DELETE FROM wallets WHERE user_id = ?', [userId]);
        await db.execute('DELETE FROM users WHERE id = ?', [userId]);

        process.exit(0);

    } catch (err) {
        console.error('Test Suite Failed:', err);
        process.exit(1);
    } finally {
        if (server) server.close();
    }
}

runBankUpiTests();
