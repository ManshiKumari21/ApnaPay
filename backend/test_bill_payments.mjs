import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'c5f782782bcf656fa5f4d8a1768c8b668041d407ffeb6c4292fb2c8849bca7ff';

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'payment_app'
};

async function runTests() {
  console.log('================================================================');
  console.log('    APNAPAY BILL PAYMENTS MODULE - COMPLETE INTEGRATION TEST    ');
  console.log('================================================================\n');

  const conn = await mysql.createConnection(dbConfig);
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Setup Test Users (User A and User B for cross-user security checks)
    const [users] = await conn.execute(`SELECT id, full_name, email, phone FROM users ORDER BY id ASC LIMIT 2`);
    let userA = users[0];
    let userB = users[1];

    if (!userA) {
      const [insA] = await conn.execute(
        `INSERT INTO users (full_name, email, phone, phone_verified_at, password_hash, status)
         VALUES ('Test User A', 'testuserA@apnapay.com', '9876500001', NOW(), '$2b$10$dummyhash', 'active')`
      );
      userA = { id: insA.insertId, email: 'testuserA@apnapay.com', full_name: 'Test User A' };
    }

    if (!userB) {
      const [insB] = await conn.execute(
        `INSERT INTO users (full_name, email, phone, phone_verified_at, password_hash, status)
         VALUES ('Test User B', 'testuserB@apnapay.com', '9876500002', NOW(), '$2b$10$dummyhash', 'active')`
      );
      userB = { id: insB.insertId, email: 'testuserB@apnapay.com', full_name: 'Test User B' };
    }

    const tokenA = jwt.sign({ userId: userA.id, role: 'customer', email: userA.email }, JWT_SECRET, { expiresIn: '1h' });
    const tokenB = jwt.sign({ userId: userB.id, role: 'customer', email: userB.email }, JWT_SECRET, { expiresIn: '1h' });

    console.log(`Using Test User A: ID ${userA.id} (${userA.email})`);
    console.log(`Using Test User B: ID ${userB.id} (${userB.email})\n`);

    // Clean up test data for User A
    await conn.execute(`DELETE FROM bill_favorites WHERE user_id IN (?, ?)`, [userA.id, userB.id]);
    await conn.execute(`DELETE FROM bill_payment_events WHERE payment_id IN (SELECT id FROM bill_payments WHERE user_id IN (?, ?))`, [userA.id, userB.id]);
    await conn.execute(`DELETE FROM bill_payments WHERE user_id IN (?, ?)`, [userA.id, userB.id]);
    await conn.execute(`DELETE FROM bill_fetches WHERE user_id IN (?, ?)`, [userA.id, userB.id]);

    // Ensure User A has an active wallet with known balance
    const [wallets] = await conn.execute(`SELECT id, available_balance FROM wallets WHERE user_id = ?`, [userA.id]);
    let walletAId;
    if (wallets.length === 0) {
      const [wIns] = await conn.execute(
        `INSERT INTO wallets (user_id, currency, available_balance, status) VALUES (?, 'INR', 5000.00, 'active')`,
        [userA.id]
      );
      walletAId = wIns.insertId;
    } else {
      walletAId = wallets[0].id;
      await conn.execute(`UPDATE wallets SET available_balance = 5000.00 WHERE id = ?`, [walletAId]);
    }

    // -------------------------------------------------------------
    // API 1: GET /api/bills/categories
    // -------------------------------------------------------------
    console.log('[API 1] Testing GET /api/bills/categories');
    const catRes = await fetch(`${API_BASE}/bills/categories`);
    const catJson = await catRes.json();
    assert(catRes.status === 200, `Status is 200 OK (got ${catRes.status})`);
    assert(catJson.success === true, 'Response success is true');
    assert(Array.isArray(catJson.data), 'Returns an array of categories');
    assert(catJson.data.length >= 10, `Returns at least 10 categories (got ${catJson.data.length})`);

    const requiredCategories = [
      'Electricity', 'Water', 'Gas', 'DTH', 'Broadband',
      'Landline', 'FASTag', 'Insurance', 'Loan Repayment', 'Municipal Taxes'
    ];
    const categoryNames = catJson.data.map(c => c.name);
    const allFound = requiredCategories.every(req => categoryNames.includes(req));
    assert(allFound, 'All 10 required bill categories are present');

    // -------------------------------------------------------------
    // API 2: GET /api/bills/billers
    // -------------------------------------------------------------
    console.log('\n[API 2] Testing GET /api/bills/billers');
    // Electricity Billers
    const elecRes = await fetch(`${API_BASE}/bills/billers?category=electricity`);
    const elecJson = await elecRes.json();
    assert(elecRes.status === 200, `Electricity billers status 200 OK (got ${elecRes.status})`);
    assert(elecJson.data.length >= 4, `Returns electricity billers (got ${elecJson.data.length})`);
    assert(elecJson.data[0].customerParameter !== undefined, 'Biller contains customerParameter configuration');
    assert(elecJson.data[0].customerParameter.paramName !== undefined, 'Parameter has paramName');

    // Water Billers
    const waterRes = await fetch(`${API_BASE}/bills/billers?category=water`);
    const waterJson = await waterRes.json();
    assert(waterRes.status === 200, `Water billers status 200 OK (got ${waterRes.status})`);
    assert(waterJson.data.length >= 3, `Returns water billers (got ${waterJson.data.length})`);

    // DTH Billers
    const dthRes = await fetch(`${API_BASE}/bills/billers?category=dth`);
    const dthJson = await dthRes.json();
    assert(dthRes.status === 200, `DTH billers status 200 OK (got ${dthRes.status})`);
    assert(dthJson.data.length >= 4, `Returns DTH billers (got ${dthJson.data.length})`);

    // Invalid category
    const invalidCatRes = await fetch(`${API_BASE}/bills/billers?category=non_existent_category_123`);
    assert(invalidCatRes.status === 400, `Invalid category returns 400 Bad Request (got ${invalidCatRes.status})`);

    const sampleBiller = elecJson.data[0]; // e.g. MPPKVVCL-W (requires 10 digits)

    // -------------------------------------------------------------
    // API 3: POST /api/bills/fetch
    // -------------------------------------------------------------
    console.log('\n[API 3] Testing POST /api/bills/fetch');
    // Missing Token
    const unauthFetch = await fetch(`${API_BASE}/bills/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billerId: sampleBiller.id, consumerNumber: '1000234567' })
    });
    assert(unauthFetch.status === 401, `Unauthenticated request returns 401 Unauthorized (got ${unauthFetch.status})`);

    // Invalid Consumer Number (too short / wrong regex)
    const invalidParamFetch = await fetch(`${API_BASE}/bills/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ billerId: sampleBiller.id, consumerNumber: '123' })
    });
    assert(invalidParamFetch.status === 400, `Invalid consumer number format returns 400 (got ${invalidParamFetch.status})`);

    // Invalid Biller ID
    const invalidBillerFetch = await fetch(`${API_BASE}/bills/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ billerId: 999999, consumerNumber: '1000234567' })
    });
    assert(invalidBillerFetch.status === 404, `Non-existent biller ID returns 404 (got ${invalidBillerFetch.status})`);

    // Successful Unpaid Bill Fetch
    const validFetchRes = await fetch(`${API_BASE}/bills/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ billerId: sampleBiller.id, consumerNumber: '1000234567' })
    });
    const validFetchJson = await validFetchRes.json();
    assert(validFetchRes.status === 200, `Valid fetch returns 200 OK (got ${validFetchRes.status})`);
    assert(validFetchJson.data.fetchReferenceId.startsWith('BF-'), `Fetch reference generated: ${validFetchJson.data.fetchReferenceId}`);
    assert(validFetchJson.data.billAmount > 0, `Bill amount is positive: ₹${validFetchJson.data.billAmount}`);
    assert(validFetchJson.data.customerName !== undefined, `Customer name returned: ${validFetchJson.data.customerName}`);
    assert(validFetchJson.data.billStatus === 'unpaid', `Bill status is 'unpaid'`);
    assert(validFetchJson.data.isPayable === true, 'Bill is payable');

    const fetchRefA = validFetchJson.data.fetchReferenceId;
    const fetchAmountA = validFetchJson.data.billAmount;

    // Special Scenario: Already Paid Bill Fetch (ends with 0000)
    const paidFetchRes = await fetch(`${API_BASE}/bills/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ billerId: sampleBiller.id, consumerNumber: '1000000000' })
    });
    const paidFetchJson = await paidFetchRes.json();
    assert(paidFetchJson.data.billStatus === 'paid', `Scenario 0000 recognized as 'paid'`);
    assert(paidFetchJson.data.isPayable === false, 'Paid bill is marked not payable');

    // Special Scenario: Overdue Bill Fetch (ends with 9999)
    const overdueFetchRes = await fetch(`${API_BASE}/bills/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ billerId: sampleBiller.id, consumerNumber: '1000009999' })
    });
    const overdueFetchJson = await overdueFetchRes.json();
    assert(overdueFetchJson.data.billStatus === 'overdue', `Scenario 9999 recognized as 'overdue'`);

    // -------------------------------------------------------------
    // API 4: POST /api/bills/validate
    // -------------------------------------------------------------
    console.log('\n[API 4] Testing POST /api/bills/validate');
    // Amount mismatch
    const badAmountValidate = await fetch(`${API_BASE}/bills/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        billerId: sampleBiller.id,
        consumerNumber: '1000234567',
        fetchReferenceId: fetchRefA,
        amount: fetchAmountA + 50 // Mismatched amount
      })
    });
    assert(badAmountValidate.status === 400, `Amount mismatch returns 400 Bad Request (got ${badAmountValidate.status})`);

    // Cross-user fetch reference validation (User B trying to validate User A's fetchRef)
    const crossUserValidate = await fetch(`${API_BASE}/bills/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({
        billerId: sampleBiller.id,
        consumerNumber: '1000234567',
        fetchReferenceId: fetchRefA,
        amount: fetchAmountA
      })
    });
    assert(crossUserValidate.status === 404, `Cross-user fetchRef returns 404 Not Found (got ${crossUserValidate.status})`);

    // Valid Validation
    const validValidateRes = await fetch(`${API_BASE}/bills/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        billerId: sampleBiller.id,
        consumerNumber: '1000234567',
        fetchReferenceId: fetchRefA,
        amount: fetchAmountA
      })
    });
    const validValidateJson = await validValidateRes.json();
    assert(validValidateRes.status === 200, `Valid verification returns 200 OK (got ${validValidateRes.status})`);
    assert(validValidateJson.data.paymentReady === true, 'paymentReady is true');
    assert(validValidateJson.data.verifiedAmount === fetchAmountA, 'verifiedAmount matches');

    // -------------------------------------------------------------
    // API 5: POST /api/bills/payments (DEMO Mode)
    // -------------------------------------------------------------
    console.log('\n[API 5] Testing POST /api/bills/payments (DEMO Mode)');
    const idempKey1 = `IDEMP-${Date.now()}-TEST`;
    const demoPayRes = await fetch(`${API_BASE}/bills/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        billerId: sampleBiller.id,
        consumerNumber: '1000234567',
        fetchReferenceId: fetchRefA,
        amount: fetchAmountA,
        paymentMode: 'DEMO',
        idempotencyKey: idempKey1
      })
    });
    const demoPayJson = await demoPayRes.json();
    assert(demoPayRes.status === 201, `Demo payment returns 201 Created (got ${demoPayRes.status})`);
    assert(demoPayJson.data.status === 'SUCCESS', `Payment status is SUCCESS`);
    assert(demoPayJson.data.txnReference.startsWith('BP-'), `Txn reference generated: ${demoPayJson.data.txnReference}`);
    assert(demoPayJson.data.receipt !== undefined, 'Receipt details generated');

    const paymentIdA = demoPayJson.data.paymentId;
    const txnRefA = demoPayJson.data.txnReference;

    // Duplicate payment attempt on already-paid fetch
    const duplicatePay = await fetch(`${API_BASE}/bills/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        billerId: sampleBiller.id,
        consumerNumber: '1000234567',
        fetchReferenceId: fetchRefA,
        amount: fetchAmountA,
        paymentMode: 'DEMO'
      })
    });
    assert(duplicatePay.status === 400 || duplicatePay.status === 409, `Duplicate payment on same bill rejected (got ${duplicatePay.status})`);

    // Idempotent replay
    const idempReplay = await fetch(`${API_BASE}/bills/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        billerId: sampleBiller.id,
        consumerNumber: '1000234567',
        fetchReferenceId: fetchRefA,
        amount: fetchAmountA,
        paymentMode: 'DEMO',
        idempotencyKey: idempKey1
      })
    });
    const idempJson = await idempReplay.json();
    assert(idempReplay.status === 200, `Idempotent request returns 200 OK (got ${idempReplay.status})`);
    assert(idempJson.data.idempotentReplay === true, 'idempotentReplay flag is true');

    // -------------------------------------------------------------
    // API 5 (Cont.): WALLET Payment Mode & Atomic Ledger Test
    // -------------------------------------------------------------
    console.log('\n[API 5 - Wallet] Testing WALLET Payment Mode & Atomic Ledger Integration');
    // Fetch a second bill for Wallet test
    const fetchBiller2Res = await fetch(`${API_BASE}/bills/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ billerId: sampleBiller.id, consumerNumber: '1000555666' })
    });
    const fetchBiller2Json = await fetchBiller2Res.json();
    const fetchRefWallet = fetchBiller2Json.data.fetchReferenceId;
    const amountWallet = fetchBiller2Json.data.billAmount;

    // Check balance before
    const [wBefore] = await conn.execute(`SELECT available_balance FROM wallets WHERE id = ?`, [walletAId]);
    const balanceBefore = parseFloat(wBefore[0].available_balance);

    const walletPayRes = await fetch(`${API_BASE}/bills/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        billerId: sampleBiller.id,
        consumerNumber: '1000555666',
        fetchReferenceId: fetchRefWallet,
        amount: amountWallet,
        paymentMode: 'WALLET'
      })
    });
    const walletPayJson = await walletPayRes.json();
    assert(walletPayRes.status === 201, `Wallet bill payment returns 201 Created (got ${walletPayRes.status})`);
    assert(walletPayJson.data.paymentMode === 'WALLET', 'Payment mode is WALLET');

    // Check balance after
    const [wAfter] = await conn.execute(`SELECT available_balance FROM wallets WHERE id = ?`, [walletAId]);
    const balanceAfter = parseFloat(wAfter[0].available_balance);
    const expectedBalance = balanceBefore - amountWallet;
    assert(Math.abs(balanceAfter - expectedBalance) < 0.01, `Wallet balance correctly deducted: ₹${balanceBefore} -> ₹${balanceAfter}`);

    // Verify ledger entry created
    const [ledgerRows] = await conn.execute(
      `SELECT le.*, lt.transaction_type
       FROM ledger_entries le
       JOIN ledger_transactions lt ON le.ledger_transaction_id = lt.id
       WHERE le.wallet_id = ? AND le.entry_type = 'debit'
       ORDER BY le.id DESC LIMIT 1`,
      [walletAId]
    );
    assert(ledgerRows.length === 1, 'Ledger debit entry recorded in database');
    assert(parseFloat(ledgerRows[0].amount) === amountWallet, `Ledger entry amount matches: ₹${ledgerRows[0].amount}`);

    // -------------------------------------------------------------
    // API 6: GET /api/bills/payments/:id
    // -------------------------------------------------------------
    console.log('\n[API 6] Testing GET /api/bills/payments/:id');
    const payDetailRes = await fetch(`${API_BASE}/bills/payments/${paymentIdA}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const payDetailJson = await payDetailRes.json();
    assert(payDetailRes.status === 200, `Status is 200 OK (got ${payDetailRes.status})`);
    assert(payDetailJson.data.paymentId === paymentIdA, `Payment ID matches: ${paymentIdA}`);
    assert(payDetailJson.data.txnReference === txnRefA, `Txn reference matches: ${txnRefA}`);
    assert(payDetailJson.data.maskedConsumerNumber.includes('4567'), `Consumer number properly masked: ${payDetailJson.data.maskedConsumerNumber}`);

    // Query by txnReference string
    const payByRefRes = await fetch(`${API_BASE}/bills/payments/${txnRefA}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(payByRefRes.status === 200, `Query by txn_reference string returns 200 OK (got ${payByRefRes.status})`);

    // Cross-user payment detail query (User B trying to access User A's payment)
    const crossUserPay = await fetch(`${API_BASE}/bills/payments/${paymentIdA}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(crossUserPay.status === 404, `Cross-user payment query returns 404 Not Found (got ${crossUserPay.status})`);

    // -------------------------------------------------------------
    // API 7: GET /api/bills/history
    // -------------------------------------------------------------
    console.log('\n[API 7] Testing GET /api/bills/history');
    const histRes = await fetch(`${API_BASE}/bills/history`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const histJson = await histRes.json();
    assert(histRes.status === 200, `Status is 200 OK (got ${histRes.status})`);
    assert(Array.isArray(histJson.data), 'Returns an array of payment records');
    assert(histJson.data.length >= 2, `User A has at least 2 payments (got ${histJson.data.length})`);
    assert(histJson.pagination !== undefined, 'Pagination metadata included');

    // Filter by status=SUCCESS
    const histFilterStatus = await fetch(`${API_BASE}/bills/history?status=SUCCESS`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const histFilterJson = await histFilterStatus.json();
    assert(histFilterStatus.status === 200 && histFilterJson.data.length >= 2, 'Filter by status=SUCCESS works');

    // User B history check (User B has 0 payments)
    const userBHist = await fetch(`${API_BASE}/bills/history`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const userBHistJson = await userBHist.json();
    assert(userBHist.status === 200 && userBHistJson.data.length === 0, `User B sees 0 payments (isolation confirmed)`);

    // -------------------------------------------------------------
    // API 8: POST /api/bills/favorites
    // -------------------------------------------------------------
    console.log('\n[API 8] Testing POST /api/bills/favorites');
    const favRes = await fetch(`${API_BASE}/bills/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        billerId: sampleBiller.id,
        consumerNumber: '1000234567',
        nickname: 'Home Electricity'
      })
    });
    const favJson = await favRes.json();
    assert(favRes.status === 201, `Add favorite returns 201 Created (got ${favRes.status})`);
    assert(favJson.data.nickname === 'Home Electricity', `Nickname saved: ${favJson.data.nickname}`);
    const favoriteIdA = favJson.data.id;

    // Duplicate favorite attempt
    const dupFavRes = await fetch(`${API_BASE}/bills/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        billerId: sampleBiller.id,
        consumerNumber: '1000234567',
        nickname: 'Duplicate Entry'
      })
    });
    assert(dupFavRes.status === 409, `Duplicate favorite returns 409 Conflict (got ${dupFavRes.status})`);

    // -------------------------------------------------------------
    // API 9: GET /api/bills/favorites
    // -------------------------------------------------------------
    console.log('\n[API 9] Testing GET /api/bills/favorites');
    const getFavRes = await fetch(`${API_BASE}/bills/favorites`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const getFavJson = await getFavRes.json();
    assert(getFavRes.status === 200, `Status is 200 OK (got ${getFavRes.status})`);
    assert(getFavJson.data.length === 1, `User A has 1 favorite (got ${getFavJson.data.length})`);
    assert(getFavJson.data[0].biller.billerName !== undefined, 'Includes biller name in favorite');
    assert(getFavJson.data[0].maskedConsumerNumber.includes('4567'), 'Includes masked consumer number');

    // -------------------------------------------------------------
    // API 10: DELETE /api/bills/favorites/:id
    // -------------------------------------------------------------
    console.log('\n[API 10] Testing DELETE /api/bills/favorites/:id');
    // Cross-user delete attempt (User B trying to delete User A's favorite)
    const crossUserDelFav = await fetch(`${API_BASE}/bills/favorites/${favoriteIdA}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(crossUserDelFav.status === 404, `Cross-user favorite deletion returns 404 (got ${crossUserDelFav.status})`);

    // Valid deletion
    const delFavRes = await fetch(`${API_BASE}/bills/favorites/${favoriteIdA}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const delFavJson = await delFavRes.json();
    assert(delFavRes.status === 200, `Valid delete favorite returns 200 OK (got ${delFavRes.status})`);

    // Verify favorite is gone
    const verifyDelFav = await fetch(`${API_BASE}/bills/favorites`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const verifyDelJson = await verifyDelFav.json();
    assert(verifyDelJson.data.length === 0, 'Favorite is confirmed removed from list');

    console.log('\n================================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    await conn.end();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();

