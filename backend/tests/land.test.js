require('dotenv').config({ path: __dirname + '/../.env' });
const http = require('http');
const db = require('../config/db');
const app = require('../app');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
}

async function runLandTests() {
    console.log('========================================================');
    console.log('RUNNING COMPREHENSIVE DIGITAL LAND API TEST SUITE');
    console.log('========================================================\n');

    let userAId = null;
    let userBId = null;
    let tokenA = null;
    let tokenB = null;
    let testProjectId = null;
    let createdOrderId = null;
    let createdOrderRef = null;

    try {
        // 1. Start dedicated test server
        server = http.createServer(app);
        await new Promise((resolve) => server.listen(PORT, resolve));
        baseUrl = `http://127.0.0.1:${PORT}`;
        console.log(`Test server running at ${baseUrl}\n`);

        const timestamp = Date.now();
        const userAEmail = `land_test_a_${timestamp}@example.com`;
        const userAPhone = `98${String(timestamp).slice(-8)}`;
        const userBEmail = `land_test_b_${timestamp}@example.com`;
        const userBPhone = `97${String(timestamp).slice(-8)}`;
        const testPassword = 'LandPassword@123';
        const passwordHash = await bcrypt.hash(testPassword, 10);

        // 2. Setup Test Users
        console.log('--- Setting Up Test Users ---');
        const [userARes] = await db.query(
            `INSERT INTO users (full_name, email, phone, password_hash, email_verified_at, status)
             VALUES (?, ?, ?, ?, NOW(), 'active')`,
            ['Land Test User A', userAEmail, userAPhone, passwordHash]
        );
        userAId = userARes.insertId;

        const [userBRes] = await db.query(
            `INSERT INTO users (full_name, email, phone, password_hash, email_verified_at, status)
             VALUES (?, ?, ?, ?, NOW(), 'active')`,
            ['Land Test User B', userBEmail, userBPhone, passwordHash]
        );
        userBId = userBRes.insertId;

        // Create JWT tokens directly
        const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';
        tokenA = jwt.sign({ userId: userAId, email: userAEmail, role: 'customer' }, jwtSecret, { expiresIn: '1h' });
        tokenB = jwt.sign({ userId: userBId, email: userBEmail, role: 'customer' }, jwtSecret, { expiresIn: '1h' });

        console.log(`User A (ID: ${userAId}) and User B (ID: ${userBId}) created with valid JWT tokens.\n`);

        // Check seeded land projects
        const [projects] = await db.query(`SELECT id, project_name, available_units, price_per_unit FROM land_projects WHERE status = 'active' LIMIT 1`);
        if (projects.length === 0) {
            throw new Error('No active land projects found in database. Please run seed script first.');
        }
        testProjectId = projects[0].id;
        console.log(`Using active project ID ${testProjectId} ("${projects[0].project_name}") for order testing.\n`);

        // ==========================================
        // TEST 1: GET /api/land/projects
        // ==========================================
        console.log('--- TEST 1: GET /api/land/projects ---');
        const res1 = await apiRequest('GET', '/api/land/projects');
        assert(res1.status === 200, 'GET /api/land/projects returns 200 OK');
        assert(res1.data.success === true, 'Response has success: true');
        assert(Array.isArray(res1.data.data.projects), 'Returns projects array');
        assert(res1.data.data.projects.length > 0, 'Contains at least 1 project');
        assert(res1.data.data.pagination && res1.data.data.pagination.totalRecords > 0, 'Returns pagination metadata');

        const firstProject = res1.data.data.projects[0];
        assert(typeof firstProject.projectName === 'string', 'Project has projectName');
        assert(typeof firstProject.pricePerUnit === 'number', 'Project has numeric pricePerUnit');
        assert(typeof firstProject.formattedPricePerUnit === 'string', 'Project has formattedPricePerUnit');
        assert(typeof firstProject.availableUnits === 'number', 'Project has availableUnits');

        // Test pagination filter
        const res1Page = await apiRequest('GET', '/api/land/projects?page=1&limit=2');
        assert(res1Page.status === 200, 'GET /api/land/projects with limit=2 returns 200 OK');
        assert(res1Page.data.data.projects.length <= 2, 'Limit constraint respected');

        // Test search filter
        const res1Search = await apiRequest('GET', `/api/land/projects?search=${encodeURIComponent(firstProject.projectName.split(' ')[0])}`);
        assert(res1Search.status === 200, 'Search filter returns 200 OK');
        assert(res1Search.data.data.projects.length >= 1, 'Search finds matching projects');

        // Test /api/v1 alias
        const res1Alias = await apiRequest('GET', '/api/v1/land/projects');
        assert(res1Alias.status === 200, 'GET /api/v1/land/projects alias returns 200 OK');
        console.log('');

        // ==========================================
        // TEST 2: GET /api/land/projects/:id
        // ==========================================
        console.log('--- TEST 2: GET /api/land/projects/:id ---');
        const res2 = await apiRequest('GET', `/api/land/projects/${testProjectId}`);
        assert(res2.status === 200, `GET /api/land/projects/${testProjectId} returns 200 OK`);
        assert(res2.data.success === true, 'Response has success: true');
        assert(res2.data.data.id === testProjectId, 'Returns correct project ID');
        assert(res2.data.data.projectName === projects[0].project_name, 'Returns correct project name');
        assert('latestValuation' in res2.data.data, 'Includes latestValuation property');

        // Non-existent ID (404)
        const res2NotFound = await apiRequest('GET', '/api/land/projects/999999');
        assert(res2NotFound.status === 404, 'Non-existent project ID returns 404');
        assert(res2NotFound.data.success === false, '404 response has success: false');

        // Invalid format ID (400)
        const res2Invalid = await apiRequest('GET', '/api/land/projects/invalid-id');
        assert(res2Invalid.status === 400, 'Non-numeric project ID returns 400');
        console.log('');

        // ==========================================
        // TEST 3: GET /api/land/holdings
        // ==========================================
        console.log('--- TEST 3: GET /api/land/holdings ---');
        // Unauthorized
        const res3Unauth = await apiRequest('GET', '/api/land/holdings');
        assert(res3Unauth.status === 401, 'Unauthorized request without token returns 401');

        // Empty holdings for new User A
        const res3Empty = await apiRequest('GET', '/api/land/holdings', null, tokenA);
        assert(res3Empty.status === 200, 'GET /api/land/holdings returns 200 OK for user with 0 holdings');
        assert(Array.isArray(res3Empty.data.data.holdings) && res3Empty.data.data.holdings.length === 0, 'Holdings is empty array');
        assert(res3Empty.data.data.portfolioSummary.totalHoldings === 0, 'Portfolio totalHoldings is 0');

        // Insert a test holding for User A
        await db.query(
            `INSERT INTO land_holdings (user_id, project_id, units_owned, average_purchase_price, total_invested, status)
             VALUES (?, ?, 2.50, 1500000.00, 3750000.00, 'active')`,
            [userAId, testProjectId]
        );

        const res3UserA = await apiRequest('GET', '/api/land/holdings', null, tokenA);
        assert(res3UserA.status === 200, 'User A holdings retrieved successfully');
        assert(res3UserA.data.data.holdings.length === 1, 'User A has 1 holding');
        assert(res3UserA.data.data.holdings[0].unitsOwned === 2.5, 'Holding units owned is 2.5');
        assert(res3UserA.data.data.portfolioSummary.totalInvested === 3750000, 'Total invested calculated accurately');

        // User B must NOT see User A's holdings
        const res3UserB = await apiRequest('GET', '/api/land/holdings', null, tokenB);
        assert(res3UserB.status === 200, 'User B request succeeds');
        assert(res3UserB.data.data.holdings.length === 0, 'User B sees 0 holdings (Strict Data Isolation)');
        console.log('');

        // ==========================================
        // TEST 4: POST /api/land/orders
        // ==========================================
        console.log('--- TEST 4: POST /api/land/orders ---');
        // Unauthorized
        const res4Unauth = await apiRequest('POST', '/api/land/orders', { projectId: testProjectId, units: 1 });
        assert(res4Unauth.status === 401, 'POST /api/land/orders without token returns 401');

        // Missing project ID
        const res4NoProject = await apiRequest('POST', '/api/land/orders', { units: 1 }, tokenA);
        assert(res4NoProject.status === 400, 'Missing projectId returns 400');

        // Invalid units (<= 0)
        const res4InvalidUnits = await apiRequest('POST', '/api/land/orders', { projectId: testProjectId, units: -5 }, tokenA);
        assert(res4InvalidUnits.status === 400, 'Zero or negative units returns 400');

        // Units exceeding availability
        const res4ExcessUnits = await apiRequest('POST', '/api/land/orders', { projectId: testProjectId, units: 9999999 }, tokenA);
        assert(res4ExcessUnits.status === 400, 'Units exceeding available units returns 400');

        // Successful Order Creation by User A
        const res4Success = await apiRequest('POST', '/api/land/orders', {
            projectId: testProjectId,
            units: 1.5,
            notes: 'Test acquisition for automated verification'
        }, tokenA);

        assert(res4Success.status === 201, 'Valid order creation returns 201 Created');
        assert(res4Success.data.success === true, 'Order creation has success: true');
        assert(res4Success.data.data.orderId > 0, 'Returns valid numeric orderId');
        assert(res4Success.data.data.orderReference.startsWith('LND-'), 'Order reference starts with LND-');
        assert(res4Success.data.data.status === 'pending', 'Initial order status is pending');
        assert(res4Success.data.data.units === 1.5, 'Order has correct units requested');
        assert(typeof res4Success.data.data.totalAmount === 'number', 'Total amount is calculated by backend');
        assert(typeof res4Success.data.data.disclaimer === 'string', 'Returns regulatory demo disclaimer');

        createdOrderId = res4Success.data.data.orderId;
        createdOrderRef = res4Success.data.data.orderReference;

        // Anti-spam duplicate check
        const res4Duplicate = await apiRequest('POST', '/api/land/orders', {
            projectId: testProjectId,
            units: 1.5
        }, tokenA);
        assert(res4Duplicate.status === 409, 'Immediate duplicate order returns 409 Conflict');

        // Check land_transactions entry was automatically created
        const [txnRecords] = await db.query(
            `SELECT * FROM land_transactions WHERE order_id = ?`,
            [createdOrderId]
        );
        assert(txnRecords.length === 1, 'Transaction record automatically generated for order');
        assert(txnRecords[0].transaction_type === 'order_request', 'Transaction type is order_request');
        assert(txnRecords[0].status === 'pending', 'Transaction status is pending');
        console.log('');

        // ==========================================
        // TEST 5: GET /api/land/orders/:id
        // ==========================================
        console.log('--- TEST 5: GET /api/land/orders/:id ---');
        // Unauthorized
        const res5Unauth = await apiRequest('GET', `/api/land/orders/${createdOrderId}`);
        assert(res5Unauth.status === 401, 'GET /api/land/orders/:id without token returns 401');

        // Lookup by numeric ID
        const res5ById = await apiRequest('GET', `/api/land/orders/${createdOrderId}`, null, tokenA);
        assert(res5ById.status === 200, 'Lookup by numeric ID returns 200 OK');
        assert(res5ById.data.data.id === createdOrderId, 'Matches created order ID');
        assert(res5ById.data.data.orderReference === createdOrderRef, 'Matches order reference');
        assert(res5ById.data.data.status === 'pending', 'Matches order status');

        // Lookup by orderReference
        const res5ByRef = await apiRequest('GET', `/api/land/orders/${createdOrderRef}`, null, tokenA);
        assert(res5ByRef.status === 200, 'Lookup by orderReference returns 200 OK');
        assert(res5ByRef.data.data.id === createdOrderId, 'Matches order data');

        // User B attempts to access User A's order -> 404 (Data Isolation)
        const res5CrossUser = await apiRequest('GET', `/api/land/orders/${createdOrderId}`, null, tokenB);
        assert(res5CrossUser.status === 404, 'User B accessing User A order returns 404 Not Found (Data Isolation)');

        // Non-existent order
        const res5NotFound = await apiRequest('GET', '/api/land/orders/999999', null, tokenA);
        assert(res5NotFound.status === 404, 'Non-existent order returns 404');
        console.log('');

        // ==========================================
        // TEST 6: GET /api/land/transactions
        // ==========================================
        console.log('--- TEST 6: GET /api/land/transactions ---');
        // Unauthorized
        const res6Unauth = await apiRequest('GET', '/api/land/transactions');
        assert(res6Unauth.status === 401, 'GET /api/land/transactions without token returns 401');

        // User A transactions
        const res6UserA = await apiRequest('GET', '/api/land/transactions', null, tokenA);
        assert(res6UserA.status === 200, 'User A transactions retrieved successfully');
        assert(res6UserA.data.data.transactions.length >= 1, 'User A has at least 1 transaction');
        assert(res6UserA.data.data.transactions[0].orderId === createdOrderId, 'Matches created order ID');
        assert(res6UserA.data.data.pagination && res6UserA.data.data.pagination.totalRecords >= 1, 'Pagination populated');

        // Filter by type
        const res6FilterType = await apiRequest('GET', '/api/land/transactions?type=order_request', null, tokenA);
        assert(res6FilterType.status === 200, 'Filtering by type=order_request succeeds');

        // User B transactions (Isolated)
        const res6UserB = await apiRequest('GET', '/api/land/transactions', null, tokenB);
        assert(res6UserB.status === 200, 'User B transactions retrieved successfully');
        assert(res6UserB.data.data.transactions.length === 0, 'User B has 0 transactions (Strict Data Isolation)');
        console.log('');

        // ==========================================
        // TEST 7: GET /api/land/valuations
        // ==========================================
        console.log('--- TEST 7: GET /api/land/valuations ---');
        // Public access
        const res7Public = await apiRequest('GET', '/api/land/valuations');
        assert(res7Public.status === 200, 'GET /api/land/valuations is publicly accessible');
        assert(Array.isArray(res7Public.data.data.valuations), 'Returns valuations array');
        assert(res7Public.data.data.valuations.length > 0, 'Contains seeded valuation records');

        const firstValuation = res7Public.data.data.valuations[0];
        assert(typeof firstValuation.previousValuation === 'number', 'Has previousValuation');
        assert(typeof firstValuation.currentValuation === 'number', 'Has currentValuation');
        assert(typeof firstValuation.growthPercentage === 'number', 'Calculated growthPercentage present');
        assert(typeof firstValuation.valuationSource === 'string', 'Has valuationSource');

        // Filter by projectId
        const res7ProjectFilter = await apiRequest('GET', `/api/land/valuations?projectId=${testProjectId}`);
        assert(res7ProjectFilter.status === 200, `Filter by projectId=${testProjectId} succeeds`);
        const allMatchProject = res7ProjectFilter.data.data.valuations.every(v => v.projectId === testProjectId);
        assert(allMatchProject, 'All filtered valuations belong to requested project ID');
        console.log('');

        console.log('========================================================');
        console.log(`ALL TESTS PASSED! (${passedTests}/${totalTests})`);
        console.log('========================================================\n');

    } catch (err) {
        console.error('\n❌ Test Suite Aborted due to error:', err);
    } finally {
        // Cleanup test data
        console.log('--- Cleaning Up Test Data ---');
        try {
            if (userAId || userBId) {
                const userIds = [userAId, userBId].filter(Boolean);
                await db.query(`DELETE FROM land_transactions WHERE user_id IN (?)`, [userIds]);
                await db.query(`DELETE FROM land_orders WHERE user_id IN (?)`, [userIds]);
                await db.query(`DELETE FROM land_holdings WHERE user_id IN (?)`, [userIds]);
                await db.query(`DELETE FROM users WHERE id IN (?)`, [userIds]);
                console.log('Cleaned up test transactions, orders, holdings, and users.');
            }
        } catch (cleanupErr) {
            console.error('Cleanup Error:', cleanupErr);
        }

        if (server) {
            await new Promise((resolve) => server.close(resolve));
            console.log('Test server closed.');
        }

        process.exit(passedTests === totalTests ? 0 : 1);
    }
}

runLandTests();
