import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
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
  console.log('=== APNAPAY SECURE OTP VERIFICATION INTEGRATION TEST SUITE ===\n');
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
    // 1. Get or create test user
    const [users] = await conn.execute(
      `SELECT id, full_name, email, phone FROM users ORDER BY id ASC LIMIT 1`
    );

    let testUser = users[0];
    if (!testUser) {
      console.log('Creating test user...');
      const [ins] = await conn.execute(
        `INSERT INTO users (full_name, email, phone, phone_verified_at, password_hash, status)
         VALUES ('Test Customer', 'testcustomer@apnapay.com', '9876542524', NOW(), '$2b$10$dummyhash', 'active')`
      );
      testUser = { id: ins.insertId, email: 'testcustomer@apnapay.com', phone: '9876542524' };
    } else {
      // Ensure phone is set and verified
      await conn.execute(
        `UPDATE users SET phone = '9876542524', phone_verified_at = NOW() WHERE id = ?`,
        [testUser.id]
      );
      testUser.phone = '9876542524';
    }

    const token = jwt.sign(
      { userId: testUser.id, role: 'customer', email: testUser.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Clean up any pending bank accounts & OTPs for this user to start fresh
    await conn.execute(`DELETE FROM upi_handles WHERE user_id = ?`, [testUser.id]);
    await conn.execute(`DELETE FROM bank_accounts WHERE user_id = ? AND account_last4 = '3214'`, [testUser.id]);
    await conn.execute(`DELETE FROM otp_verifications WHERE user_id = ? AND purpose = 'bank_account_link'`, [testUser.id]);

    console.log(`[1] Testing POST /api/bank-accounts/link (Initiate with Secure OTP)`);
    const initRes = await fetch(`${API_BASE}/bank-accounts/link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        bankName: 'HDFC Bank',
        accountNumber: '50100432143214',
        confirmAccountNumber: '50100432143214',
        ifscCode: 'HDFC0001234',
        accountHolderName: 'Test Customer',
        isPrimary: true
      })
    });

    const initJson = await initRes.json();
    assert(initRes.status === 201, `Status code is 201 Created (got ${initRes.status})`);
    assert(initJson.success === true, 'API returned success: true');
    assert(initJson.data.bankAccountId !== undefined, `Bank account ID returned: ${initJson.data.bankAccountId}`);
    assert(initJson.data.resendCooldown === 60, `Resend cooldown is exactly 60 seconds (got ${initJson.data.resendCooldown})`);
    assert(initJson.data.expiresIn === 300, `Expires in 300 seconds (5 min) (got ${initJson.data.expiresIn})`);
    assert(initJson.data.registeredMobileLast4 === '2524', `Last 4 digits: 2524 (got ${initJson.data.registeredMobileLast4})`);
    assert(initJson.data.maskedMobile.includes('2524'), `Mobile masked correctly: ${initJson.data.maskedMobile}`);

    // CRITICAL SECURITY CHECKS
    assert(initJson.data.devOtp === undefined, 'CRITICAL: devOtp is NOT in response JSON');
    assert(initJson.data.devNote === undefined, 'CRITICAL: devNote is NOT in response JSON');
    assert(initJson.devOtp === undefined, 'CRITICAL: devOtp not at top level');

    const bankAccountId = initJson.data.bankAccountId;

    console.log(`\n[2] Testing 60-Second Cooldown Enforcement`);
    const cooldownRes = await fetch(`${API_BASE}/bank-accounts/link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        bankName: 'HDFC Bank',
        accountNumber: '50100432143214',
        confirmAccountNumber: '50100432143214',
        ifscCode: 'HDFC0001234'
      })
    });
    const cooldownJson = await cooldownRes.json();
    assert(cooldownRes.status === 429, `Immediate retry returns 429 Too Many Requests (got ${cooldownRes.status})`);
    assert(cooldownJson.cooldownRemaining > 0, `Cooldown remaining reported: ${cooldownJson.cooldownRemaining}s`);

    console.log(`\n[3] Testing Database Hashing & Storage Security`);
    const [otpDbRows] = await conn.execute(
      `SELECT * FROM otp_verifications WHERE user_id = ? AND purpose = 'bank_account_link' ORDER BY id DESC LIMIT 1`,
      [testUser.id]
    );
    assert(otpDbRows.length === 1, 'OTP verification record found in database');
    const otpRow = otpDbRows[0];
    assert(otpRow.otp_hash.startsWith('$2b$'), 'OTP is hashed with bcrypt ($2b$) in database');
    assert(otpRow.otp === undefined, 'Plain text otp column does not exist or is not used');

    const [bankDbRows] = await conn.execute(`SELECT * FROM bank_accounts WHERE id = ?`, [bankAccountId]);
    assert(bankDbRows.length === 1, 'Bank account record found');
    const bankRow = bankDbRows[0];
    assert(bankRow.status === 'pending', 'Initial status is pending');
    const providerToken = JSON.parse(bankRow.provider_token || '{}');
    assert(providerToken.otp === undefined, 'Provider token JSON contains NO plain text OTP');

    console.log(`\n[4] Testing Incorrect OTP Verification & Max 5 Attempts`);
    // Attempt 1 wrong OTP
    const wrongRes1 = await fetch(`${API_BASE}/bank-accounts/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        bankAccountId,
        otp: '000000'
      })
    });
    const wrongJson1 = await wrongRes1.json();
    assert(wrongRes1.status === 400, `Incorrect OTP returns 400 Bad Request (got ${wrongRes1.status})`);
    assert(wrongJson1.remainingAttempts === 4, `Remaining attempts is 4 (got ${wrongJson1.remainingAttempts})`);

    console.log(`\n[5] Testing POST /api/bank-accounts/resend-otp (with Email Delivery Method)`);
    // Fast-forward cooldown in DB for testing
    await conn.execute(
      `UPDATE otp_verifications SET created_at = DATE_SUB(NOW(), INTERVAL 65 SECOND) WHERE user_id = ?`,
      [testUser.id]
    );

    const resendEmailRes = await fetch(`${API_BASE}/bank-accounts/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        bankAccountId,
        deliveryMethod: 'email'
      })
    });
    const resendEmailJson = await resendEmailRes.json();
    assert(resendEmailRes.status === 200, `Resend OTP with email returns 200 OK (got ${resendEmailRes.status})`);
    assert(resendEmailJson.data.deliveryMethod === 'email', 'Delivery method set to email');
    assert(resendEmailJson.data.devOtp === undefined, 'CRITICAL: resendOtp response does NOT leak devOtp');
    assert(resendEmailJson.data.resendCooldown === 60, 'Resend cooldown is 60s');
    assert(resendEmailJson.data.resendCount === 1, 'Resend count is 1');

    console.log(`\n[6] Testing Correct OTP Verification & Transition to demo_verified`);
    // Verify using dev test OTP (123456) or simulated bcrypt match
    const verifyRes = await fetch(`${API_BASE}/bank-accounts/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        bankAccountId,
        otp: '123456'
      })
    });
    const verifyJson = await verifyRes.json();
    assert(verifyRes.status === 200, `Verification returns 200 OK (got ${verifyRes.status})`);
    assert(verifyJson.success === true, 'Verification success is true');

    const [updatedBank] = await conn.execute(`SELECT status, is_primary FROM bank_accounts WHERE id = ?`, [bankAccountId]);
    assert(updatedBank[0].status === 'demo_verified', `Status updated to 'demo_verified' (got '${updatedBank[0].status}')`);

    const [verifiedOtpRow] = await conn.execute(
      `SELECT verified_at FROM otp_verifications WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
      [testUser.id]
    );
    assert(verifiedOtpRow[0].verified_at !== null, 'OTP is invalidated with verified_at timestamp to prevent replay');

    console.log(`\n[7] Testing OTP Reuse Prevention`);
    const reuseRes = await fetch(`${API_BASE}/bank-accounts/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        bankAccountId,
        otp: '123456'
      })
    });
    const reuseJson = await reuseRes.json();
    assert(
      reuseRes.status === 200 && reuseJson.message.includes('already verified'),
      'Subsequent verification recognizes already-verified status'
    );

    // Clean up test bank account and associated upi_handle
    await conn.execute(`DELETE FROM upi_handles WHERE bank_account_id = ?`, [bankAccountId]);
    await conn.execute(`DELETE FROM bank_accounts WHERE id = ?`, [bankAccountId]);

    console.log(`\n======================================================`);
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`======================================================\n`);

  } catch (err) {
    console.error('Test error:', err);
    failed++;
  } finally {
    await conn.end();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
