const db = require("../config/db");
const { randomUUID } = require("crypto");

async function seedQrs() {
  try {
    const [countRows] = await db.query("SELECT COUNT(*) as count FROM qr_codes");
    const count = countRows[0].count;

    console.log("Current QR codes count in DB:", count);

    // If count is less than 10, seed more QRs and requests
    if (count < 10) {
      console.log("Enriching QR database with multi-merchant static and dynamic QRs...");

      const qrList = [
        {
          user_id: 7, // Manshi
          qr_type: "static",
          purpose: "Manshi Supermart Counter QR",
          fixed_amount: null,
          status: "active",
          created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000)
        },
        {
          user_id: 2, // Amit Kumar Verma
          qr_type: "static",
          purpose: "Verma Electronics POS Terminal",
          fixed_amount: null,
          status: "active",
          created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000)
        },
        {
          user_id: 6, // Priya Patel
          qr_type: "static",
          purpose: "Priya Fashion & Boutique Counter",
          fixed_amount: null,
          status: "active",
          created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000)
        },
        {
          user_id: 9, // Gopal Parmar
          qr_type: "static",
          purpose: "Parmar Hardware & Paints",
          fixed_amount: null,
          status: "active",
          created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000)
        },
        {
          user_id: 4, // Rahul Mehra
          qr_type: "static",
          purpose: "Mehra Wholesale Agro Terminal",
          fixed_amount: null,
          status: "inactive",
          created_at: new Date(Date.now() - 25 * 24 * 3600 * 1000)
        },
        {
          user_id: 7, // Manshi
          qr_type: "dynamic",
          purpose: "Invoice #INV-2026-9021",
          fixed_amount: 850.00,
          status: "active",
          created_at: new Date(Date.now() - 4 * 3600 * 1000)
        },
        {
          user_id: 6, // Priya Patel
          qr_type: "dynamic",
          purpose: "Order Slip #ORD-4412",
          fixed_amount: 1450.00,
          status: "active",
          created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000)
        },
        {
          user_id: 9, // Gopal Parmar
          qr_type: "dynamic",
          purpose: "Bill #BL-8819",
          fixed_amount: 3200.00,
          status: "active",
          created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000)
        }
      ];

      for (const q of qrList) {
        const ref = randomUUID();
        await db.query(`
          INSERT INTO qr_codes (
            user_id, public_id, qr_reference, qr_type,
            fixed_amount, purpose, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          q.user_id, ref, ref, q.qr_type,
          q.fixed_amount, q.purpose, q.status, q.created_at
        ]);
      }
    }

    // Now seed QR payment requests and transactions
    const [reqCountRows] = await db.query("SELECT COUNT(*) as count FROM qr_payment_requests");
    const reqCount = reqCountRows[0].count;
    console.log("Current QR payment requests count in DB:", reqCount);

    if (reqCount < 15) {
      console.log("Seeding realistic QR scan requests and payment transactions...");
      const [allQrs] = await db.query("SELECT id, user_id, qr_type, fixed_amount, purpose FROM qr_codes");

      const requestsToSeed = [
        // Today requests
        {
          qr_id: allQrs[0].id,
          payer_user_id: 2, // Amit
          amount: 650.00,
          status: "paid",
          reference_id: randomUUID(),
          created_at: new Date(Date.now() - 1 * 3600 * 1000)
        },
        {
          qr_id: allQrs[0].id,
          payer_user_id: 3, // Sunita
          amount: 1200.00,
          status: "paid",
          reference_id: randomUUID(),
          created_at: new Date(Date.now() - 3 * 3600 * 1000)
        },
        {
          qr_id: allQrs[1].id,
          payer_user_id: 1, // Rahul
          amount: 450.00,
          status: "pending",
          reference_id: randomUUID(),
          created_at: new Date(Date.now() - 30 * 60 * 1000)
        },
        {
          qr_id: allQrs[2].id,
          payer_user_id: 7, // Manshi
          amount: 2100.00,
          status: "paid",
          reference_id: randomUUID(),
          created_at: new Date(Date.now() - 5 * 3600 * 1000)
        },
        // Yesterday requests
        {
          qr_id: allQrs[1].id,
          payer_user_id: 5, // Deepak
          amount: 3500.00,
          status: "paid",
          reference_id: randomUUID(),
          created_at: new Date(Date.now() - 26 * 3600 * 1000)
        },
        {
          qr_id: allQrs[3].id,
          payer_user_id: 4, // Rahul Mehra
          amount: 480.00,
          status: "failed",
          reference_id: randomUUID(),
          created_at: new Date(Date.now() - 28 * 3600 * 1000)
        },
        // Past 7 days
        {
          qr_id: allQrs[2].id,
          payer_user_id: 1, // Rahul
          amount: 1850.00,
          status: "paid",
          reference_id: randomUUID(),
          created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000)
        },
        {
          qr_id: allQrs[0].id,
          payer_user_id: 6, // Priya
          amount: 920.00,
          status: "paid",
          reference_id: randomUUID(),
          created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000)
        },
        {
          qr_id: allQrs[3].id,
          payer_user_id: 2, // Amit
          amount: 5400.00,
          status: "paid",
          reference_id: randomUUID(),
          created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000)
        },
        {
          qr_id: allQrs[1].id,
          payer_user_id: 9, // Gopal
          amount: 350.00,
          status: "pending",
          reference_id: randomUUID(),
          created_at: new Date(Date.now() - 20 * 60 * 1000)
        },
        {
          qr_id: allQrs[2].id,
          payer_user_id: 3, // Sunita
          amount: 2800.00,
          status: "paid",
          reference_id: randomUUID(),
          created_at: new Date(Date.now() - 6 * 24 * 3600 * 1000)
        },
        // Past 15-30 days
        {
          qr_id: allQrs[0].id,
          payer_user_id: 4, // Rahul Mehra
          amount: 1500.00,
          status: "paid",
          reference_id: randomUUID(),
          created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000)
        },
        {
          qr_id: allQrs[1].id,
          payer_user_id: 6, // Priya
          amount: 7200.00,
          status: "paid",
          reference_id: randomUUID(),
          created_at: new Date(Date.now() - 18 * 24 * 3600 * 1000)
        },
        {
          qr_id: allQrs[3].id,
          payer_user_id: 7, // Manshi
          amount: 1650.00,
          status: "paid",
          reference_id: randomUUID(),
          created_at: new Date(Date.now() - 22 * 24 * 3600 * 1000)
        }
      ];

      for (const req of requestsToSeed) {
        const [res] = await db.query(`
          INSERT INTO qr_payment_requests (
            qr_id, payer_user_id, amount, status, reference_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          req.qr_id, req.payer_user_id, req.amount, req.status, req.reference_id, req.created_at
        ]);

        const requestId = res.insertId;

        if (req.status === "paid") {
          const txnRef = "TXN-QR-" + randomUUID().substring(0, 8).toUpperCase();
          await db.query(`
            INSERT INTO qr_transactions (
              request_id, transaction_reference, amount, status, created_at
            ) VALUES (?, ?, ?, 'success', ?)
          `, [
            requestId, txnRef, req.amount, req.created_at
          ]);
        }
      }
    }

    const [finalQrs] = await db.query("SELECT COUNT(*) as total FROM qr_codes");
    const [finalReqs] = await db.query("SELECT COUNT(*) as total FROM qr_payment_requests");
    const [finalTxns] = await db.query("SELECT COUNT(*) as total FROM qr_transactions");

    console.log("DB Stats -> QRs:", finalQrs[0].total, "Requests:", finalReqs[0].total, "Transactions:", finalTxns[0].total);
    process.exit(0);
  } catch (err) {
    console.error("Seed QRs error:", err);
    process.exit(1);
  }
}

seedQrs();
