require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../config/db');

async function seedData() {
  console.log('--- Starting Realistic Fintech Data Seeding ---');
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Get existing users
    const [users] = await conn.execute('SELECT id, full_name, email, phone FROM users ORDER BY id ASC');
    console.log(`Found ${users.length} users.`);
    if (users.length === 0) {
      console.log('No users found, skipping.');
      await conn.rollback();
      process.exit(0);
    }

    const u1 = users[0].id;
    const u2 = users[1] ? users[1].id : u1;
    const u3 = users[2] ? users[2].id : u1;
    const u4 = users[3] ? users[3].id : u1;

    // 2. Ensure Wallets exist for users
    console.log('Ensuring wallets for users...');
    for (const u of users) {
      const [existingWallet] = await conn.execute('SELECT id FROM wallets WHERE user_id = ?', [u.id]);
      if (existingWallet.length === 0) {
        const bal = (Math.floor(Math.random() * 500) + 10) * 100; // e.g. 1000 - 50000
        await conn.execute(
          'INSERT INTO wallets (user_id, currency, available_balance, status) VALUES (?, ?, ?, ?)',
          [u.id, 'INR', bal, 'active']
        );
      }
    }
    console.log('  -> Wallets populated.');

    // 3. Ensure Transactions table has realistic historical data across last 7 days
    const [txnCount] = await conn.execute('SELECT COUNT(*) as c FROM transactions');
    if (txnCount[0].c < 10) {
      console.log('Seeding transactions across services...');
      const sampleTxns = [
        { u: u1, type: 'transfer', amt: 5000, status: 'success', desc: 'Money Transfer to Priya Verma', daysAgo: 0, hr: 10, min: 32 },
        { u: u2, type: 'recharge', amt: 299, status: 'success', desc: 'Jio Prepaid Mobile Recharge (9876543210)', daysAgo: 0, hr: 10, min: 21 },
        { u: u3, type: 'bill_payment', amt: 1250, status: 'pending', desc: 'Tata Power Electricity Bill Payment', daysAgo: 0, hr: 10, min: 15 },
        { u: u4, type: 'sip', amt: 10000, status: 'success', desc: 'HDFC Top 100 SIP Monthly Mandate', daysAgo: 0, hr: 9, min: 58 },
        { u: u1, type: 'transfer', amt: 2500, status: 'failed', desc: 'P2P UPI Transfer to Sandeep Yadav', daysAgo: 0, hr: 9, min: 42 },
        { u: u2, type: 'payment', amt: 450, status: 'success', desc: 'Merchant QR Scan & Pay at Cafe Coffee Day', daysAgo: 0, hr: 8, min: 15 },
        { u: u3, type: 'recharge', amt: 499, status: 'success', desc: 'Airtel DTH 3-Month Entertainment Pack', daysAgo: 1, hr: 16, min: 20 },
        { u: u1, type: 'bill_payment', amt: 850, status: 'success', desc: 'Indraprastha Gas Limited PNG Bill', daysAgo: 1, hr: 14, min: 10 },
        { u: u4, type: 'transfer', amt: 15000, status: 'success', desc: 'Bank Payout to HDFC A/C **4582', daysAgo: 2, hr: 11, min: 30 },
        { u: u2, type: 'sip', amt: 5000, status: 'success', desc: 'SBI Bluechip Fund Regular SIP', daysAgo: 2, hr: 12, min: 45 },
        { u: u3, type: 'payment', amt: 3200, status: 'success', desc: 'Online Checkout Payment via ApnaPay Gateway', daysAgo: 3, hr: 15, min: 0 },
        { u: u1, type: 'land_order', amt: 25000, status: 'success', desc: 'Smart City Phase 1 Digital Land Token Registry', daysAgo: 3, hr: 17, min: 30 },
        { u: u2, type: 'recharge', amt: 666, status: 'success', desc: 'Vi Unlimited Hero Recharge 84 Days', daysAgo: 4, hr: 10, min: 5 },
        { u: u4, type: 'bill_payment', amt: 2450, status: 'success', desc: 'Delhi Jal Board Water Utility Bill', daysAgo: 4, hr: 13, min: 25 },
        { u: u3, type: 'transfer', amt: 1200, status: 'success', desc: 'Wallet P2P Transfer to Amit Verma', daysAgo: 5, hr: 18, min: 40 },
        { u: u1, type: 'payment', amt: 7800, status: 'success', desc: 'Electronics Store QR Payment', daysAgo: 5, hr: 19, min: 15 },
        { u: u2, type: 'sip', amt: 2500, status: 'success', desc: 'Nippon India Small Cap Fund SIP Mandate', daysAgo: 6, hr: 9, min: 0 },
        { u: u4, type: 'bill_payment', amt: 1850, status: 'success', desc: 'Airtel Xstream Fiber Broadband Bill', daysAgo: 6, hr: 11, min: 10 }
      ];

      for (const t of sampleTxns) {
        const d = new Date();
        d.setDate(d.getDate() - t.daysAgo);
        d.setHours(t.hr, t.min, 0, 0);

        await conn.execute(
          `INSERT INTO transactions (user_id, transaction_type, amount, status, description, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [t.u, t.type, t.amt, t.status, t.desc, d]
        );
      }
      console.log(`  -> Seeded ${sampleTxns.length} realistic transactions.`);
    }

    // 4. Ensure Payments table has synchronized records
    const [payCount] = await conn.execute('SELECT COUNT(*) as c FROM payments');
    if (payCount[0].c < 10) {
      console.log('Seeding additional payments...');
      const [txns] = await conn.execute("SELECT id, user_id, amount, status, description, created_at FROM transactions WHERE transaction_type IN ('payment', 'recharge', 'bill_payment', 'transfer') LIMIT 12");
      for (const t of txns) {
        const pubId = require('crypto').randomUUID();
        const [existing] = await conn.execute('SELECT id FROM payments WHERE public_id = ?', [pubId]);
        if (existing.length === 0) {
          await conn.execute(
            `INSERT INTO payments (public_id, user_id, provider_id, payment_method, amount, currency, status, provider_reference, description, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [pubId, t.user_id, 1, 'upi', t.amount, 'INR', t.status === 'success' ? 'succeeded' : t.status, `TXN_AP_${t.id}_${Date.now().toString().slice(-4)}`, t.description, t.created_at]
          );
        }
      }
      console.log('  -> Payments table updated.');
    }

    // 5. Ensure Disputes table has 2-3 sample disputes
    const [dispCount] = await conn.execute('SELECT COUNT(*) as c FROM disputes');
    if (dispCount[0].c === 0) {
      console.log('Seeding sample disputes...');
      await conn.execute(`
        INSERT INTO disputes (user_id, payment_id, dispute_reason, description, status, resolution_notes, created_at)
        VALUES 
        (?, 1, 'TRANSACTION_FAILED', 'Amount deducted but electricity bill receipt not generated by provider', 'pending', NULL, NOW()),
        (?, 2, 'DUPLICATE_CHARGE', 'Duplicate recharge transaction debited twice', 'resolved', 'Refund of ₹299 processed to user wallet', DATE_SUB(NOW(), INTERVAL 2 DAY)),
        (?, 1, 'UNAUTHORIZED_PAYMENT', 'Merchant QR scanned twice by mistake at store checkout', 'pending', NULL, DATE_SUB(NOW(), INTERVAL 1 DAY))
      `, [u1, u2, u3]);
      console.log('  -> Seeded 3 disputes.');
    }

    // 6. Ensure Recharge Orders
    const [rchCount] = await conn.execute('SELECT COUNT(*) as c FROM recharge_orders');
    if (rchCount[0].c < 5) {
      console.log('Seeding sample recharge orders...');
      await conn.execute(`
        INSERT INTO recharge_orders (user_id, operator_id, mobile_number, amount, provider_reference, status, created_at)
        VALUES 
        (?, 1, '9876543210', 299.00, 'RCH_JIO_99214', 'success', NOW()),
        (?, 2, '9123456789', 499.00, 'RCH_AIR_88192', 'success', DATE_SUB(NOW(), INTERVAL 1 DAY)),
        (?, 3, '9822012345', 666.00, 'RCH_VI_77123', 'success', DATE_SUB(NOW(), INTERVAL 2 DAY)),
        (?, 1, '9876543210', 50.00, 'RCH_TOP_66102', 'success', DATE_SUB(NOW(), INTERVAL 3 DAY))
      `, [u1, u2, u3, u4]);
      console.log('  -> Recharge orders seeded.');
    }

    // 7. Ensure SIP Plans
    const [sipCount] = await conn.execute('SELECT COUNT(*) as c FROM sip_plans');
    if (sipCount[0].c < 3) {
      console.log('Seeding SIP plans...');
      await conn.execute(`
        INSERT INTO sip_plans (user_id, product_id, installment_amount, frequency, start_date, next_due_date, status, created_at)
        VALUES 
        (?, 1, 5000.00, 'monthly', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'active', DATE_SUB(NOW(), INTERVAL 15 DAY)),
        (?, 1, 2500.00, 'monthly', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'active', DATE_SUB(NOW(), INTERVAL 30 DAY)),
        (?, 1, 10000.00, 'monthly', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'active', DATE_SUB(NOW(), INTERVAL 60 DAY))
      `, [u1, u2, u4]);
      console.log('  -> SIP plans seeded.');
    }

    await conn.commit();
    console.log('--- All Realistic Fintech Data Successfully Seeded! ---');
    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    await conn.rollback();
    process.exit(1);
  } finally {
    conn.release();
  }
}

seedData();
