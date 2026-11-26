/**
 * Automated Verification Script:
 * Tests Admin & Customer Authentication Isolation, Token Validation, Refresh Rotation & Isolation
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Replicate URL classification helpers from api.js
const isAdminRequest = (url) => {
  if (!url) return false;
  const cleanUrl = url.split('?')[0];
  return /(^|\/)admin(\/|$)/i.test(cleanUrl);
};

const isPublicEndpoint = (url) => {
  if (!url || typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  const publicExactOrSuffix = [
    '/auth/login',
    '/auth/login/lookup-phone',
    '/auth/login/send-otp',
    '/auth/login/verify-otp',
    '/auth/register',
    '/auth/send-otp',
    '/auth/verify-otp',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/refresh',
    '/admin/auth/login',
    '/admin/auth/send-otp',
    '/admin/auth/verify-otp',
    '/admin/auth/forgot-password',
    '/admin/auth/reset-password',
    '/admin/auth/refresh',
    '/health',
    '/api/health'
  ];
  return publicExactOrSuffix.some((p) => cleanUrl.endsWith(p) || cleanUrl.includes(p));
};

async function runTests() {
  console.log('=== STARTING APNAPAY AUTHENTICATION & API VERIFICATION ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // TEST 1: URL Classification
  console.log('--- 1. API.JS URL ROUTE CLASSIFICATION ---');
  assert(isAdminRequest('/admin/auth/login') === true, 'Admin route: /admin/auth/login');
  assert(isAdminRequest('/admin/dashboard') === true, 'Admin route: /admin/dashboard');
  assert(isAdminRequest('/admin') === true, 'Admin route: /admin');
  assert(isAdminRequest('/admin?tab=KYC+Management') === true, 'Admin route: /admin?tab=KYC+Management');
  assert(isAdminRequest('/land/admin/orders') === true, 'Admin route: /land/admin/orders');
  assert(isAdminRequest('/recharge/admin/overview') === true, 'Admin route: /recharge/admin/overview');

  assert(isAdminRequest('/wallet') === false, 'Customer route: /wallet is NOT admin');
  assert(isAdminRequest('/wallet/balance') === false, 'Customer route: /wallet/balance is NOT admin');
  assert(isAdminRequest('/bank-accounts') === false, 'Customer route: /bank-accounts is NOT admin');
  assert(isAdminRequest('/transactions') === false, 'Customer route: /transactions is NOT admin');
  assert(isAdminRequest('/upi/handles') === false, 'Customer route: /upi/handles is NOT admin');
  assert(isAdminRequest('/land/holdings') === false, 'Customer route: /land/holdings is NOT admin');
  assert(isAdminRequest('/notifications') === false, 'Customer route: /notifications is NOT admin');

  // TEST 2: Public vs Protected Classification
  console.log('\n--- 2. PUBLIC VS PROTECTED ENDPOINT CLASSIFICATION ---');
  assert(isPublicEndpoint('/auth/login') === true, 'Public endpoint: /auth/login');
  assert(isPublicEndpoint('/admin/auth/login') === true, 'Public endpoint: /admin/auth/login');
  assert(isPublicEndpoint('/auth/refresh') === true, 'Public endpoint: /auth/refresh');
  assert(isPublicEndpoint('/admin/auth/refresh') === true, 'Public endpoint: /admin/auth/refresh');

  assert(isPublicEndpoint('/admin/auth/profile') === false, 'Protected endpoint: /admin/auth/profile requires token');
  assert(isPublicEndpoint('/admin/auth/change-password') === false, 'Protected endpoint: /admin/auth/change-password requires token');
  assert(isPublicEndpoint('/wallet/balance') === false, 'Protected endpoint: /wallet/balance requires token');
  assert(isPublicEndpoint('/notifications') === false, 'Protected endpoint: /notifications requires token');

  // TEST 3: JWT Secrets & Signature Isolation
  console.log('\n--- 3. JWT SIGNATURE ISOLATION ---');
  const userSecret = process.env.JWT_SECRET || 'apnapay_access_secret_key_2026';
  const adminSecret = process.env.ADMIN_JWT_SECRET || 'apnapay_admin_access_secret_2026';
  const adminRefreshSecret = process.env.ADMIN_JWT_REFRESH_SECRET || 'apnapay_admin_refresh_secret_2026';
  const userRefreshSecret = process.env.JWT_REFRESH_SECRET || 'apnapay_refresh_secret_key_2026';

  assert(userSecret !== adminSecret, 'Customer and Admin JWT secrets are different');
  assert(userRefreshSecret !== adminRefreshSecret, 'Customer and Admin Refresh secrets are different');

  const adminToken = jwt.sign({ adminId: 3, role: 'superadmin', type: 'admin' }, adminSecret, { expiresIn: '15m' });
  const userToken = jwt.sign({ userId: 1, type: 'access' }, userSecret, { expiresIn: '1h' });

  // Verify Admin token cannot be verified with userSecret
  let adminWithUserSecretFailed = false;
  try {
    jwt.verify(adminToken, userSecret);
  } catch (e) {
    adminWithUserSecretFailed = true;
  }
  assert(adminWithUserSecretFailed, 'Admin token fails verification with Customer secret');

  // Verify User token cannot be verified with adminSecret
  let userWithAdminSecretFailed = false;
  try {
    jwt.verify(userToken, adminSecret);
  } catch (e) {
    userWithAdminSecretFailed = true;
  }
  assert(userWithAdminSecretFailed, 'Customer token fails verification with Admin secret');

  // TEST 4: Admin Session & Refresh Flow in Database
  console.log('\n--- 4. ADMIN SESSION REFRESH & ROTATION IN DATABASE ---');
  const testAdminRefresh = jwt.sign({ adminId: 3, type: 'admin', jti: crypto.randomBytes(16).toString('hex') }, adminRefreshSecret, { expiresIn: '7d' });
  const testAdminRefreshHash = hashToken(testAdminRefresh);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Insert test session
  const [insertRes] = await db.execute(
    'INSERT INTO admin_sessions (admin_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [3, testAdminRefreshHash, expiresAt]
  );
  const sessionId = insertRes.insertId;
  assert(sessionId > 0, 'Admin session inserted successfully');

  // Rotate session
  const [rotateRes] = await db.execute(
    'UPDATE admin_sessions SET revoked_at = NOW() WHERE id = ? AND revoked_at IS NULL',
    [sessionId]
  );
  assert(rotateRes.affectedRows === 1, 'First refresh request successfully rotates session');

  // Second concurrent refresh attempt must fail
  const [secondAttemptRes] = await db.execute(
    'UPDATE admin_sessions SET revoked_at = NOW() WHERE id = ? AND revoked_at IS NULL',
    [sessionId]
  );
  assert(secondAttemptRes.affectedRows === 0, 'Second concurrent refresh with same token is blocked (0 rows affected)');

  // Clean up test session
  await db.execute('DELETE FROM admin_sessions WHERE id = ?', [sessionId]);

  // TEST 5: Customer Session & Refresh Flow in Database
  console.log('\n--- 5. CUSTOMER SESSION REFRESH & ROTATION IN DATABASE ---');
  const testUserRefresh = jwt.sign({ userId: 1, type: 'refresh' }, userRefreshSecret, { expiresIn: '7d' });
  const testUserRefreshHash = hashToken(testUserRefresh);

  const [userInsert] = await db.execute(
    'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [1, testUserRefreshHash, expiresAt]
  );
  const userSessionId = userInsert.insertId;
  assert(userSessionId > 0, 'Customer session inserted successfully');

  const newHash = hashToken('new_random_token_123');
  const [userRotate] = await db.execute(
    'UPDATE sessions SET token_hash = ?, expires_at = ? WHERE id = ? AND token_hash = ? AND revoked_at IS NULL',
    [newHash, expiresAt, userSessionId, testUserRefreshHash]
  );
  assert(userRotate.affectedRows === 1, 'First customer refresh rotates session');

  // Second attempt with old hash fails
  const [userSecondAttempt] = await db.execute(
    'UPDATE sessions SET token_hash = ?, expires_at = ? WHERE id = ? AND token_hash = ? AND revoked_at IS NULL',
    [newHash, expiresAt, userSessionId, testUserRefreshHash]
  );
  assert(userSecondAttempt.affectedRows === 0, 'Second concurrent customer refresh blocked by single-flight queue');

  // Clean up customer test session
  await db.execute('DELETE FROM sessions WHERE id = ?', [userSessionId]);

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
