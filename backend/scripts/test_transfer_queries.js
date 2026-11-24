const db = require("../config/db");

async function test() {
  try {
    const [rows] = await db.query(`
      SELECT 
        t.id, t.payment_id, t.sender_user_id, t.receiver_user_id,
        t.receiver_upi_id, t.receiver_account_last4, t.amount, t.status,
        t.transfer_mode, t.beneficiary_name, t.ifsc_code, t.fee,
        t.provider_reference, t.failure_reason, t.created_at, t.completed_at,
        p.status as payment_status, p.currency, p.provider_reference as payment_provider_reference,
        COALESCE(u_sender.full_name, 'Customer') as sender_name,
        u_sender.email as sender_email, u_sender.phone as sender_phone,
        COALESCE(t.beneficiary_name, u_recv.full_name, 'Beneficiary') as resolved_beneficiary_name
      FROM transfers t
      LEFT JOIN payments p ON p.id = t.payment_id
      LEFT JOIN users u_sender ON u_sender.id = t.sender_user_id
      LEFT JOIN users u_recv ON u_recv.id = t.receiver_user_id
      ORDER BY t.created_at DESC
    `);
    console.log("Query success! Total rows:", rows.length);
    console.log("Sample row:", rows[0]);

    // Test stats query
    const [stats] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN LOWER(status) IN ('successful', 'success', 'completed') THEN 1 ELSE 0 END) AS successful,
        SUM(CASE WHEN LOWER(status) IN ('pending', 'initiated', 'processing') THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN LOWER(status) IN ('failed', 'cancelled', 'reversed') THEN 1 ELSE 0 END) AS failed,
        COALESCE(SUM(amount), 0) AS totalAmount,
        COALESCE(SUM(fee), 0) AS totalFees
      FROM transfers
    `);
    console.log("Stats query result:", stats[0]);

    // Test mode distribution query
    const [modes] = await db.query(`
      SELECT
        UPPER(COALESCE(transfer_mode, 'UPI')) AS mode,
        COUNT(*) AS count,
        COALESCE(SUM(amount), 0) AS amount,
        COALESCE(SUM(fee), 0) AS fee
      FROM transfers
      GROUP BY UPPER(COALESCE(transfer_mode, 'UPI'))
    `);
    console.log("Modes breakdown:", modes);

    process.exit(0);
  } catch (e) {
    console.error("SQL Error:", e);
    process.exit(1);
  }
}

test();
