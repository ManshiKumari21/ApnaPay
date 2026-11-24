const db = require("../config/db");
const QRCode = require("qrcode");

async function test() {
  try {
    // 1. Stats
    const [qrStats] = await db.query(`
      SELECT
        COUNT(*) as total_qrs,
        COALESCE(SUM(CASE WHEN LOWER(status) = 'active' THEN 1 ELSE 0 END), 0) as active_qrs
      FROM qr_codes
    `);
    const [reqStats] = await db.query(`
      SELECT
        COUNT(*) as total_requests,
        COALESCE(SUM(CASE WHEN LOWER(status) = 'paid' THEN amount ELSE 0 END), 0) as total_collection,
        COALESCE(SUM(CASE WHEN LOWER(status) = 'pending' THEN 1 ELSE 0 END), 0) as pending_payments,
        COALESCE(SUM(CASE WHEN LOWER(status) IN ('failed', 'cancelled') THEN 1 ELSE 0 END), 0) as failed_payments
      FROM qr_payment_requests
    `);
    console.log("Stats:", { ...qrStats[0], ...reqStats[0] });

    // 2. QRs with aggregation
    const [qrs] = await db.query(`
      SELECT
        q.id, q.public_id, q.qr_reference, q.qr_type,
        COALESCE(q.fixed_amount, q.amount) as fixed_amount,
        COALESCE(q.purpose, q.title, 'Merchant Store') as purpose,
        q.status, q.created_at,
        COALESCE(u.full_name, 'Merchant User') as merchant_name,
        u.email as merchant_email,
        COUNT(r.id) as scan_count,
        COALESCE(SUM(CASE WHEN LOWER(r.status) = 'paid' THEN r.amount ELSE 0 END), 0) as total_collection
      FROM qr_codes q
      LEFT JOIN users u ON q.user_id = u.id
      LEFT JOIN qr_payment_requests r ON r.qr_id = q.id
      GROUP BY q.id
      ORDER BY q.id DESC
    `);
    console.log("QRs count:", qrs.length, "Sample QR:", qrs[0]);

    // 3. Requests with joins
    const [requests] = await db.query(`
      SELECT
        r.id, r.qr_id, r.amount, r.status, r.reference_id, r.created_at,
        q.qr_type, q.qr_reference,
        COALESCE(q.purpose, q.title, 'Merchant Store') as purpose,
        COALESCE(u_merchant.full_name, 'Merchant') as merchant_name,
        COALESCE(u_payer.full_name, CONCAT('Payer #', r.payer_user_id)) as payer_name,
        COALESCE(t.transaction_reference, CONCAT('TXN-QR-', r.id)) as transaction_reference,
        COALESCE(t.status, 'pending') as transaction_status
      FROM qr_payment_requests r
      LEFT JOIN qr_codes q ON r.qr_id = q.id
      LEFT JOIN users u_merchant ON q.user_id = u_merchant.id
      LEFT JOIN users u_payer ON r.payer_user_id = u_payer.id
      LEFT JOIN qr_transactions t ON t.request_id = r.id
      ORDER BY r.id DESC
    `);
    console.log("Requests count:", requests.length, "Sample request:", requests[0]);

    // 4. Test QRCode generation
    const qrImage = await QRCode.toDataURL("http://localhost:5173/pay/" + qrs[0].qr_reference);
    console.log("QR DataURL generated, length:", qrImage.length);

    process.exit(0);
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

test();
