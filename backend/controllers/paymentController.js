const db = require("../config/db");
const { randomUUID } = require("crypto");

// Fallback demo user and provider IDs
const DEMO_USER_ID = 1;
const DEMO_PROVIDER_ID = 1;

const validId = (value) =>
  Number.isInteger(Number(value)) && Number(value) > 0;

const validAmount = (value) =>
  Number.isFinite(Number(value)) && Number(value) > 0;

// =====================================
// 1. CREATE PAYMENT
// POST /payments
// =====================================
exports.createPayment = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.body?.user_id || DEMO_USER_ID;
    const {
      payment_method,
      amount,
      currency = "INR",
      description = null
    } = req.body;

    if (!payment_method || !validAmount(amount)) {
      return res.status(400).json({
        success: false,
        message: "payment_method and valid amount are required"
      });
    }

    const [result] = await db.execute(
      `INSERT INTO payments
      (public_id, user_id, provider_id, payment_method,
       amount, currency, status, description)
      VALUES (?, ?, ?, ?, ?, ?, 'initiated', ?)`,
      [
        randomUUID(),
        userId,
        DEMO_PROVIDER_ID,
        payment_method,
        Number(amount),
        String(currency).toUpperCase(),
        description
      ]
    );

    const [rows] = await db.execute(
      "SELECT * FROM payments WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      payment: rows[0]
    });

  } catch (error) {
    console.error("Create Payment Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to create payment"
    });
  }
};

// =====================================
// 2. GET PAYMENT DETAILS
// GET /payments/:id
// =====================================
exports.getPayment = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user?.userId || req.user?.id || req.query?.user_id || DEMO_USER_ID;
    const isAdmin = req.user?.isAdmin || false;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID"
      });
    }

    let query = "SELECT * FROM payments WHERE id = ?";
    let params = [Number(id)];

    if (!isAdmin) {
      query += " AND user_id = ?";
      params.push(userId);
    }

    const [rows] = await db.execute(query, params);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    res.status(200).json({
      success: true,
      payment: rows[0]
    });

  } catch (error) {
    console.error("Get Payment Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch payment"
    });
  }
};

// =====================================
// 3. CONFIRM PAYMENT
// POST /payments/:id/confirm
// =====================================
exports.confirmPayment = async (req, res) => {
  let connection;

  try {
    const id = req.params.id;
    const userId = req.user?.userId || req.user?.id || DEMO_USER_ID;
    const isAdmin = req.user?.isAdmin || false;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID"
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    let query = `SELECT id, status FROM payments WHERE id = ?`;
    let params = [Number(id)];

    if (!isAdmin) {
      query += ` AND user_id = ?`;
      params.push(userId);
    }

    query += ` FOR UPDATE`;

    const [rows] = await connection.execute(query, params);

    if (rows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    const currentStatus = String(rows[0].status).toLowerCase();

    if (["cancelled", "failed"].includes(currentStatus)) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: "Payment cannot be confirmed"
      });
    }

    if (["success", "succeeded"].includes(currentStatus)) {
      await connection.rollback();

      return res.status(200).json({
        success: true,
        message: "Payment is already completed"
      });
    }

    await connection.execute(
      "UPDATE payments SET status = 'success' WHERE id = ?",
      [Number(id)]
    );

    await connection.commit();

    const [updated] = await db.execute(
      "SELECT * FROM payments WHERE id = ?",
      [Number(id)]
    );

    res.status(200).json({
      success: true,
      message: "Payment confirmed successfully",
      payment: updated[0]
    });

  } catch (error) {
    if (connection) await connection.rollback();

    console.error("Confirm Payment Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to confirm payment"
    });

  } finally {
    if (connection) connection.release();
  }
};

// =====================================
// 4. GET PAYMENT STATUS
// GET /payments/:id/status
// =====================================
exports.getPaymentStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user?.userId || req.user?.id || DEMO_USER_ID;
    const isAdmin = req.user?.isAdmin || false;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID"
      });
    }

    let query = `SELECT id, public_id, amount, currency, status, updated_at FROM payments WHERE id = ?`;
    let params = [Number(id)];

    if (!isAdmin) {
      query += ` AND user_id = ?`;
      params.push(userId);
    }

    const [rows] = await db.execute(query, params);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    res.status(200).json({
      success: true,
      payment: rows[0]
    });

  } catch (error) {
    console.error("Payment Status Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch payment status"
    });
  }
};

