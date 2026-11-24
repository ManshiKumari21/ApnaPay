require('dotenv').config({ path: __dirname + '/../.env' });
const http = require('http');
const db = require('../config/db');
const app = require('../app');
const bcrypt = require('bcrypt');

const PORT = 5005;
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

async function runTransactionTests() {
    console.log('========================================================');
    console.log('RUNNING COMPREHENSIVE TRANSACTION HISTORY API TEST SUITE');
    console.log('========================================================\n');

    try {
        // Start test server on dedicated port 5005
        server = http.createServer(app);
        await new Promise((resolve) => server.listen(PORT, resolve));
        baseUrl = `http://127.0.0.1:${PORT}`;
        console.log(`Test server running at ${baseUrl}\n`);

        const timestamp = Date.now();
        const userAEmail = `txn_test_a_${timestamp}@example.com`;
        const userAPhone = `98${String(timestamp).slice(-8)}`;
        const userBEmail = `txn_test_b_${timestamp}@example.com`;
        const userBPhone = `97${String(timestamp).slice(-8)}`;
        const testPassword = 'TxnTest@123456';
        const passwordHash = await bcrypt.hash(testPassword, 10);

        // Pre-clean any leftover test records from previous test runs
        await db.execute('DELETE FROM transactions WHERE user_id IN (SELECT id FROM users WHERE email LIKE "txn_test_%")');
        await db.execute('DELETE FROM transfers WHERE sender_user_id IN (SELECT id FROM users WHERE email LIKE "txn_test_%") OR receiver_user_id IN (SELECT id FROM users WHERE email LIKE "txn_test_%")');
        await db.execute('DELETE FROM payments WHERE user_id IN (SELECT id FROM users WHERE email LIKE "txn_test_%")');
        await db.execute('DELETE FROM bank_accounts WHERE user_id IN (SELECT id FROM users WHERE email LIKE "txn_test_%")');
        await db.execute('DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE "txn_test_%")');
        await db.execute('DELETE FROM users WHERE email LIKE "txn_test_%"');

        // ----------------------------------------------------
        // Setup User A
        // ----------------------------------------------------
        console.log('--- Setting Up Test User A ---');
        const [userAResult] = await db.execute(
            `INSERT INTO users (full_name, email, phone, password_hash, email_verified_at, status)
             VALUES (?, ?, ?, ?, NOW(), 'active')`,
            ['Aarav Sharma', userAEmail, userAPhone, passwordHash]
        );
        const userAId = userAResult.insertId;

        // User A Bank Account
        const [bankAResult] = await db.execute(
            `INSERT INTO bank_accounts (user_id, bank_name, account_number_encrypted, account_last4, ifsc_code, account_holder_name, is_primary, status)
             VALUES (?, 'HDFC Bank', 0x123456, '4321', 'HDFC0001234', 'Aarav Sharma', 1, 'active')`,
            [userAId]
        );
        const bankAId = bankAResult.insertId;

        // ----------------------------------------------------
        // Setup User B
        // ----------------------------------------------------
        console.log('--- Setting Up Test User B ---');
        const [userBResult] = await db.execute(
            `INSERT INTO users (full_name, email, phone, password_hash, email_verified_at, status)
             VALUES (?, ?, ?, ?, NOW(), 'active')`,
            ['Priya Patel', userBEmail, userBPhone, passwordHash]
        );
        const userBId = userBResult.insertId;

        // ----------------------------------------------------
        // Authenticate Users to get JWT tokens
        // ----------------------------------------------------
        console.log('--- Authenticating Test Users ---');
        const loginARes = await apiRequest('POST', '/auth/login', {
            identifier: userAEmail,
            password: testPassword
        });
        assert(loginARes.status === 200, 'User A logged in successfully');
        const tokenA = loginARes.data.token || loginARes.data.accessToken || loginARes.data.data?.token || loginARes.data.data?.accessToken;
        assert(Boolean(tokenA), 'User A received valid JWT token');

        const loginBRes = await apiRequest('POST', '/auth/login', {
            identifier: userBEmail,
            password: testPassword
        });
        assert(loginBRes.status === 200, 'User B logged in successfully');
        const tokenB = loginBRes.data.token || loginBRes.data.accessToken || loginBRes.data.data?.token || loginBRes.data.data?.accessToken;
        assert(Boolean(tokenB), 'User B received valid JWT token');

        // ====================================================
        // TEST 1: GET /api/transactions (Initial Empty State & Auth)
        // ====================================================
        console.log('\n--- 1. Testing GET /api/transactions (Initial Empty & Auth Checks) ---');
        
        // 1.1 Initially empty
        const initialRes = await apiRequest('GET', '/api/transactions', null, tokenA);
        assert(initialRes.status === 200, 'GET /api/transactions returns 200 OK');
        assert(initialRes.data.success === true, 'Response success is true');
        assert(initialRes.data.data.pagination.totalRecords === 0, 'Initial total records is 0');
        assert(Array.isArray(initialRes.data.data.transactions), 'transactions is an array');
        assert(initialRes.data.data.transactions.length === 0, 'transactions array is empty');

        // 1.2 Mount path /api/v1/transactions check
        const v1Res = await apiRequest('GET', '/api/v1/transactions', null, tokenA);
        assert(v1Res.status === 200, 'GET /api/v1/transactions also returns 200 OK');

        // 1.3 Missing token -> 401
        const unauthRes = await apiRequest('GET', '/api/transactions');
        assert(unauthRes.status === 401, 'GET /api/transactions without token returns 401');

        // 1.4 Invalid token -> 401
        const invalidTokenRes = await apiRequest('GET', '/api/transactions', null, 'bad.jwt.token');
        assert(invalidTokenRes.status === 401, 'GET /api/transactions with invalid token returns 401');

        // ====================================================
        // SEED TRANSACTIONS FOR USER A AND USER B
        // ====================================================
        console.log('\n--- Seeding Test Transactions for User A and User B ---');
        // Payment 1: User A Salary Credit (50000.00) - Completed
        const [p1] = await db.execute(
            `INSERT INTO payments (public_id, user_id, bank_account_id, payment_method, amount, currency, status, provider_reference, description, created_at)
             VALUES ('pay_sal_001', ?, ?, 'bank_transfer', 50000.0000, 'INR', 'completed', 'SALARY-NOV-2026', 'Monthly Salary Credit', NOW() - INTERVAL 4 DAY)`,
            [userAId, bankAId]
        );
        const [t1] = await db.execute(
            `INSERT INTO transactions (user_id, payment_id, transaction_type, amount, status, description, created_at)
             VALUES (?, ?, 'salary_credit', 50000.0000, 'completed', 'Monthly Salary Credit', NOW() - INTERVAL 4 DAY)`,
            [userAId, p1.insertId]
        );
        const t1Id = t1.insertId;

        // Payment 2: User A Merchant Payment (3200.00) - Completed
        const [p2] = await db.execute(
            `INSERT INTO payments (public_id, user_id, payment_method, amount, currency, status, provider_reference, description, created_at)
             VALUES ('pay_mer_002', ?, 'upi', 3200.0000, 'INR', 'completed', 'PG_AMAZON_9921', 'Amazon Electronics Purchase', NOW() - INTERVAL 3 DAY)`,
            [userAId]
        );
        const [t2] = await db.execute(
            `INSERT INTO transactions (user_id, payment_id, transaction_type, amount, status, description, created_at)
             VALUES (?, ?, 'payment', 3200.0000, 'completed', 'Amazon Electronics Purchase', NOW() - INTERVAL 3 DAY)`,
            [userAId, p2.insertId]
        );
        const t2Id = t2.insertId;

        // Payment 3 & Transfer: User A to User B Transfer (1500.00) - Completed
        const [p3] = await db.execute(
            `INSERT INTO payments (public_id, user_id, payment_method, amount, currency, status, provider_reference, description, created_at)
             VALUES ('pay_trf_003', ?, 'upi', 1500.0000, 'INR', 'completed', 'UPI_TRF_7718', 'Dinner split with Priya', NOW() - INTERVAL 2 DAY)`,
            [userAId]
        );
        const [tr1] = await db.execute(
            `INSERT INTO transfers (payment_id, sender_user_id, receiver_user_id, receiver_upi_id, amount, status, created_at)
             VALUES (?, ?, ?, 'priya@apnapay', 1500.0000, 'completed', NOW() - INTERVAL 2 DAY)`,
            [p3.insertId, userAId, userBId]
        );
        const [t3] = await db.execute(
            `INSERT INTO transactions (user_id, payment_id, transfer_id, transaction_type, amount, status, description, created_at)
             VALUES (?, ?, ?, 'p2p_transfer', 1500.0000, 'completed', 'Dinner split with Priya', NOW() - INTERVAL 2 DAY)`,
            [userAId, p3.insertId, tr1.insertId]
        );
        const t3Id = t3.insertId;

        // Payment 4: User A Pending Bill Payment (750.00) - Pending
        const [p4] = await db.execute(
            `INSERT INTO payments (public_id, user_id, payment_method, amount, currency, status, provider_reference, description, created_at)
             VALUES ('pay_bill_004', ?, 'netbanking', 750.0000, 'INR', 'pending', 'BILL_ELEC_112', 'Electricity Bill Payment', NOW() - INTERVAL 1 DAY)`,
            [userAId]
        );
        const [t4] = await db.execute(
            `INSERT INTO transactions (user_id, payment_id, transaction_type, amount, status, description, created_at)
             VALUES (?, ?, 'bill_payment', 750.0000, 'pending', 'Electricity Bill Payment', NOW() - INTERVAL 1 DAY)`,
            [userAId, p4.insertId]
        );
        const t4Id = t4.insertId;

        // Payment 5: User A Failed Recharge (299.00) - Failed (Yesterday)
        const [p5] = await db.execute(
            `INSERT INTO payments (public_id, user_id, payment_method, amount, currency, status, provider_reference, description, created_at)
             VALUES ('pay_rch_005', ?, 'upi', 299.0000, 'INR', 'failed', 'TEL_AIRTEL_991', 'Mobile Recharge Failed', NOW() - INTERVAL 30 HOUR)`,
            [userAId]
        );
        const [t5] = await db.execute(
            `INSERT INTO transactions (user_id, payment_id, transaction_type, amount, status, description, created_at)
             VALUES (?, ?, 'mobile_recharge', 299.0000, 'failed', 'Mobile Recharge Failed', NOW() - INTERVAL 30 HOUR)`,
            [userAId, p5.insertId]
        );
        const t5Id = t5.insertId;

        // Payment 6: User A Cashback Credit (50.00) - Completed
        const [p6] = await db.execute(
            `INSERT INTO payments (public_id, user_id, payment_method, amount, currency, status, provider_reference, description, created_at)
             VALUES ('pay_rew_006', ?, 'wallet', 50.0000, 'INR', 'completed', 'REW_CASHBACK_1', 'Festive Reward Cashback', NOW())`,
            [userAId]
        );
        const [t6] = await db.execute(
            `INSERT INTO transactions (user_id, payment_id, transaction_type, amount, status, description, created_at)
             VALUES (?, ?, 'cashback', 50.0000, 'completed', 'Festive Reward Cashback', NOW())`,
            [userAId, p6.insertId]
        );
        const t6Id = t6.insertId;

        // User B has 1 distinct transaction (Deposit 10000.00)
        const [pB] = await db.execute(
            `INSERT INTO payments (public_id, user_id, payment_method, amount, currency, status, provider_reference, description, created_at)
             VALUES ('pay_usr_b_01', ?, 'upi', 10000.0000, 'INR', 'completed', 'UPI_DEP_9999', 'User B Bank Load', NOW())`,
            [userBId]
        );
        const [tB] = await db.execute(
            `INSERT INTO transactions (user_id, payment_id, transaction_type, amount, status, description, created_at)
             VALUES (?, ?, 'deposit', 10000.0000, 'completed', 'User B Bank Load', NOW())`,
            [userBId, pB.insertId]
        );
        const tBId = tB.insertId;

        // ====================================================
        // TEST 2: GET /api/transactions (Listing, Pagination, Filtering, Search)
        // ====================================================
        console.log('\n--- 2. Testing GET /api/transactions (Listing & Filters) ---');

        // 2.1 Fetch list for User A (6 transactions total)
        const listRes = await apiRequest('GET', '/api/transactions', null, tokenA);
        assert(listRes.status === 200, 'User A transactions list returns 200 OK');
        assert(listRes.data.data.pagination.totalRecords === 6, 'Total transactions count is 6');
        assert(listRes.data.data.transactions.length === 6, 'Returned 6 transactions');
        assert(listRes.data.data.transactions[0].id === t6Id, 'Transactions sorted newest first (t6 is first)');

        // 2.2 Pagination: page 1 limit 3
        const page1Res = await apiRequest('GET', '/api/transactions?page=1&limit=3', null, tokenA);
        assert(page1Res.data.data.transactions.length === 3, 'Page 1 has 3 transactions');
        assert(page1Res.data.data.pagination.page === 1, 'Page number is 1');
        assert(page1Res.data.data.pagination.limit === 3, 'Limit is 3');
        assert(page1Res.data.data.pagination.totalPages === 2, 'Total pages is 2');
        assert(page1Res.data.data.pagination.hasNextPage === true, 'Has next page is true');
        assert(page1Res.data.data.pagination.hasPrevPage === false, 'Has prev page is false');

        // 2.3 Pagination: page 2 limit 3
        const page2Res = await apiRequest('GET', '/api/transactions?page=2&limit=3', null, tokenA);
        assert(page2Res.data.data.transactions.length === 3, 'Page 2 has 3 transactions');
        assert(page2Res.data.data.pagination.page === 2, 'Page number is 2');
        assert(page2Res.data.data.pagination.hasNextPage === false, 'Has next page is false on last page');
        assert(page2Res.data.data.pagination.hasPrevPage === true, 'Has prev page is true on page 2');

        // 2.4 Filter by type: credit
        const creditFilterRes = await apiRequest('GET', '/api/transactions?type=credit', null, tokenA);
        assert(creditFilterRes.status === 200, 'Filter by type=credit returns 200 OK');
        assert(creditFilterRes.data.data.transactions.every(t => t.entryType === 'credit'), 'All returned transactions are credit');
        assert(creditFilterRes.data.data.transactions.length === 2, 'Found exactly 2 credit transactions (salary & cashback)');

        // 2.5 Filter by type: debit
        const debitFilterRes = await apiRequest('GET', '/api/transactions?type=debit', null, tokenA);
        assert(debitFilterRes.status === 200, 'Filter by type=debit returns 200 OK');
        assert(debitFilterRes.data.data.transactions.every(t => t.entryType === 'debit'), 'All returned transactions are debit');
        assert(debitFilterRes.data.data.transactions.length === 4, 'Found exactly 4 debit transactions');

        // 2.6 Filter by status: completed
        const completedRes = await apiRequest('GET', '/api/transactions?status=completed', null, tokenA);
        assert(completedRes.data.data.transactions.every(t => t.status === 'completed'), 'All returned transactions have status completed');
        assert(completedRes.data.data.transactions.length === 4, 'Found exactly 4 completed transactions');

        // 2.7 Filter by status: pending
        const pendingRes = await apiRequest('GET', '/api/transactions?status=pending', null, tokenA);
        assert(pendingRes.data.data.transactions.length === 1, 'Found exactly 1 pending transaction');
        assert(pendingRes.data.data.transactions[0].description === 'Electricity Bill Payment', 'Pending is electricity bill');

        // 2.8 Filter by status: failed
        const failedRes = await apiRequest('GET', '/api/transactions?status=failed', null, tokenA);
        assert(failedRes.data.data.transactions.length === 1, 'Found exactly 1 failed transaction');
        assert(failedRes.data.data.transactions[0].description === 'Mobile Recharge Failed', 'Failed is mobile recharge');

        // 2.9 Search by Reference ID
        const searchRefRes = await apiRequest('GET', '/api/transactions?search=AMAZON', null, tokenA);
        assert(searchRefRes.data.data.transactions.length === 1, 'Search by AMAZON returns 1 transaction');
        assert(searchRefRes.data.data.transactions[0].description.includes('Amazon'), 'Matches Amazon purchase');

        // 2.10 Search by Transaction ID
        const searchIdRes = await apiRequest('GET', `/api/transactions?search=${t1Id}`, null, tokenA);
        assert(searchIdRes.data.data.transactions.length === 1, 'Search by specific transaction ID works');
        assert(searchIdRes.data.data.transactions[0].id === t1Id, 'Transaction ID matches');

        // 2.11 Invalid Date Range -> 400
        const badDateRes = await apiRequest('GET', '/api/transactions?startDate=bad-date', null, tokenA);
        assert(badDateRes.status === 400, 'Invalid startDate format returns 400 Bad Request');

        const invertedDateRes = await apiRequest('GET', '/api/transactions?startDate=2026-12-01&endDate=2026-01-01', null, tokenA);
        assert(invertedDateRes.status === 400, 'startDate after endDate returns 400 Bad Request');

        // 2.12 Data Isolation check: User B sees ONLY User B's transaction
        const listUserB = await apiRequest('GET', '/api/transactions', null, tokenB);
        assert(listUserB.status === 200, 'User B list returns 200 OK');
        assert(listUserB.data.data.pagination.totalRecords === 1, 'User B sees only 1 transaction (isolated from User A)');
        assert(listUserB.data.data.transactions[0].id === tBId, 'User B sees only User B transaction');

        // ====================================================
        // TEST 3: GET /api/transactions/:id (Transaction Details)
        // ====================================================
        console.log('\n--- 3. Testing GET /api/transactions/:id (Transaction Details) ---');

        // 3.1 Fetch details of User A's salary transaction (with bank)
        const detailRes1 = await apiRequest('GET', `/api/transactions/${t1Id}`, null, tokenA);
        assert(detailRes1.status === 200, 'GET /api/transactions/:id returns 200 OK');
        assert(detailRes1.data.data.id === t1Id, 'Transaction ID matches');
        assert(detailRes1.data.data.amount === 50000, 'Amount is 50000.00');
        assert(detailRes1.data.data.entryType === 'credit', 'Entry type is credit');
        assert(detailRes1.data.data.status === 'completed', 'Status is completed');
        assert(detailRes1.data.data.paymentMethod === 'bank_transfer', 'Payment method is bank_transfer');
        assert(detailRes1.data.data.bankDetails !== null, 'bankDetails is populated');
        assert(detailRes1.data.data.bankDetails.bankName === 'HDFC Bank', 'Bank name is HDFC Bank');
        assert(detailRes1.data.data.bankDetails.accountLast4 === '4321', 'Account last4 is 4321');

        // 3.2 Fetch details of User A's P2P Transfer (with transferDetails)
        const detailRes3 = await apiRequest('GET', `/api/transactions/${t3Id}`, null, tokenA);
        assert(detailRes3.status === 200, 'P2P transfer details returns 200 OK');
        assert(detailRes3.data.data.transferDetails !== null, 'transferDetails is populated');
        assert(detailRes3.data.data.transferDetails.receiverUpiId === 'priya@apnapay', 'Receiver UPI ID matches');
        assert(detailRes3.data.data.entryType === 'debit', 'Transfer out is debit for sender');

        // 3.3 Invalid ID format -> 400
        const badIdRes = await apiRequest('GET', '/api/transactions/invalid-id-string', null, tokenA);
        assert(badIdRes.status === 400, 'Invalid transaction ID format returns 400 Bad Request');

        // 3.4 Non-existent ID -> 404
        const notFoundRes = await apiRequest('GET', '/api/transactions/99999999', null, tokenA);
        assert(notFoundRes.status === 404, 'Non-existent transaction returns 404 Not Found');

        // 3.5 Cross-user security check: User B tries to access User A's transaction -> 404
        const crossUserRes = await apiRequest('GET', `/api/transactions/${t1Id}`, null, tokenB);
        assert(crossUserRes.status === 404, 'User B cannot access User A transaction (returns 404 Not Found)');

        // 3.6 Unauthorized -> 401
        const unauthDetail = await apiRequest('GET', `/api/transactions/${t1Id}`);
        assert(unauthDetail.status === 401, 'Unauthorized request returns 401');

        // ====================================================
        // TEST 4: GET /api/transactions/summary (Credits & Debits Summary)
        // ====================================================
        console.log('\n--- 4. Testing GET /api/transactions/summary (Summary Calculations) ---');

        // 4.1 Lifetime summary for User A
        // Credits (completed): 50000 (salary) + 50 (cashback) = 50050.00
        // Debits (completed): 3200 (amazon) + 1500 (dinner) = 4700.00
        // Net: 50050 - 4700 = 45350.00
        // Counts: 6 total, 4 completed, 1 pending, 1 failed
        const summaryRes = await apiRequest('GET', '/api/transactions/summary', null, tokenA);
        assert(summaryRes.status === 200, 'GET /api/transactions/summary returns 200 OK');
        assert(summaryRes.data.data.totalCredit === 50050, 'Total credits calculated as 50050.00');
        assert(summaryRes.data.data.totalDebit === 4700, 'Total debits calculated as 4700.00');
        assert(summaryRes.data.data.netAmount === 45350, 'Net flow calculated as 45350.00');
        assert(summaryRes.data.data.formattedTotalCredit === '₹50,050.00', 'Formatted total credit is ₹50,050.00');
        assert(summaryRes.data.data.formattedTotalDebit === '₹4,700.00', 'Formatted total debit is ₹4,700.00');
        assert(summaryRes.data.data.counts.totalTransactions === 6, 'Total transactions count is 6');
        assert(summaryRes.data.data.counts.successfulTransactions === 4, 'Successful count is 4');
        assert(summaryRes.data.data.counts.pendingTransactions === 1, 'Pending count is 1');
        assert(summaryRes.data.data.counts.failedTransactions === 1, 'Failed count is 1');

        // 4.2 Weekly filter: period=weekly
        const weeklyRes = await apiRequest('GET', '/api/transactions/summary?period=weekly', null, tokenA);
        assert(weeklyRes.status === 200, 'Summary period=weekly returns 200');
        assert(weeklyRes.data.data.period === 'Last 7 Days', 'Period label is Last 7 Days');
        assert(weeklyRes.data.data.counts.totalTransactions === 6, 'All 6 transactions occurred within last 7 days');

        // 4.3 Daily filter: period=today (only cashback occurred today)
        const todayRes = await apiRequest('GET', '/api/transactions/summary?period=today', null, tokenA);
        assert(todayRes.status === 200, 'Summary period=today returns 200');
        assert(todayRes.data.data.counts.totalTransactions === 1, 'Today transactions count is 1 (cashback)');
        assert(todayRes.data.data.totalCredit === 50, 'Today credit is 50.00');

        // 4.4 Invalid period -> 400
        const badPeriodRes = await apiRequest('GET', '/api/transactions/summary?period=unknown_period', null, tokenA);
        assert(badPeriodRes.status === 400, 'Invalid period filter returns 400 Bad Request');

        // 4.5 Unauthorized -> 401
        const unauthSummary = await apiRequest('GET', '/api/transactions/summary');
        assert(unauthSummary.status === 401, 'Unauthorized summary returns 401');

        // ====================================================
        // TEST 5: GET /api/transactions/export (CSV & PDF Statement Export)
        // ====================================================
        console.log('\n--- 5. Testing GET /api/transactions/export (CSV & PDF Export) ---');

        // 5.1 CSV Export (default)
        const csvRes = await apiRequest('GET', '/api/transactions/export', null, tokenA);
        assert(csvRes.status === 200, 'Export CSV returns 200 OK');
        assert(csvRes.headers.get('content-type').includes('text/csv'), 'Content-Type is text/csv');
        assert(csvRes.headers.get('content-disposition').includes('attachment'), 'Content-Disposition is attachment');
        assert(csvRes.headers.get('content-disposition').includes('.csv'), 'Filename has .csv extension');
        assert(csvRes.data.includes('Transaction ID'), 'CSV contains header Transaction ID');
        assert(csvRes.data.includes('Monthly Salary Credit'), 'CSV contains salary transaction record');
        assert(csvRes.data.includes('Amazon Electronics Purchase'), 'CSV contains purchase record');
        assert(!csvRes.data.includes('User B Bank Load'), 'CSV DOES NOT contain User B data (isolated)');

        // 5.2 PDF Export (format=pdf)
        const pdfRes = await apiRequest('GET', '/api/transactions/export?format=pdf', null, tokenA);
        assert(pdfRes.status === 200, 'Export PDF returns 200 OK');
        assert(pdfRes.headers.get('content-type').includes('application/pdf'), 'Content-Type is application/pdf');
        assert(pdfRes.headers.get('content-disposition').includes('.pdf'), 'Filename has .pdf extension');
        assert(pdfRes.data.startsWith('%PDF-1.4'), 'PDF document starts with %PDF-1.4 header');
        assert(pdfRes.data.includes('%%EOF'), 'PDF document ends with %%EOF trailer');

        // 5.3 Filtered CSV Export (type=credit)
        const csvCreditRes = await apiRequest('GET', '/api/transactions/export?type=credit', null, tokenA);
        assert(csvCreditRes.status === 200, 'Filtered export returns 200 OK');
        assert(csvCreditRes.data.includes('Monthly Salary Credit'), 'Contains credit entry');
        assert(!csvCreditRes.data.includes('Amazon Electronics Purchase'), 'Excludes debit entry');

        // 5.4 Invalid format -> 400
        const badFormatRes = await apiRequest('GET', '/api/transactions/export?format=exe', null, tokenA);
        assert(badFormatRes.status === 400, 'Invalid format parameter returns 400 Bad Request');

        // 5.5 Unauthorized export -> 401
        const unauthExport = await apiRequest('GET', '/api/transactions/export');
        assert(unauthExport.status === 401, 'Unauthorized export returns 401');

        // ====================================================
        // CLEANUP
        // ====================================================
        console.log('\n--- Cleaning up test records ---');
        await db.execute('DELETE FROM transactions WHERE user_id IN (?, ?)', [userAId, userBId]);
        await db.execute('DELETE FROM transfers WHERE sender_user_id = ? OR receiver_user_id = ?', [userAId, userBId]);
        await db.execute('DELETE FROM payments WHERE user_id IN (?, ?)', [userAId, userBId]);
        await db.execute('DELETE FROM bank_accounts WHERE user_id IN (?, ?)', [userAId, userBId]);
        await db.execute('DELETE FROM sessions WHERE user_id IN (?, ?)', [userAId, userBId]);
        await db.execute('DELETE FROM users WHERE id IN (?, ?)', [userAId, userBId]);

        console.log('\n========================================================');
        console.log(`TEST RESULTS: ${passedTests} OF ${totalTests} TESTS PASSED (100%)`);
        console.log('ALL 4 TRANSACTION HISTORY APIs VERIFIED SUCCESSFULLY!');
        console.log('========================================================\n');

        if (server) server.close();
        process.exit(0);

    } catch (err) {
        console.error('\n❌ Test Suite Aborted with Error:', err);
        if (server) server.close();
        process.exit(1);
    }
}

runTransactionTests();
