require('dotenv').config({ path: __dirname + '/../.env' });
const http = require('http');
const db = require('../config/db');
const app = require('../app');
const bcrypt = require('bcrypt');

const PORT = 5004;
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

    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
}

async function runWalletTests() {
    console.log('========================================================');
    console.log('RUNNING COMPREHENSIVE WALLET & LEDGER API TEST SUITE');
    console.log('========================================================\n');

    try {
        // Start dedicated test server
        server = http.createServer(app);
        await new Promise((resolve) => server.listen(PORT, resolve));
        baseUrl = `http://127.0.0.1:${PORT}`;
        console.log(`Test server running at ${baseUrl}\n`);

        const timestamp = Date.now();
        const userAEmail = `wallet_test_a_${timestamp}@example.com`;
        const userAPhone = `98${String(timestamp).slice(-8)}`;
        const userBEmail = `wallet_test_b_${timestamp}@example.com`;
        const userBPhone = `97${String(timestamp).slice(-8)}`;
        const testPassword = 'WalletTest@123456';
        const passwordHash = await bcrypt.hash(testPassword, 10);

        // Clean previous test users
        await db.execute('DELETE FROM users WHERE email IN (?, ?)', [userAEmail, userBEmail]);

        // ----------------------------------------------------
        // Setup User A (with wallet and KYC record)
        // ----------------------------------------------------
        console.log('--- Setting Up Test User A ---');
        const [userAResult] = await db.execute(
            `INSERT INTO users (full_name, email, phone, password_hash, email_verified_at, status)
             VALUES (?, ?, ?, ?, NOW(), 'active')`,
            ['User Alpha', userAEmail, userAPhone, passwordHash]
        );
        const userAId = userAResult.insertId;

        // Insert User A wallet with balance 5000.00
        const [walletAResult] = await db.execute(
            `INSERT INTO wallets (user_id, currency, available_balance, status)
             VALUES (?, 'INR', 5000.0000, 'active')`,
            [userAId]
        );
        const walletAId = walletAResult.insertId;

        // Insert initial KYC record for User A (unverified/pending)
        await db.execute(
            `INSERT INTO kyc_records (user_id, verification_status)
             VALUES (?, 'pending')`,
            [userAId]
        );

        // ----------------------------------------------------
        // Setup User B (with wallet)
        // ----------------------------------------------------
        console.log('--- Setting Up Test User B ---');
        const [userBResult] = await db.execute(
            `INSERT INTO users (full_name, email, phone, password_hash, email_verified_at, status)
             VALUES (?, ?, ?, ?, NOW(), 'active')`,
            ['User Beta', userBEmail, userBPhone, passwordHash]
        );
        const userBId = userBResult.insertId;

        const [walletBResult] = await db.execute(
            `INSERT INTO wallets (user_id, currency, available_balance, status)
             VALUES (?, 'INR', 1500.0000, 'active')`,
            [userBId]
        );
        const walletBId = walletBResult.insertId;

        // ----------------------------------------------------
        // Setup User C (WITHOUT wallet, for missing wallet tests)
        // ----------------------------------------------------
        console.log('--- Setting Up Test User C (No Wallet) ---');
        const userCEmail = `wallet_test_c_${timestamp}@example.com`;
        const userCPhone = `96${String(timestamp).slice(-8)}`;
        const [userCResult] = await db.execute(
            `INSERT INTO users (full_name, email, phone, password_hash, email_verified_at, status)
             VALUES (?, ?, ?, ?, NOW(), 'active')`,
            ['User NoWallet', userCEmail, userCPhone, passwordHash]
        );
        const userCId = userCResult.insertId;

        // ----------------------------------------------------
        // Log in User A, User B, User C to obtain JWT tokens
        // ----------------------------------------------------
        console.log('--- Authenticating Test Users ---');
        const loginARes = await apiRequest('POST', '/auth/login', {
            identifier: userAEmail,
            password: testPassword
        });
        assert(loginARes.status === 200, 'User A login returned 200 OK');
        const tokenA = loginARes.data.token || loginARes.data.accessToken || loginARes.data.data?.token || loginARes.data.data?.accessToken;
        assert(Boolean(tokenA), 'User A received valid JWT token');

        const loginBRes = await apiRequest('POST', '/auth/login', {
            identifier: userBEmail,
            password: testPassword
        });
        const tokenB = loginBRes.data.token || loginBRes.data.accessToken || loginBRes.data.data?.token || loginBRes.data.data?.accessToken;
        assert(Boolean(tokenB), 'User B received valid JWT token');

        const loginCRes = await apiRequest('POST', '/auth/login', {
            identifier: userCEmail,
            password: testPassword
        });
        const tokenC = loginCRes.data.token || loginCRes.data.accessToken || loginCRes.data.data?.token || loginCRes.data.data?.accessToken;
        assert(Boolean(tokenC), 'User C (no wallet) received valid JWT token');

        // ====================================================
        // TEST 1: GET /api/wallet (Wallet Overview - Initial / Empty Ledger)
        // ====================================================
        console.log('\n--- 1. Testing GET /api/wallet (Wallet Overview) ---');
        
        // 1.1 Success case
        const overviewRes = await apiRequest('GET', '/api/wallet', null, tokenA);
        assert(overviewRes.status === 200, 'GET /api/wallet returns 200 OK');
        assert(overviewRes.data.success === true, 'Response success is true');
        assert(overviewRes.data.data.walletId === walletAId, 'Wallet ID matches User A wallet');
        assert(overviewRes.data.data.userId === userAId, 'User ID matches User A');
        assert(overviewRes.data.data.availableBalance === 5000, 'Available balance matches 5000.00');
        assert(overviewRes.data.data.currency === 'INR', 'Currency is INR');
        assert(overviewRes.data.data.status === 'active', 'Wallet status is active');
        assert(overviewRes.data.data.stats.totalTransactions === 0, 'Total transactions is 0 initially');

        // 1.2 Also test alternative mount paths
        const overviewV1 = await apiRequest('GET', '/api/v1/wallet', null, tokenA);
        assert(overviewV1.status === 200, 'GET /api/v1/wallet also returns 200 OK');

        // 1.3 Missing token -> 401
        const unauthOverview = await apiRequest('GET', '/api/wallet');
        assert(unauthOverview.status === 401, 'GET /api/wallet without token returns 401 Unauthorized');

        // 1.4 Invalid token -> 401
        const invalidTokenRes = await apiRequest('GET', '/api/wallet', null, 'invalid.jwt.token');
        assert(invalidTokenRes.status === 401, 'GET /api/wallet with invalid token returns 401');

        // 1.5 User without wallet -> 404
        const noWalletOverview = await apiRequest('GET', '/api/wallet', null, tokenC);
        assert(noWalletOverview.status === 404, 'GET /api/wallet for user without wallet returns 404 Not Found');
        assert(noWalletOverview.data.message.includes('Wallet not found'), 'Returns clean wallet not found message');

        // ====================================================
        // TEST 2: GET /api/wallet/balance (Available Balance)
        // ====================================================
        console.log('\n--- 2. Testing GET /api/wallet/balance (Wallet Balance) ---');

        // 2.1 User A balance
        const balanceResA = await apiRequest('GET', '/api/wallet/balance', null, tokenA);
        assert(balanceResA.status === 200, 'GET /api/wallet/balance returns 200 OK');
        assert(balanceResA.data.data.availableBalance === 5000, 'User A balance is 5000.00');
        assert(balanceResA.data.data.formattedBalance === '₹5,000.00', 'Formatted balance is ₹5,000.00');
        assert(balanceResA.data.data.currency === 'INR', 'Currency is INR');

        // 2.2 User B balance (Data Isolation check)
        const balanceResB = await apiRequest('GET', '/api/wallet/balance', null, tokenB);
        assert(balanceResB.status === 200, 'GET /api/wallet/balance for User B returns 200 OK');
        assert(balanceResB.data.data.availableBalance === 1500, 'User B balance is 1500.00 (Isolated from User A)');

        // 2.3 User without wallet -> 404
        const noWalletBalance = await apiRequest('GET', '/api/wallet/balance', null, tokenC);
        assert(noWalletBalance.status === 404, 'GET /api/wallet/balance for user without wallet returns 404');

        // 2.4 Unauthorized access -> 401
        const unauthBalance = await apiRequest('GET', '/api/wallet/balance');
        assert(unauthBalance.status === 401, 'GET /api/wallet/balance without token returns 401');

        // ====================================================
        // SEED SAMPLE LEDGER ENTRIES FOR USER A
        // ====================================================
        console.log('\n--- Seeding Sample Debit and Credit Ledger Records for User A ---');
        // Ledger Transaction 1: Add Money (Credit 5000)
        const [lt1] = await db.execute(
            `INSERT INTO ledger_transactions (reference_type, reference_id, transaction_type, status, description)
             VALUES ('deposit', 101, 'wallet_topup', 'completed', 'Bank account load to wallet')`
        );
        const lt1Id = lt1.insertId;
        await db.execute(
            `INSERT INTO ledger_entries (ledger_transaction_id, wallet_id, entry_type, amount, created_at)
             VALUES (?, ?, 'credit', 5000.0000, NOW() - INTERVAL 2 HOUR)`,
            [lt1Id, walletAId]
        );

        // Ledger Transaction 2: Merchant Payment (Debit 1200)
        const [lt2] = await db.execute(
            `INSERT INTO ledger_transactions (reference_type, reference_id, transaction_type, status, description)
             VALUES ('payment', 102, 'merchant_payment', 'completed', 'Paid for electronics purchase')`
        );
        const lt2Id = lt2.insertId;
        await db.execute(
            `INSERT INTO ledger_entries (ledger_transaction_id, wallet_id, entry_type, amount, created_at)
             VALUES (?, ?, 'debit', 1200.0000, NOW() - INTERVAL 1 HOUR)`,
            [lt2Id, walletAId]
        );

        // Ledger Transaction 3: P2P Transfer (Debit 800)
        const [lt3] = await db.execute(
            `INSERT INTO ledger_transactions (reference_type, reference_id, transaction_type, status, description)
             VALUES ('transfer', 103, 'p2p_transfer', 'completed', 'Sent to Friend via UPI')`
        );
        const lt3Id = lt3.insertId;
        await db.execute(
            `INSERT INTO ledger_entries (ledger_transaction_id, wallet_id, entry_type, amount, created_at)
             VALUES (?, ?, 'debit', 800.0000, NOW() - INTERVAL 30 MINUTE)`,
            [lt3Id, walletAId]
        );

        // Ledger Transaction 4: Cashback Reward (Credit 50)
        const [lt4] = await db.execute(
            `INSERT INTO ledger_transactions (reference_type, reference_id, transaction_type, status, description)
             VALUES ('reward', 104, 'cashback', 'completed', 'Festive Offer Cashback')`
        );
        const lt4Id = lt4.insertId;
        await db.execute(
            `INSERT INTO ledger_entries (ledger_transaction_id, wallet_id, entry_type, amount, created_at)
             VALUES (?, ?, 'credit', 50.0000, NOW())`,
            [lt4Id, walletAId]
        );

        // User B has 1 separate ledger entry
        const [ltB] = await db.execute(
            `INSERT INTO ledger_transactions (reference_type, reference_id, transaction_type, status, description)
             VALUES ('deposit', 201, 'wallet_topup', 'completed', 'User B Personal Deposit')`
        );
        await db.execute(
            `INSERT INTO ledger_entries (ledger_transaction_id, wallet_id, entry_type, amount, created_at)
             VALUES (?, ?, 'credit', 1500.0000, NOW())`,
            [ltB.insertId, walletBId]
        );

        // ====================================================
        // TEST 3: GET /api/wallet/ledger (Ledger Entries)
        // ====================================================
        console.log('\n--- 3. Testing GET /api/wallet/ledger (Ledger Entries & Pagination) ---');

        // 3.1 All entries for User A (should be 4 entries)
        const ledgerAll = await apiRequest('GET', '/api/wallet/ledger', null, tokenA);
        assert(ledgerAll.status === 200, 'GET /api/wallet/ledger returns 200 OK');
        assert(ledgerAll.data.data.pagination.totalRecords === 4, 'Total records count is 4');
        assert(ledgerAll.data.data.records.length === 4, 'Returned 4 records in page');
        assert(ledgerAll.data.data.records[0].description === 'Festive Offer Cashback', 'Entries ordered newest first by default');

        // 3.2 Filter by credit only
        const ledgerCredits = await apiRequest('GET', '/api/wallet/ledger?type=credit', null, tokenA);
        assert(ledgerCredits.status === 200, 'GET /api/wallet/ledger?type=credit returns 200');
        assert(ledgerCredits.data.data.pagination.totalRecords === 2, 'Exactly 2 credit records found');
        assert(ledgerCredits.data.data.records.every(r => r.entryType === 'credit'), 'All returned entries are type credit');

        // 3.3 Filter by debit only
        const ledgerDebits = await apiRequest('GET', '/api/wallet/ledger?type=debit', null, tokenA);
        assert(ledgerDebits.status === 200, 'GET /api/wallet/ledger?type=debit returns 200');
        assert(ledgerDebits.data.data.pagination.totalRecords === 2, 'Exactly 2 debit records found');
        assert(ledgerDebits.data.data.records.every(r => r.entryType === 'debit'), 'All returned entries are type debit');

        // 3.4 Pagination testing (page 1 limit 2)
        const page1 = await apiRequest('GET', '/api/wallet/ledger?page=1&limit=2', null, tokenA);
        assert(page1.data.data.records.length === 2, 'Page 1 contains 2 items');
        assert(page1.data.data.pagination.page === 1, 'Page number is 1');
        assert(page1.data.data.pagination.totalPages === 2, 'Total pages is 2');
        assert(page1.data.data.pagination.hasNextPage === true, 'Has next page is true');
        assert(page1.data.data.pagination.hasPrevPage === false, 'Has prev page is false');

        // 3.5 Pagination testing (page 2 limit 2)
        const page2 = await apiRequest('GET', '/api/wallet/ledger?page=2&limit=2', null, tokenA);
        assert(page2.data.data.records.length === 2, 'Page 2 contains 2 items');
        assert(page2.data.data.pagination.page === 2, 'Page number is 2');
        assert(page2.data.data.pagination.hasNextPage === false, 'Has next page is false on last page');
        assert(page2.data.data.pagination.hasPrevPage === true, 'Has prev page is true on page 2');

        // 3.6 Data Isolation check: User B sees only User B entries
        const ledgerUserB = await apiRequest('GET', '/api/wallet/ledger', null, tokenB);
        assert(ledgerUserB.status === 200, 'User B ledger returns 200 OK');
        assert(ledgerUserB.data.data.pagination.totalRecords === 1, 'User B sees only 1 record (isolated from User A)');
        assert(ledgerUserB.data.data.records[0].description === 'User B Personal Deposit', 'User B sees only their own deposit');

        // 3.7 Invalid entry type parameter -> 400
        const invalidTypeRes = await apiRequest('GET', '/api/wallet/ledger?type=invalid_type', null, tokenA);
        assert(invalidTypeRes.status === 400, 'Invalid entry type filter returns 400 Bad Request');

        // 3.8 Invalid date format -> 400
        const invalidDateRes = await apiRequest('GET', '/api/wallet/ledger?startDate=not-a-date', null, tokenA);
        assert(invalidDateRes.status === 400, 'Invalid date filter returns 400 Bad Request');

        // 3.9 User without wallet -> 404
        const noWalletLedger = await apiRequest('GET', '/api/wallet/ledger', null, tokenC);
        assert(noWalletLedger.status === 404, 'GET /api/wallet/ledger for user without wallet returns 404');

        // ====================================================
        // TEST 4: GET /api/wallet/summary (Financial Summary)
        // ====================================================
        console.log('\n--- 4. Testing GET /api/wallet/summary (Financial Summary) ---');

        // 4.1 Lifetime summary
        const summaryRes = await apiRequest('GET', '/api/wallet/summary', null, tokenA);
        assert(summaryRes.status === 200, 'GET /api/wallet/summary returns 200 OK');
        assert(summaryRes.data.data.availableBalance === 5000, 'Available balance is 5000');
        assert(summaryRes.data.data.lifetime.totalCredit === 5050, 'Lifetime total credit is 5050 (5000 + 50)');
        assert(summaryRes.data.data.lifetime.totalDebit === 2000, 'Lifetime total debit is 2000 (1200 + 800)');
        assert(summaryRes.data.data.lifetime.netFlow === 3050, 'Lifetime net flow is 3050 (5050 - 2000)');
        assert(summaryRes.data.data.lifetime.totalTransactions === 4, 'Lifetime total transactions is 4');
        assert(summaryRes.data.data.lifetime.creditCount === 2, 'Lifetime credit count is 2');
        assert(summaryRes.data.data.lifetime.debitCount === 2, 'Lifetime debit count is 2');
        assert(summaryRes.data.data.lastTransaction !== null, 'Last transaction object is populated');
        assert(summaryRes.data.data.lastTransaction.description === 'Festive Offer Cashback', 'Last transaction matches latest seeded entry');

        // 4.2 Period summary (period=today)
        const summaryToday = await apiRequest('GET', '/api/wallet/summary?period=today', null, tokenA);
        assert(summaryToday.status === 200, 'GET /api/wallet/summary?period=today returns 200');
        assert(summaryToday.data.data.periodSummary !== undefined, 'periodSummary is present');
        assert(summaryToday.data.data.periodSummary.credit === 5050, 'Today credit matches 5050');
        assert(summaryToday.data.data.periodSummary.debit === 2000, 'Today debit matches 2000');

        // 4.3 Invalid period -> 400
        const invalidPeriod = await apiRequest('GET', '/api/wallet/summary?period=invalid_period', null, tokenA);
        assert(invalidPeriod.status === 400, 'GET /api/wallet/summary with invalid period returns 400');

        // 4.4 User without wallet -> 404
        const noWalletSummary = await apiRequest('GET', '/api/wallet/summary', null, tokenC);
        assert(noWalletSummary.status === 404, 'GET /api/wallet/summary for user without wallet returns 404');

        // ====================================================
        // TEST 5: GET /api/wallet/limits (Transaction Limits)
        // ====================================================
        console.log('\n--- 5. Testing GET /api/wallet/limits (Transaction Limits & KYC Tiers) ---');

        // 5.1 Basic / Minimum KYC Limits (User A is pending KYC)
        const limitsBasic = await apiRequest('GET', '/api/wallet/limits', null, tokenA);
        assert(limitsBasic.status === 200, 'GET /api/wallet/limits returns 200 OK');
        assert(limitsBasic.data.data.walletTier === 'Minimum KYC', 'Wallet tier is Minimum KYC');
        assert(limitsBasic.data.data.maxBalance === 10000, 'Max balance for Minimum KYC is 10,000');
        assert(limitsBasic.data.data.limits.perTransactionLimit === 10000, 'Per transaction limit is 10,000');
        assert(limitsBasic.data.data.limits.dailyLimit === 20000, 'Daily limit is 20,000');
        assert(limitsBasic.data.data.limits.monthlyLimit === 50000, 'Monthly limit is 50,000');
        assert(limitsBasic.data.data.utilization.dailySpent === 2000, 'Daily spent is 2000 (1200 + 800 debits today)');
        assert(limitsBasic.data.data.utilization.dailyRemaining === 18000, 'Daily remaining is 18000 (20000 - 2000)');
        assert(limitsBasic.data.data.utilization.monthlySpent === 2000, 'Monthly spent is 2000');
        assert(limitsBasic.data.data.utilization.monthlyRemaining === 48000, 'Monthly remaining is 48000 (50000 - 2000)');
        assert(limitsBasic.data.data.walletCapacityRemaining === 5000, 'Wallet capacity remaining is 5000 (10000 - 5000 balance)');

        // 5.2 Upgrade User A to Full KYC (verified) and re-check limits
        console.log('--- Upgrading User A to Full KYC ---');
        await db.execute(
            `UPDATE kyc_records SET verification_status = 'verified', verified_at = NOW() WHERE user_id = ?`,
            [userAId]
        );

        const limitsFullKyc = await apiRequest('GET', '/api/wallet/limits', null, tokenA);
        assert(limitsFullKyc.status === 200, 'GET /api/wallet/limits after KYC verification returns 200');
        assert(limitsFullKyc.data.data.kycStatus === 'verified', 'KYC status is verified');
        assert(limitsFullKyc.data.data.walletTier === 'Full KYC', 'Wallet tier upgraded to Full KYC');
        assert(limitsFullKyc.data.data.maxBalance === 200000, 'Max balance upgraded to 2,00,000');
        assert(limitsFullKyc.data.data.limits.perTransactionLimit === 100000, 'Per transaction limit upgraded to 1,00,000');
        assert(limitsFullKyc.data.data.limits.dailyLimit === 200000, 'Daily limit upgraded to 2,00,000');
        assert(limitsFullKyc.data.data.limits.monthlyLimit === 500000, 'Monthly limit upgraded to 5,00,000');
        assert(limitsFullKyc.data.data.utilization.dailyRemaining === 198000, 'Daily remaining is 198000 (200000 - 2000)');
        assert(limitsFullKyc.data.data.walletCapacityRemaining === 195000, 'Wallet capacity remaining is 195000 (200000 - 5000)');

        // 5.3 User without wallet -> 404
        const noWalletLimits = await apiRequest('GET', '/api/wallet/limits', null, tokenC);
        assert(noWalletLimits.status === 404, 'GET /api/wallet/limits for user without wallet returns 404');

        // 5.4 Unauthorized -> 401
        const unauthLimits = await apiRequest('GET', '/api/wallet/limits');
        assert(unauthLimits.status === 401, 'GET /api/wallet/limits without token returns 401');

        // ====================================================
        // CLEANUP
        // ====================================================
        console.log('\n--- Cleaning up test records ---');
        await db.execute('DELETE FROM ledger_entries WHERE wallet_id IN (?, ?)', [walletAId, walletBId]);
        await db.execute('DELETE FROM ledger_transactions WHERE id IN (?, ?, ?, ?, ?)', [lt1Id, lt2Id, lt3Id, lt4Id, ltB.insertId]);
        await db.execute('DELETE FROM kyc_records WHERE user_id IN (?, ?, ?)', [userAId, userBId, userCId]);
        await db.execute('DELETE FROM wallets WHERE user_id IN (?, ?, ?)', [userAId, userBId, userCId]);
        await db.execute('DELETE FROM sessions WHERE user_id IN (?, ?, ?)', [userAId, userBId, userCId]);
        await db.execute('DELETE FROM users WHERE id IN (?, ?, ?)', [userAId, userBId, userCId]);

        console.log('\n========================================================');
        console.log(`TEST RESULTS: ${passedTests} OF ${totalTests} TESTS PASSED (100%)`);
        console.log('ALL 5 WALLET & LEDGER APIs VERIFIED SUCCESSFULLY!');
        console.log('========================================================\n');

        if (server) server.close();
        process.exit(0);

    } catch (err) {
        console.error('\n❌ Test Suite Aborted with Error:', err);
        if (server) server.close();
        process.exit(1);
    }
}

runWalletTests();