// =====================================
// 5. CREATE MONEY TRANSFER
// POST /transfers
// =====================================
exports.createTransfer = async (req, res) => {
  let connection;

  try {
    const senderUserId = req.user?.userId || req.user?.id || DEMO_USER_ID;
    const {
      receiver_user_id = null,
      receiver_upi_id = null,
      receiver_account_last4 = null,
      amount
    } = req.body;

    if (!validAmount(amount)) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required"
      });
    }

    if (
      !receiver_user_id &&
      !receiver_upi_id &&
      !receiver_account_last4
    ) {
      return res.status(400).json({
        success: false,
        message: "Receiver details are required"
      });
    }

    if (
      receiver_account_last4 &&
      !/^\d{4}$/.test(String(receiver_account_last4))
    ) {
      return res.status(400).json({
        success: false,
        message: "Account last 4 digits must be numeric"
      });
    }

    if (
      receiver_user_id &&
      Number(receiver_user_id) === Number(senderUserId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Sender and receiver cannot be same"
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // First create payment record
    const [payment] = await connection.execute(
      `INSERT INTO payments
      (public_id, user_id, provider_id, payment_method,
       amount, currency, status, description)
      VALUES (?, ?, ?, 'upi', ?, 'INR', 'initiated',
      'Money transfer')`,
      [
        randomUUID(),
        senderUserId,
        DEMO_PROVIDER_ID,
        Number(amount)
      ]
    );

    // Then create transfer record
    const [transfer] = await connection.execute(
      `INSERT INTO transfers
      (payment_id, sender_user_id, receiver_user_id,
       receiver_upi_id, receiver_account_last4,
       amount, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [
        payment.insertId,
        senderUserId,
        receiver_user_id ? Number(receiver_user_id) : null,
        receiver_upi_id ? String(receiver_upi_id).trim() : null,
        receiver_account_last4
          ? String(receiver_account_last4)
          : null,
        Number(amount)
      ]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Transfer request created successfully",
      transfer_id: transfer.insertId,
      payment_id: payment.insertId,
      status: "pending"
    });

  } catch (error) {
    if (connection) await connection.rollback();

    console.error("Create Transfer Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to create transfer"
    });

  } finally {
    if (connection) connection.release();
  }
};

// =====================================
// 6. GET TRANSFER DETAILS
// GET /transfers/:id
// =====================================
exports.getTransfer = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user?.userId || req.user?.id || DEMO_USER_ID;
    const isAdmin = req.user?.isAdmin || false;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transfer ID"
      });
    }

    let query = `
      SELECT
        t.*,
        p.public_id,
        p.status AS payment_status,
        p.currency,
        p.provider_reference AS payment_provider_reference,
        COALESCE(u_sender.full_name, 'Sender User') AS sender_name,
        u_sender.email AS sender_email,
        u_sender.phone AS sender_phone,
        COALESCE(t.beneficiary_name, u_recv.full_name, 'Beneficiary') AS resolved_beneficiary_name,
        u_recv.email AS receiver_email,
        u_recv.phone AS receiver_phone
       FROM transfers t
       LEFT JOIN payments p ON p.id = t.payment_id
       LEFT JOIN users u_sender ON u_sender.id = t.sender_user_id
       LEFT JOIN users u_recv ON u_recv.id = t.receiver_user_id
       WHERE t.id = ?
    `;
    let params = [Number(id)];

    if (!isAdmin) {
      query += ` AND (t.sender_user_id = ? OR t.receiver_user_id = ?)`;
      params.push(userId, userId);
    }

    const [rows] = await db.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Transfer not found"
      });
    }

    const item = rows[0];
    const createdAt = new Date(item.created_at);
    const completedAt = item.completed_at ? new Date(item.completed_at) : null;
    const currentStatus = String(item.status || "initiated").toLowerCase();

    // Construct detailed timeline
    const timeline = [
      {
        step: 1,
        title: "Transfer Initiated",
        description: `Customer ${item.sender_name} initiated ${item.transfer_mode || "UPI"} transfer of ₹${Number(item.amount).toLocaleString("en-IN")}`,
        status: "completed",
        timestamp: createdAt.toISOString()
      },
      {
        step: 2,
        title: "Bank Switch Routing",
        description: `Routed via ApnaPay Gateway / NPCI Switch (${item.provider_reference || item.payment_provider_reference || "REF_SWITCH"})`,
        status: currentStatus === "initiated" ? "in_progress" : "completed",
        timestamp: new Date(createdAt.getTime() + 1500).toISOString()
      }
    ];

    if (["successful", "success", "completed"].includes(currentStatus)) {
      timeline.push({
        step: 3,
        title: "Beneficiary Settlement Confirmed",
        description: `Credited successfully to ${item.resolved_beneficiary_name} (A/C ending with ${item.receiver_account_last4 || "UPI"})`,
        status: "completed",
        timestamp: completedAt ? completedAt.toISOString() : new Date(createdAt.getTime() + 4500).toISOString()
      });
    } else if (["failed", "cancelled"].includes(currentStatus)) {
      timeline.push({
        step: 3,
        title: "Transfer Failed / Cancelled",
        description: item.failure_reason || "Transaction rejected or timed out by beneficiary banking host.",
        status: "failed",
        timestamp: completedAt ? completedAt.toISOString() : new Date(createdAt.getTime() + 3000).toISOString()
      });
    } else if (currentStatus === "reversed") {
      timeline.push({
        step: 3,
        title: "Amount Reversed to Sender",
        description: item.failure_reason || "Funds reversed back to sender wallet/bank account.",
        status: "reversed",
        timestamp: completedAt ? completedAt.toISOString() : new Date(createdAt.getTime() + 5000).toISOString()
      });
    } else {
      timeline.push({
        step: 3,
        title: "Awaiting Settlement",
        description: "Processing response from beneficiary institution switch.",
        status: "in_progress",
        timestamp: null
      });
    }

    return res.status(200).json({
      success: true,
      transfer: {
        ...item,
        transfer_id: item.id,
        beneficiary_name: item.resolved_beneficiary_name,
        transfer_mode: (item.transfer_mode || "UPI").toUpperCase(),
        amount: Number(item.amount),
        fee: Number(item.fee || 0),
        timeline
      }
    });

  } catch (error) {
    console.error("Get Transfer Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch transfer"
    });
  }
};

// =====================================
// 6.1 GET ALL TRANSFERS (Filtered & Paginated for Admin)
// GET /transfers
// =====================================
exports.getAllTransfers = async (req, res) => {
  try {
    const {
      transfer_id,
      user_id,
      reference_id,
      beneficiary_name,
      mode,
      transfer_mode,
      status,
      min_amount,
      max_amount,
      start_date,
      end_date,
      search,
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    let whereConditions = ["1=1"];
    let params = [];

    // 1. Search across multiple fields
    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      whereConditions.push(`(
        t.id LIKE ? OR 
        t.provider_reference LIKE ? OR 
        p.provider_reference LIKE ? OR
        t.beneficiary_name LIKE ? OR 
        u_recv.full_name LIKE ? OR 
        u_sender.full_name LIKE ? OR 
        t.receiver_upi_id LIKE ? OR
        t.receiver_account_last4 LIKE ?
      )`);
      params.push(s, s, s, s, s, s, s, s);
    }

    // 2. Specific filters
    if (transfer_id && String(transfer_id).trim()) {
      whereConditions.push("t.id = ?");
      params.push(Number(transfer_id));
    }

    if (user_id && String(user_id).trim()) {
      whereConditions.push("(t.sender_user_id = ? OR t.receiver_user_id = ?)");
      params.push(Number(user_id), Number(user_id));
    }

    if (reference_id && String(reference_id).trim()) {
      const ref = `%${reference_id.trim()}%`;
      whereConditions.push("(t.provider_reference LIKE ? OR p.provider_reference LIKE ?)");
      params.push(ref, ref);
    }

    if (beneficiary_name && String(beneficiary_name).trim()) {
      const bn = `%${beneficiary_name.trim()}%`;
      whereConditions.push("(t.beneficiary_name LIKE ? OR u_recv.full_name LIKE ?)");
      params.push(bn, bn);
    }

    const selectedMode = mode || transfer_mode;
    if (selectedMode && selectedMode.toLowerCase() !== "all") {
      whereConditions.push("LOWER(COALESCE(t.transfer_mode, 'UPI')) = ?");
      params.push(selectedMode.trim().toLowerCase());
    }

    if (status && status.toLowerCase() !== "all") {
      const st = status.trim().toLowerCase();
      if (st === "successful" || st === "success") {
        whereConditions.push("LOWER(t.status) IN ('successful', 'success', 'completed')");
      } else if (st === "pending") {
        whereConditions.push("LOWER(t.status) = 'pending'");
      } else if (st === "initiated") {
        whereConditions.push("LOWER(t.status) = 'initiated'");
      } else if (st === "processing") {
        whereConditions.push("LOWER(t.status) = 'processing'");
      } else if (st === "failed") {
        whereConditions.push("LOWER(t.status) = 'failed'");
      } else if (st === "reversed") {
        whereConditions.push("LOWER(t.status) = 'reversed'");
      } else if (st === "cancelled") {
        whereConditions.push("LOWER(t.status) = 'cancelled'");
      } else {
        whereConditions.push("LOWER(t.status) = ?");
        params.push(st);
      }
    }

    if (min_amount && !isNaN(Number(min_amount))) {
      whereConditions.push("t.amount >= ?");
      params.push(Number(min_amount));
    }

    if (max_amount && !isNaN(Number(max_amount))) {
      whereConditions.push("t.amount <= ?");
      params.push(Number(max_amount));
    }

    if (start_date && String(start_date).trim()) {
      whereConditions.push("t.created_at >= ?");
      params.push(new Date(start_date));
    }

    if (end_date && String(end_date).trim()) {
      whereConditions.push("t.created_at <= ?");
      const endD = new Date(end_date);
      endD.setHours(23, 59, 59, 999);
      params.push(endD);
    }

    const whereClause = whereConditions.join(" AND ");

    // Count total filtered
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM transfers t
      LEFT JOIN payments p ON p.id = t.payment_id
      LEFT JOIN users u_sender ON u_sender.id = t.sender_user_id
      LEFT JOIN users u_recv ON u_recv.id = t.receiver_user_id
      WHERE ${whereClause}
    `;
    const [countRows] = await db.query(countQuery, params);
    const total = countRows[0]?.total || 0;

    // Fetch paginated records
    const selectQuery = `
      SELECT 
        t.id, t.payment_id, t.sender_user_id, t.receiver_user_id,
        t.receiver_upi_id, t.receiver_account_last4, t.amount, t.status,
        COALESCE(t.transfer_mode, 'UPI') AS transfer_mode,
        COALESCE(t.beneficiary_name, u_recv.full_name, 'Beneficiary') AS beneficiary_name,
        COALESCE(t.ifsc_code, 'N/A') AS ifsc_code,
        COALESCE(t.fee, 0.00) AS fee,
        COALESCE(t.provider_reference, p.provider_reference, CONCAT('TRF_', t.id)) AS provider_reference,
        t.failure_reason, t.created_at, t.completed_at,
        p.public_id, p.status AS payment_status, p.currency,
        COALESCE(u_sender.full_name, 'Customer') AS sender_name,
        u_sender.email AS sender_email, u_sender.phone AS sender_phone
      FROM transfers t
      LEFT JOIN payments p ON p.id = t.payment_id
      LEFT JOIN users u_sender ON u_sender.id = t.sender_user_id
      LEFT JOIN users u_recv ON u_recv.id = t.receiver_user_id
      WHERE ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(selectQuery, [...params, limitNum, offset]);

    // Format transfers
    const transfers = rows.map((r) => ({
      id: r.id,
      transfer_id: r.id,
      payment_id: r.payment_id,
      public_id: r.public_id,
      sender_user_id: r.sender_user_id,
      sender_name: r.sender_name,
      sender_email: r.sender_email,
      sender_phone: r.sender_phone,
      beneficiary_name: r.beneficiary_name,
      receiver_user_id: r.receiver_user_id,
      receiver_upi_id: r.receiver_upi_id,
      receiver_account_last4: r.receiver_account_last4,
      ifsc_code: r.ifsc_code,
      amount: Number(r.amount || 0),
      fee: Number(r.fee || 0),
      transfer_mode: (r.transfer_mode || "UPI").toUpperCase(),
      reference_id: r.provider_reference,
      provider_reference: r.provider_reference,
      status: (r.status || "initiated").toLowerCase(),
      failure_reason: r.failure_reason,
      created_at: r.created_at,
      completed_at: r.completed_at,
      payment_status: r.payment_status,
      currency: r.currency || "INR"
    }));

    // Calculate overall stats from whole dataset
    const [statsRows] = await db.query(`
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN LOWER(status) IN ('successful', 'success', 'completed') THEN 1 ELSE 0 END), 0) AS successful,
        COALESCE(SUM(CASE WHEN LOWER(status) IN ('pending', 'initiated', 'processing') THEN 1 ELSE 0 END), 0) AS pending,
        COALESCE(SUM(CASE WHEN LOWER(status) IN ('failed', 'cancelled', 'reversed') THEN 1 ELSE 0 END), 0) AS failed,
        COALESCE(SUM(amount), 0) AS totalAmount,
        COALESCE(SUM(fee), 0) AS totalFees
      FROM transfers
    `);

    const stats = {
      total: Number(statsRows[0]?.total || 0),
      successful: Number(statsRows[0]?.successful || 0),
      pending: Number(statsRows[0]?.pending || 0),
      failed: Number(statsRows[0]?.failed || 0),
      totalAmount: Number(statsRows[0]?.totalAmount || 0),
      totalFees: Number(statsRows[0]?.totalFees || 0)
    };

    return res.status(200).json({
      success: true,
      transfers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      },
      stats
    });
  } catch (error) {
    console.error("Get All Transfers Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch transfer records",
      error: error.message
    });
  }
};

// =====================================
// 6.2 GET TRANSFER STATS
// GET /transfers/stats
// =====================================
exports.getTransferStats = async (req, res) => {
  try {
    const [statsRows] = await db.query(`
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN LOWER(status) IN ('successful', 'success', 'completed') THEN 1 ELSE 0 END), 0) AS successful,
        COALESCE(SUM(CASE WHEN LOWER(status) IN ('pending', 'initiated', 'processing') THEN 1 ELSE 0 END), 0) AS pending,
        COALESCE(SUM(CASE WHEN LOWER(status) IN ('failed', 'cancelled', 'reversed') THEN 1 ELSE 0 END), 0) AS failed,
        COALESCE(SUM(amount), 0) AS totalAmount,
        COALESCE(SUM(fee), 0) AS totalFees
      FROM transfers
    `);

    const stats = {
      total: Number(statsRows[0]?.total || 0),
      successful: Number(statsRows[0]?.successful || 0),
      pending: Number(statsRows[0]?.pending || 0),
      failed: Number(statsRows[0]?.failed || 0),
      totalAmount: Number(statsRows[0]?.totalAmount || 0),
      totalFees: Number(statsRows[0]?.totalFees || 0)
    };

    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("Get Transfer Stats Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch transfer statistics"
    });
  }
};

// =====================================
// 6.3 GET TRANSFER ANALYTICS
// GET /transfers/analytics
// =====================================
exports.getTransferAnalytics = async (req, res) => {
  try {
    const { range = "30d", startDate, endDate } = req.query;

    let dateCondition = "1=1";
    let params = [];

    if (range === "today") {
      dateCondition = "DATE(created_at) = CURDATE()";
    } else if (range === "7d") {
      dateCondition = "created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    } else if (range === "30d") {
      dateCondition = "created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    } else if (range === "custom" && startDate && endDate) {
      dateCondition = "created_at >= ? AND created_at <= ?";
      params = [new Date(startDate), new Date(endDate)];
    }

    // Daily volume
    const [dailyRows] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d') as date,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as amount,
        COALESCE(SUM(fee), 0) as fee
      FROM transfers
      WHERE ${dateCondition}
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
      ORDER BY date ASC
    `, params);

    // Weekly volume
    const [weeklyRows] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, 'Week %u, %Y') as week,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as amount
      FROM transfers
      GROUP BY week
      ORDER BY MIN(created_at) ASC
    `);

    // Monthly volume
    const [monthlyRows] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%b %Y') as month,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as amount
      FROM transfers
      GROUP BY month
      ORDER BY MIN(created_at) ASC
    `);

    // Mode-wise distribution
    const [modeRows] = await db.query(`
      SELECT 
        UPPER(COALESCE(transfer_mode, 'UPI')) as mode,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as amount,
        COALESCE(SUM(fee), 0) as fee
      FROM transfers
      WHERE ${dateCondition}
      GROUP BY UPPER(COALESCE(transfer_mode, 'UPI'))
    `, params);

    // Status breakdown
    const [statusRows] = await db.query(`
      SELECT 
        LOWER(status) as status,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as amount
      FROM transfers
      WHERE ${dateCondition}
      GROUP BY LOWER(status)
    `, params);

    const totalTransfersInRange = modeRows.reduce((acc, m) => acc + Number(m.count || 0), 0) || 1;
    const modeDistribution = modeRows.map(m => ({
      mode: m.mode,
      count: Number(m.count),
      amount: Number(m.amount),
      fee: Number(m.fee),
      percentage: Number(((Number(m.count) / totalTransfersInRange) * 100).toFixed(1))
    }));

    // Successful vs failed
    let successfulCount = 0;
    let failedCount = 0;
    let pendingCount = 0;
    let reversedCount = 0;

    statusRows.forEach(s => {
      const st = String(s.status).toLowerCase();
      const cnt = Number(s.count);
      if (["successful", "success", "completed"].includes(st)) successfulCount += cnt;
      else if (["failed", "cancelled"].includes(st)) failedCount += cnt;
      else if (["reversed"].includes(st)) reversedCount += cnt;
      else pendingCount += cnt;
    });

    const totalResolved = successfulCount + failedCount + reversedCount;
    const successRate = totalResolved > 0 ? Number(((successfulCount / totalResolved) * 100).toFixed(1)) : 100;

    // Fee revenue
    const totalFeeRevenue = modeRows.reduce((acc, m) => acc + Number(m.fee || 0), 0);
    const avgFee = totalTransfersInRange > 0 ? Number((totalFeeRevenue / totalTransfersInRange).toFixed(2)) : 0;
    const sortedModesByFee = [...modeRows].sort((a, b) => Number(b.fee) - Number(a.fee));
    const topModeByFee = sortedModesByFee[0]?.mode || "IMPS";

    return res.status(200).json({
      success: true,
      analytics: {
        range,
        dailyVolume: dailyRows.map(d => ({
          date: d.date,
          count: Number(d.count),
          amount: Number(d.amount),
          fee: Number(d.fee)
        })),
        weeklyVolume: weeklyRows.map(w => ({
          week: w.week,
          count: Number(w.count),
          amount: Number(w.amount)
        })),
        monthlyVolume: monthlyRows.map(m => ({
          month: m.month,
          count: Number(m.count),
          amount: Number(m.amount)
        })),
        modeDistribution,
        statusDistribution: statusRows.map(s => ({
          status: s.status,
          count: Number(s.count),
          amount: Number(s.amount)
        })),
        successVsFailed: {
          successful: successfulCount,
          failed: failedCount,
          reversed: reversedCount,
          pending: pendingCount,
          successRate
        },
        feeRevenue: {
          totalFee: totalFeeRevenue,
          avgFee,
          topModeByFee
        }
      }
    });
  } catch (error) {
    console.error("Get Transfer Analytics Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch transfer analytics"
    });
  }
};

