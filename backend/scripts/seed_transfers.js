const db = require("../config/db");
const { randomUUID } = require("crypto");

async function seedTransfers() {
  try {
    // 1. Update existing row 1 and 2
    await db.query(`
      UPDATE transfers SET
        beneficiary_name = 'Merchant Services Ltd',
        transfer_mode = 'UPI',
        ifsc_code = 'HDFC0001234',
        fee = 0.00,
        provider_reference = 'UPI_TRF_1001',
        status = 'pending'
      WHERE id = 1
    `);

    await db.query(`
      UPDATE transfers SET
        beneficiary_name = 'Neha Gupta',
        transfer_mode = 'IMPS',
        ifsc_code = 'SBIN0004567',
        fee = 5.00,
        provider_reference = 'IMPS_TRF_1002',
        failure_reason = 'Cancelled by sender',
        status = 'cancelled'
      WHERE id = 2
    `);

    // Check count of transfers
    const [countRows] = await db.query("SELECT COUNT(*) as count FROM transfers");
    const count = countRows[0].count;

    if (count < 15) {
      console.log("Seeding rich real transfers dataset across modes and statuses...");
      const transfersData = [
        {
          sender_user_id: 1, // Rahul Sharma
          receiver_user_id: 6, // Priya Patel
          receiver_upi_id: "priya.patel@okaxis",
          receiver_account_last4: "4521",
          amount: 5000.00,
          status: "successful",
          transfer_mode: "UPI",
          beneficiary_name: "Priya Patel",
          ifsc_code: "UTIB0000123",
          fee: 0.00,
          provider_reference: "UPI_9921478201",
          failure_reason: null,
          created_at: new Date(Date.now() - 2 * 3600 * 1000), // Today 2 hours ago
          completed_at: new Date(Date.now() - 2 * 3600 * 1000 + 4000)
        },
        {
          sender_user_id: 1, // Rahul Sharma
          receiver_user_id: 5, // Deepak Kumar
          receiver_upi_id: "deepak.k@paytm",
          receiver_account_last4: "8821",
          amount: 2500.00,
          status: "failed",
          transfer_mode: "UPI",
          beneficiary_name: "Deepak Kumar",
          ifsc_code: "PYTM0123456",
          fee: 0.00,
          provider_reference: "UPI_9921478202",
          failure_reason: "Beneficiary bank server timeout (U19)",
          created_at: new Date(Date.now() - 4 * 3600 * 1000), // Today 4 hours ago
          completed_at: null
        },
        {
          sender_user_id: 7, // Manshi
          receiver_user_id: 2, // Amit Kumar Verma
          receiver_upi_id: null,
          receiver_account_last4: "9012",
          amount: 18500.00,
          status: "successful",
          transfer_mode: "IMPS",
          beneficiary_name: "Amit Kumar Verma",
          ifsc_code: "ICIC0000045",
          fee: 5.90,
          provider_reference: "IMPS_2026112301",
          failure_reason: null,
          created_at: new Date(Date.now() - 6 * 3600 * 1000), // Today 6 hours ago
          completed_at: new Date(Date.now() - 6 * 3600 * 1000 + 15000)
        },
        {
          sender_user_id: 7, // Manshi
          receiver_user_id: 9, // Gopal Parmar
          receiver_upi_id: "gopalper@okhdfcbank",
          receiver_account_last4: "7741",
          amount: 4200.00,
          status: "processing",
          transfer_mode: "UPI",
          beneficiary_name: "Gopal Parmar",
          ifsc_code: "HDFC0000001",
          fee: 0.00,
          provider_reference: "UPI_2026112302",
          failure_reason: null,
          created_at: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
          completed_at: null
        },
        {
          sender_user_id: 4, // Rahul Mehra
          receiver_user_id: null,
          receiver_upi_id: null,
          receiver_account_last4: "4582",
          amount: 150000.00,
          status: "successful",
          transfer_mode: "RTGS",
          beneficiary_name: "Mehra Agro Tech Pvt Ltd",
          ifsc_code: "HDFC0000240",
          fee: 29.50,
          provider_reference: "RTGS_RBI_992147",
          failure_reason: null,
          created_at: new Date(Date.now() - 24 * 3600 * 1000), // Yesterday
          completed_at: new Date(Date.now() - 24 * 3600 * 1000 + 120000)
        },
        {
          sender_user_id: 3, // Sunita Devi Sharma
          receiver_user_id: 1, // Rahul Sharma
          receiver_upi_id: null,
          receiver_account_last4: "3319",
          amount: 45000.00,
          status: "successful",
          transfer_mode: "NEFT",
          beneficiary_name: "Rahul Sharma",
          ifsc_code: "SBIN0001122",
          fee: 2.50,
          provider_reference: "NEFT_N2026112288",
          failure_reason: null,
          created_at: new Date(Date.now() - 36 * 3600 * 1000), // Yesterday
          completed_at: new Date(Date.now() - 35 * 3600 * 1000)
        },
        {
          sender_user_id: 9, // Gopal Parmar
          receiver_user_id: null,
          receiver_upi_id: null,
          receiver_account_last4: "6654",
          amount: 75000.00,
          status: "reversed",
          transfer_mode: "IMPS",
          beneficiary_name: "Karan Johar Supplies",
          ifsc_code: "PUNB0123000",
          fee: 5.90,
          provider_reference: "IMPS_2026112108",
          failure_reason: "Account closed or invalid account number (M4)",
          created_at: new Date(Date.now() - 48 * 3600 * 1000), // 2 days ago
          completed_at: new Date(Date.now() - 47 * 3600 * 1000)
        },
        {
          sender_user_id: 3, // Sunita Devi Sharma
          receiver_user_id: 2, // Amit Kumar Verma
          receiver_upi_id: "amit.verma@oksbi",
          receiver_account_last4: "1123",
          amount: 1200.00,
          status: "successful",
          transfer_mode: "UPI",
          beneficiary_name: "Amit Kumar Verma",
          ifsc_code: "SBIN0000555",
          fee: 0.00,
          provider_reference: "UPI_9921478205",
          failure_reason: null,
          created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000), // 3 days ago
          completed_at: new Date(Date.now() - 3 * 24 * 3600 * 1000 + 3000)
        },
        {
          sender_user_id: 2, // Amit Kumar Verma
          receiver_user_id: 7, // Manshi
          receiver_upi_id: "manshigupta2103@okhdfcbank",
          receiver_account_last4: "8899",
          amount: 8900.00,
          status: "successful",
          transfer_mode: "IMPS",
          beneficiary_name: "Manshi",
          ifsc_code: "HDFC0000045",
          fee: 5.90,
          provider_reference: "IMPS_2026111904",
          failure_reason: null,
          created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000), // 4 days ago
          completed_at: new Date(Date.now() - 4 * 24 * 3600 * 1000 + 8000)
        },
        {
          sender_user_id: 5, // Deepak Kumar
          receiver_user_id: null,
          receiver_upi_id: null,
          receiver_account_last4: "9901",
          amount: 220000.00,
          status: "successful",
          transfer_mode: "RTGS",
          beneficiary_name: "Apex Infrastructure Corp",
          ifsc_code: "KKBK0000109",
          fee: 29.50,
          provider_reference: "RTGS_RBI_994821",
          failure_reason: null,
          created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000), // 5 days ago
          completed_at: new Date(Date.now() - 5 * 24 * 3600 * 1000 + 180000)
        },
        {
          sender_user_id: 1, // Rahul Sharma
          receiver_user_id: 3, // Sunita Devi Sharma
          receiver_upi_id: null,
          receiver_account_last4: "4412",
          amount: 32000.00,
          status: "successful",
          transfer_mode: "NEFT",
          beneficiary_name: "Sunita Devi Sharma",
          ifsc_code: "BARB0DELHIX",
          fee: 2.50,
          provider_reference: "NEFT_N2026111755",
          failure_reason: null,
          created_at: new Date(Date.now() - 6 * 24 * 3600 * 1000), // 6 days ago
          completed_at: new Date(Date.now() - 6 * 24 * 3600 * 1000 + 3600000)
        },
        {
          sender_user_id: 6, // Priya Patel
          receiver_user_id: 1, // Rahul Sharma
          receiver_upi_id: "rahul@okhdfcbank",
          receiver_account_last4: "5512",
          amount: 6500.00,
          status: "initiated",
          transfer_mode: "UPI",
          beneficiary_name: "Rahul Sharma",
          ifsc_code: "HDFC0000001",
          fee: 0.00,
          provider_reference: "UPI_2026112399",
          failure_reason: null,
          created_at: new Date(Date.now() - 10 * 60 * 1000), // 10 mins ago
          completed_at: null
        },
        {
          sender_user_id: 4, // Rahul Mehra
          receiver_user_id: 5, // Deepak Kumar
          receiver_upi_id: null,
          receiver_account_last4: "7701",
          amount: 14000.00,
          status: "successful",
          transfer_mode: "IMPS",
          beneficiary_name: "Deepak Kumar",
          ifsc_code: "YESB0000011",
          fee: 5.90,
          provider_reference: "IMPS_2026111502",
          failure_reason: null,
          created_at: new Date(Date.now() - 8 * 24 * 3600 * 1000), // 8 days ago
          completed_at: new Date(Date.now() - 8 * 24 * 3600 * 1000 + 10000)
        },
        {
          sender_user_id: 2, // Amit Kumar Verma
          receiver_user_id: null,
          receiver_upi_id: null,
          receiver_account_last4: "8841",
          amount: 250000.00,
          status: "successful",
          transfer_mode: "RTGS",
          beneficiary_name: "Titanium Metal Works",
          ifsc_code: "SBIN0000691",
          fee: 29.50,
          provider_reference: "RTGS_RBI_991102",
          failure_reason: null,
          created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000), // 12 days ago
          completed_at: new Date(Date.now() - 12 * 24 * 3600 * 1000 + 200000)
        },
        {
          sender_user_id: 3, // Sunita Devi Sharma
          receiver_user_id: 7, // Manshi
          receiver_upi_id: "manshi@okhdfcbank",
          receiver_account_last4: "2019",
          amount: 1500.00,
          status: "failed",
          transfer_mode: "UPI",
          beneficiary_name: "Manshi",
          ifsc_code: "HDFC0000045",
          fee: 0.00,
          provider_reference: "UPI_2026111003",
          failure_reason: "Exceeded daily transaction limit for payer",
          created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000), // 15 days ago
          completed_at: null
        },
        {
          sender_user_id: 7, // Manshi
          receiver_user_id: 6, // Priya Patel
          receiver_upi_id: null,
          receiver_account_last4: "6612",
          amount: 60000.00,
          status: "successful",
          transfer_mode: "NEFT",
          beneficiary_name: "Priya Patel",
          ifsc_code: "UTIB0000123",
          fee: 2.50,
          provider_reference: "NEFT_N2026110822",
          failure_reason: null,
          created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000), // 20 days ago
          completed_at: new Date(Date.now() - 20 * 24 * 3600 * 1000 + 4000000)
        }
      ];

      for (const t of transfersData) {
        // First insert payment
        const [payRes] = await db.query(`
          INSERT INTO payments (
            public_id, user_id, provider_id, payment_method,
            amount, currency, status, provider_reference, description, created_at
          ) VALUES (?, ?, 1, ?, ?, 'INR', ?, ?, ?, ?)
        `, [
          randomUUID(),
          t.sender_user_id,
          t.transfer_mode.toLowerCase(),
          t.amount,
          t.status,
          t.provider_reference,
          `Transfer to ${t.beneficiary_name}`,
          t.created_at
        ]);

        const paymentId = payRes.insertId;

        // Then insert transfer
        await db.query(`
          INSERT INTO transfers (
            payment_id, sender_user_id, receiver_user_id, receiver_upi_id,
            receiver_account_last4, amount, status, transfer_mode, beneficiary_name,
            ifsc_code, fee, provider_reference, failure_reason, created_at, completed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          paymentId, t.sender_user_id, t.receiver_user_id, t.receiver_upi_id,
          t.receiver_account_last4, t.amount, t.status, t.transfer_mode, t.beneficiary_name,
          t.ifsc_code, t.fee, t.provider_reference, t.failure_reason, t.created_at, t.completed_at
        ]);
      }
      console.log(`Successfully seeded ${transfersData.length} realistic transfers with matching payments!`);
    }

    const [finalRows] = await db.query("SELECT COUNT(*) as total FROM transfers");
    console.log("Total transfers in database:", finalRows[0].total);
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seedTransfers();