// =====================================
// 7. CANCEL TRANSFER
// POST /transfers/:id/cancel
// =====================================
exports.cancelTransfer = async (req, res) => {
  let connection;

  try {
    const id = req.params.id;
    const userId = req.user?.userId || req.user?.id || DEMO_USER_ID;
    const isAdmin = req.user?.isAdmin || false;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transfer ID"
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    let query = `SELECT id, payment_id, status FROM transfers WHERE id = ?`;
    let params = [Number(id)];

    if (!isAdmin) {
      query += ` AND sender_user_id = ?`;
      params.push(userId);
    }

    query += ` FOR UPDATE`;

    const [rows] = await connection.execute(query, params);

    if (rows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Transfer not found"
      });
    }

    const currentStatus = String(rows[0].status).toLowerCase();

    if (currentStatus !== "pending") {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: "Only pending transfers can be cancelled"
      });
    }

    await connection.execute(
      "UPDATE transfers SET status = 'cancelled' WHERE id = ?",
      [Number(id)]
    );

    if (rows[0].payment_id) {
      await connection.execute(
        "UPDATE payments SET status = 'cancelled' WHERE id = ?",
        [rows[0].payment_id]
      );
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "Transfer cancelled successfully"
    });

  } catch (error) {
    if (connection) await connection.rollback();

    console.error("Cancel Transfer Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to cancel transfer"
    });

  } finally {
    if (connection) connection.release();
  }
};

// =====================================
// 8. GET USER PAYMENT METHODS
// GET /payment-methods
// =====================================
exports.getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || DEMO_USER_ID;

    const [rows] = await db.execute(
      `SELECT id, user_id, method_type,
       display_label, is_default, status, created_at
       FROM payment_methods
       WHERE user_id = ?
       ORDER BY id DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      payment_methods: rows
    });

  } catch (error) {
    console.error("Get Payment Methods Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch payment methods"
    });
  }
};

// =====================================
// 9. ADD PAYMENT METHOD
// POST /payment-methods
// =====================================
exports.createPaymentMethod = async (req, res) => {
  let connection;

  try {
    const userId = req.user?.userId || req.user?.id || DEMO_USER_ID;
    const {
      method_type,
      display_label = null,
      is_default = false
    } = req.body;

    if (
      !method_type ||
      typeof method_type !== "string" ||
      !method_type.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "method_type is required"
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const makeDefault =
      is_default === true ||
      is_default === 1 ||
      is_default === "1";

    if (makeDefault) {
      await connection.execute(
        "UPDATE payment_methods SET is_default = 0 WHERE user_id = ?",
        [userId]
      );
    }

    const [result] = await connection.execute(
      `INSERT INTO payment_methods
      (user_id, method_type, provider_token,
       display_label, is_default, status)
      VALUES (?, ?, NULL, ?, ?, 'active')`,
      [
        userId,
        method_type.trim(),
        display_label,
        makeDefault ? 1 : 0
      ]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Payment method added successfully",
      payment_method_id: result.insertId
    });

  } catch (error) {
    if (connection) await connection.rollback();

    console.error("Create Payment Method Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to add payment method"
    });

  } finally {
    if (connection) connection.release();
  }
};

// =====================================
// 9.1 DELETE PAYMENT METHOD
// DELETE /payment-methods/:id
// =====================================
exports.deletePaymentMethod = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user?.userId || req.user?.id || DEMO_USER_ID;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method ID'
      });
    }

    const [result] = await db.execute(
      `DELETE FROM payment_methods WHERE id = ? AND user_id = ?`,
      [Number(id), userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment method deleted successfully'
    });

  } catch (error) {
    console.error('Delete Payment Method Error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to delete payment method'
    });
  }
};

// =====================================
// 10. PAYMENT PROVIDER WEBHOOK
// POST /webhooks/payment-provider
// =====================================
exports.receivePaymentWebhook = async (req, res) => {
  try {
    const { event_id, event_type } = req.body;

    if (!event_id || !event_type) {
      return res.status(400).json({
        success: false,
        message: "event_id and event_type are required"
      });
    }

    const [result] = await db.execute(
      `INSERT INTO provider_webhook_events
      (provider_id, event_id, event_type,
       payload, processing_status)
      VALUES (?, ?, ?, ?, 'received')`,
      [
        DEMO_PROVIDER_ID,
        String(event_id),
        String(event_type),
        JSON.stringify(req.body)
      ]
    );

    res.status(201).json({
      success: true,
      message: "Webhook event stored successfully",
      webhook_event_id: result.insertId,
      processing_status: "received"
    });

  } catch (error) {
    console.error("Payment Webhook Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to store webhook event"
    });
  }
};
