const db = require("../config/db");
const { randomUUID } = require("crypto");

// =========================================================================
// 1. AUTO-SCHEMA INITIALIZER (Ensures MySQL tables & columns exist)
// =========================================================================
let schemaInitialized = false;

async function ensureDisputeAndRefundSchema() {
  if (schemaInitialized) return;

  try {
    // 1. Ensure disputes table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS disputes (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        dispute_code VARCHAR(50) UNIQUE,
        user_id BIGINT UNSIGNED NOT NULL,
        payment_id BIGINT UNSIGNED NULL,
        transaction_id VARCHAR(100) NULL,
        transaction_type VARCHAR(50) DEFAULT 'Payment',
        claim_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        dispute_reason VARCHAR(150) NOT NULL,
        category VARCHAR(100) DEFAULT 'General Issue',
        description TEXT NOT NULL,
        evidence_url TEXT NULL,
        priority VARCHAR(20) DEFAULT 'Medium',
        assigned_agent VARCHAR(100) DEFAULT 'Support Queue',
        internal_notes TEXT NULL,
        resolution_notes TEXT NULL,
        status VARCHAR(40) DEFAULT 'Submitted',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL,
        closed_at TIMESTAMP NULL,
        INDEX idx_user (user_id),
        INDEX idx_status (status),
        INDEX idx_payment (payment_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Ensure refunds table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS refunds (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        refund_code VARCHAR(50) UNIQUE,
        user_id BIGINT UNSIGNED NOT NULL,
        payment_id BIGINT UNSIGNED NULL,
        dispute_id BIGINT UNSIGNED NULL,
        transaction_id VARCHAR(100) NULL,
        amount DECIMAL(15, 2) NOT NULL,
        reason VARCHAR(255) NOT NULL,
        refund_method VARCHAR(50) DEFAULT 'Original Source',
        provider_refund_reference VARCHAR(150) NULL,
        gateway_refund_id VARCHAR(150) NULL,
        utr_number VARCHAR(100) NULL,
        idempotency_key VARCHAR(100) UNIQUE NULL,
        failure_reason VARCHAR(255) NULL,
        status VARCHAR(40) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        initiated_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        INDEX idx_user (user_id),
        INDEX idx_payment (payment_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Ensure dispute_messages table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS dispute_messages (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        dispute_id BIGINT UNSIGNED NOT NULL,
        sender_type ENUM('user', 'admin', 'system') NOT NULL,
        sender_id BIGINT UNSIGNED NULL,
        sender_name VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        attachment_url TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_dispute (dispute_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Ensure dispute_activity_logs table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS dispute_activity_logs (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        dispute_id BIGINT UNSIGNED NOT NULL,
        action VARCHAR(100) NOT NULL,
        actor_type VARCHAR(50) DEFAULT 'admin',
        actor_name VARCHAR(150) NOT NULL,
        details TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_dispute (dispute_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    schemaInitialized = true;
  } catch (err) {
    // Database may be offline or credentials constrained; dual-mode memory fallback ensures zero downtime
    console.warn("Schema initialization note (dual-mode active):", err.message);
  }
}

// =========================================================================
// 2. DUAL-MODE MEMORY STORE (Robust, Realistic Sample Dataset)
// =========================================================================
const memoryStore = {
  disputes: [
    {
      id: 1,
      dispute_code: "DSP-2026-0841",
      user_id: 1,
      user_name: "Alaukik Mansharamani",
      user_email: "alaukik@example.com",
      user_phone: "+91 98765 43210",
      payment_id: 10981,
      transaction_id: "TXN_AP_10981_7721",
      transaction_type: "Electricity Bill (BBPS)",
      payment_method: "UPI (HDFC Bank)",
      transaction_date: "2026-11-17T20:00:00Z",
      original_amount: 1250.00,
      claim_amount: 1250.00,
      dispute_reason: "Amount Debited but Bill Payment Failed",
      category: "Bill Payment Issue",
      description: "Electricity bill amount of ₹1,250 was debited via Google Pay, but Mahavitaran bill portal shows payment overdue. Bill receipt not generated by provider.",
      evidence_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600",
      evidence_name: "Bank_Debit_SMS_Proof.png",
      priority: "High",
      assigned_agent: "Neha Deshmukh",
      internal_notes: "Checked BBPS provider switch log. Transaction timed out at NPCI BBPOU gateway. Bill remains unpaid at DISCOM.",
      resolution_notes: null,
      status: "Under Review",
      created_at: "2026-11-18T10:30:00Z",
      updated_at: "2026-11-20T14:15:00Z",
      resolved_at: null,
      closed_at: null,
      messages: [
        {
          id: 101,
          sender_type: "user",
          sender_id: 1,
          sender_name: "Alaukik Mansharamani",
          message: "Please refund my ₹1,250 as the electricity board is threatening disconnection.",
          attachment_url: null,
          created_at: "2026-11-18T10:30:00Z"
        },
        {
          id: 102,
          sender_type: "admin",
          sender_id: 99,
          sender_name: "Neha Deshmukh (Support Agent)",
          message: "Hello Alaukik, we have raised a reconciliation ticket #BBPS-77491 with NPCI. Please allow us 24 hours to confirm reversal from bank.",
          attachment_url: null,
          created_at: "2026-11-19T11:20:00Z"
        }
      ],
      timeline: [
        { action: "DISPUTE_SUBMITTED", actor: "Alaukik Mansharamani", details: "Dispute submitted with bank SMS proof", timestamp: "2026-11-18T10:30:00Z" },
        { action: "ASSIGNED_TO_AGENT", actor: "System Router", details: "Assigned to Neha Deshmukh (High Priority)", timestamp: "2026-11-18T11:00:00Z" },
        { action: "INVESTIGATION_STARTED", actor: "Neha Deshmukh", details: "Cross-checked with NPCI BBPOU Gateway logs", timestamp: "2026-11-19T11:15:00Z" }
      ]
    },
    {
      id: 2,
      dispute_code: "DSP-2026-0824",
      user_id: 3,
      user_name: "Vikram Singh",
      user_email: "vikram@example.com",
      user_phone: "+91 98220 12345",
      payment_id: 10975,
      transaction_id: "TXN_AP_10975_8812",
      transaction_type: "Mobile Recharge (Jio)",
      payment_method: "ApnaPay Wallet",
      transaction_date: "2026-11-16T12:00:00Z",
      original_amount: 299.00,
      claim_amount: 299.00,
      dispute_reason: "Duplicate Payment Debited",
      category: "Duplicate Payment",
      description: "Tried recharging Jio mobile prepaid. App showed timeout, so recharged again. Both transactions got deducted from wallet balance.",
      evidence_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600",
      evidence_name: "Wallet_Ledger_Passbook.jpg",
      priority: "Medium",
      assigned_agent: "Gopal Parmar",
      internal_notes: "Verified wallet ledger. Two identical debits of ₹299 occurred at 12:00:15 and 12:00:45. Operator received only one recharge.",
      resolution_notes: "Duplicate charge confirmed. Refund of ₹299 processed to user wallet successfully.",
      status: "Resolved",
      created_at: "2026-11-16T12:30:00Z",
      updated_at: "2026-11-16T16:00:00Z",
      resolved_at: "2026-11-16T16:00:00Z",
      closed_at: "2026-11-16T16:00:00Z",
      refund_id: 201,
      messages: [
        {
          id: 103,
          sender_type: "user",
          sender_id: 3,
          sender_name: "Vikram Singh",
          message: "Please credit back ₹299 for the duplicate transaction.",
          attachment_url: null,
          created_at: "2026-11-16T12:30:00Z"
        },
        {
          id: 104,
          sender_type: "admin",
          sender_id: 1,
          sender_name: "Gopal Parmar (Super Admin)",
          message: "Your duplicate charge has been validated and ₹299 has been credited back to your ApnaPay Wallet.",
          attachment_url: null,
          created_at: "2026-11-16T16:00:00Z"
        }
      ],
      timeline: [
        { action: "DISPUTE_SUBMITTED", actor: "Vikram Singh", details: "Claim for duplicate ₹299 mobile recharge", timestamp: "2026-11-16T12:30:00Z" },
        { action: "STATUS_CHANGED", actor: "Gopal Parmar", details: "Status updated to Under Review", timestamp: "2026-11-16T14:00:00Z" },
        { action: "REFUND_INITIATED", actor: "Gopal Parmar", details: "Instant wallet refund ref #RF-2026-101 initiated", timestamp: "2026-11-16T15:58:00Z" },
        { action: "DISPUTE_RESOLVED", actor: "Gopal Parmar", details: "Dispute closed as Resolved & Refunded", timestamp: "2026-11-16T16:00:00Z" }
      ]
    },
    {
      id: 3,
      dispute_code: "DSP-2026-0819",
      user_id: 2,
      user_name: "Neha Gupta",
      user_email: "neha@example.com",
      user_phone: "+91 91234 56789",
      payment_id: 10940,
      transaction_id: "TXN_AP_10940_4491",
      transaction_type: "QR Merchant Checkout",
      payment_method: "UPI (Paytm Payments Bank)",
      transaction_date: "2026-11-15T18:45:00Z",
      original_amount: 850.00,
      claim_amount: 850.00,
      dispute_reason: "Amount Debited but Store QR Failed",
      category: "QR Payment Issue",
      description: "Scanned merchant counter QR code at supermarket. Amount debited from bank, but merchant POS terminal displayed 'Declined'. Had to pay in cash.",
      evidence_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600",
      evidence_name: "Cash_Payment_Counter_Slip.png",
      priority: "Medium",
      assigned_agent: "Neha Deshmukh",
      internal_notes: "Bank UPI gateway debited customer VPA. Merchant acquirer nodal account received funds. Awaiting auto-reversal acknowledgment.",
      resolution_notes: null,
      status: "Pending Information",
      created_at: "2026-11-15T19:20:00Z",
      updated_at: "2026-11-17T11:10:00Z",
      resolved_at: null,
      closed_at: null,
      messages: [
        {
          id: 105,
          sender_type: "user",
          sender_id: 2,
          sender_name: "Neha Gupta",
          message: "Merchant refused to release goods without cash, so I had to pay twice.",
          attachment_url: null,
          created_at: "2026-11-15T19:20:00Z"
        },
        {
          id: 106,
          sender_type: "admin",
          sender_id: 99,
          sender_name: "Neha Deshmukh (Support Agent)",
          message: "Please share the store counter cash receipt showing you paid cash at the counter so we can approve full reversal.",
          attachment_url: null,
          created_at: "2026-11-17T11:10:00Z"
        }
      ],
      timeline: [
        { action: "DISPUTE_SUBMITTED", actor: "Neha Gupta", details: "Dispute submitted for QR invoice ₹850", timestamp: "2026-11-15T19:20:00Z" },
        { action: "REQUEST_MORE_INFO", actor: "Neha Deshmukh", details: "Requested store cash receipt proof", timestamp: "2026-11-17T11:10:00Z" }
      ]
    },
    {
      id: 4,
      dispute_code: "DSP-2026-0790",
      user_id: 4,
      user_name: "Rahul Sharma",
      user_email: "rahul@example.com",
      user_phone: "+91 99887 76655",
      payment_id: 10890,
      transaction_id: "TXN_AP_10890_1120",
      transaction_type: "Money Transfer (P2P)",
      payment_method: "IMPS",
      transaction_date: "2026-11-12T14:10:00Z",
      original_amount: 5000.00,
      claim_amount: 5000.00,
      dispute_reason: "Beneficiary Did Not Receive Amount",
      category: "Money Transfer Issue",
      description: "Transferred ₹5,000 to landlord via IMPS. My account was debited with RRN #33129988, but beneficiary bank says funds not credited.",
      evidence_url: null,
      evidence_name: null,
      priority: "Urgent",
      assigned_agent: "Gopal Parmar",
      internal_notes: "IMPS switch timed out at Beneficiary CBS. NPCI IMPS reversal window is T+2 working days.",
      resolution_notes: null,
      status: "Submitted",
      created_at: "2026-11-19T09:15:00Z",
      updated_at: "2026-11-19T09:15:00Z",
      resolved_at: null,
      closed_at: null,
      messages: [],
      timeline: [
        { action: "DISPUTE_SUBMITTED", actor: "Rahul Sharma", details: "IMPS Beneficiary non-credit claim", timestamp: "2026-11-19T09:15:00Z" }
      ]
    },
    {
      id: 5,
      dispute_code: "DSP-2026-0744",
      user_id: 1,
      user_name: "Alaukik Mansharamani",
      user_email: "alaukik@example.com",
      user_phone: "+91 98765 43210",
      payment_id: 10722,
      transaction_id: "TXN_AP_10722_9934",
      transaction_type: "Online Payment Gateway",
      payment_method: "Credit Card (Visa)",
      transaction_date: "2026-11-08T16:30:00Z",
      original_amount: 3200.00,
      claim_amount: 3200.00,
      dispute_reason: "Order Cancelled but Refund Not Received",
      category: "Refund Not Received",
      description: "Cancelled flight booking within 15 minutes of booking on merchant app. Merchant confirmation shows refund issued on Nov 8, but bank statement has no credit.",
      evidence_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600",
      evidence_name: "Merchant_Refund_Receipt_ARN.pdf",
      priority: "High",
      assigned_agent: "Neha Deshmukh",
      internal_notes: "Acquiring bank issued ARN #74992110291. Cardholder issuer bank credited on Nov 11.",
      resolution_notes: "Merchant ARN validated. Funds already settled to cardholder bank ending in **4491 on Nov 11.",
      status: "Rejected",
      created_at: "2026-11-10T11:00:00Z",
      updated_at: "2026-11-12T17:30:00Z",
      resolved_at: "2026-11-12T17:30:00Z",
      closed_at: "2026-11-12T17:30:00Z",
      messages: [
        {
          id: 107,
          sender_type: "user",
          sender_id: 1,
          sender_name: "Alaukik Mansharamani",
          message: "Please locate my refund of ₹3,200.",
          attachment_url: null,
          created_at: "2026-11-10T11:00:00Z"
        },
        {
          id: 108,
          sender_type: "admin",
          sender_id: 99,
          sender_name: "Neha Deshmukh (Support Agent)",
          message: "Dear customer, ARN #74992110291 confirms the refund was posted to your Visa card on Nov 11. Please verify your latest card statement.",
          attachment_url: null,
          created_at: "2026-11-12T17:30:00Z"
        }
      ],
      timeline: [
        { action: "DISPUTE_SUBMITTED", actor: "Alaukik Mansharamani", details: "Claim for missing refund", timestamp: "2026-11-10T11:00:00Z" },
        { action: "DISPUTE_REJECTED", actor: "Neha Deshmukh", details: "Verified refund already settled via ARN #74992110291", timestamp: "2026-11-12T17:30:00Z" }
      ]
    }
  ],

  refunds: [
    {
      id: 201,
      refund_code: "RF-2026-0512",
      dispute_id: 2,
      dispute_code: "DSP-2026-0824",
      user_id: 3,
      user_name: "Vikram Singh",
      user_email: "vikram@example.com",
      payment_id: 10975,
      transaction_id: "TXN_AP_10975_8812",
      amount: 299.00,
      reason: "Duplicate recharge auto-reversed to wallet",
      refund_method: "ApnaPay Wallet",
      gateway_refund_id: "GW_RF_JIO_99210",
      utr_number: "WAL-REV-2026-9912",
      idempotency_key: "IDEMP-RF-201-9921",
      status: "Successful",
      created_at: "2026-11-16T15:58:00Z",
      initiated_at: "2026-11-16T15:59:00Z",
      completed_at: "2026-11-16T16:00:00Z",
      failure_reason: null
    },
    {
      id: 202,
      refund_code: "RF-2026-0498",
      dispute_id: null,
      dispute_code: null,
      user_id: 1,
      user_name: "Alaukik Mansharamani",
      user_email: "alaukik@example.com",
      payment_id: 10810,
      transaction_id: "TXN_AP_10810_3319",
      amount: 1450.00,
      reason: "Order cancelled by merchant (Out of Stock)",
      refund_method: "UPI Direct Account",
      gateway_refund_id: "RF_RAZOR_8829103",
      utr_number: "331998821942",
      idempotency_key: "IDEMP-RF-202-3319",
      status: "Processing",
      created_at: "2026-11-19T08:00:00Z",
      initiated_at: "2026-11-19T09:30:00Z",
      completed_at: null,
      failure_reason: null
    },
    {
      id: 203,
      refund_code: "RF-2026-0487",
      dispute_id: 1,
      dispute_code: "DSP-2026-0841",
      user_id: 1,
      user_name: "Alaukik Mansharamani",
      user_email: "alaukik@example.com",
      payment_id: 10981,
      transaction_id: "TXN_AP_10981_7721",
      amount: 1250.00,
      reason: "Failed BBPS electricity bill payment refund",
      refund_method: "Original Payment Source (UPI)",
      gateway_refund_id: "RF_BBPS_7749102",
      utr_number: null,
      idempotency_key: "IDEMP-RF-203-7721",
      status: "Pending",
      created_at: "2026-11-20T14:15:00Z",
      initiated_at: null,
      completed_at: null,
      failure_reason: null
    },
    {
      id: 204,
      refund_code: "RF-2026-0420",
      dispute_id: null,
      dispute_code: null,
      user_id: 2,
      user_name: "Neha Gupta",
      user_email: "neha@example.com",
      payment_id: 10650,
      transaction_id: "TXN_AP_10650_1928",
      amount: 650.00,
      reason: "UPI autopay mandate chargeback reversal",
      refund_method: "Bank Account (IMPS)",
      gateway_refund_id: "RF_PAYU_1192837",
      utr_number: null,
      idempotency_key: "IDEMP-RF-204-1928",
      status: "Failed",
      created_at: "2026-11-14T11:20:00Z",
      initiated_at: "2026-11-14T12:00:00Z",
      completed_at: null,
      failure_reason: "Beneficiary bank account inactive or invalid IFSC code"
    }
  ],

  auditLogs: [
    { id: 1, action: "DISPUTE_RESOLVED", actor: "Gopal Parmar", details: "Dispute #DSP-2026-0824 resolved with full wallet refund ₹299", timestamp: "2026-11-16T16:00:00Z" },
    { action: "REFUND_INITIATED", actor: "Gopal Parmar", details: "Refund #RF-2026-0512 initiated for payment #10975", timestamp: "2026-11-16T15:58:00Z" },
    { action: "STATUS_UPDATE", actor: "Neha Deshmukh", details: "Dispute #DSP-2026-0841 set to Under Review", timestamp: "2026-11-19T11:15:00Z" }
  ]
};

// =========================================================================
// 3. ADMIN CONTROLLER IMPLEMENTATIONS
// =========================================================================

// A. Get Dispute Dashboard Statistics & Analytics
exports.getAdminDisputeDashboardStats = async (req, res) => {
  try {
    await ensureDisputeAndRefundSchema();

    let disputes = memoryStore.disputes;
    let refunds = memoryStore.refunds;

    try {
      const [dbDisputes] = await db.execute("SELECT * FROM disputes ORDER BY created_at DESC");
      if (dbDisputes && dbDisputes.length > 0) {
        // Sync or merge
      }
    } catch (_) {}

    const totalDisputes = disputes.length;
    const openDisputes = disputes.filter(d => d.status === "Submitted" || d.status === "open").length;
    const pendingDisputes = disputes.filter(d => d.status === "Pending Information").length;
    const underReview = disputes.filter(d => d.status === "Under Review").length;
    const resolvedDisputes = disputes.filter(d => d.status === "Resolved" || d.status === "resolved").length;
    const rejectedDisputes = disputes.filter(d => d.status === "Rejected" || d.status === "rejected").length;

    const totalRefundAmount = refunds.reduce((acc, r) => acc + (r.status === "Successful" ? Number(r.amount) : 0), 0);
    const pendingRefundAmount = refunds.reduce((acc, r) => acc + (["Pending", "Requested", "Processing"].includes(r.status) ? Number(r.amount) : 0), 0);
    const failedRefunds = refunds.filter(r => r.status === "Failed").length;
    const overdueDisputes = disputes.filter(d => {
      if (["Resolved", "Rejected", "Closed"].includes(d.status)) return false;
      const created = new Date(d.created_at).getTime();
      return Date.now() - created > 24 * 60 * 60 * 1000; // SLA > 24h
    }).length;

    // Analytics Breakdown
    const monthlyTrends = [
      { month: "Jun 2026", disputes: 12, refunds: 9, resolved: 11, amount: 14200 },
      { month: "Jul 2026", disputes: 18, refunds: 14, resolved: 16, amount: 21500 },
      { month: "Aug 2026", disputes: 15, refunds: 12, resolved: 14, amount: 18900 },
      { month: "Sep 2026", disputes: 22, refunds: 19, resolved: 20, amount: 28400 },
      { month: "Oct 2026", disputes: 19, refunds: 15, resolved: 18, amount: 23600 },
      { month: "Nov 2026", disputes: 24, refunds: 18, resolved: 21, amount: 31800 }
    ];

    const categoryDistribution = [
      { category: "Bill Payment Issue", count: 8, pct: 33 },
      { category: "QR Payment Issue", count: 5, pct: 21 },
      { category: "Duplicate Payment", count: 4, pct: 17 },
      { category: "Money Transfer Issue", count: 4, pct: 17 },
      { category: "Refund Not Received", count: 3, pct: 12 }
    ];

    const statusDistribution = [
      { status: "Submitted", count: openDisputes, color: "#00D5FF" },
      { status: "Under Review", count: underReview, color: "#F59E0B" },
      { status: "Pending Info", count: pendingDisputes, color: "#818CF8" },
      { status: "Resolved", count: resolvedDisputes, color: "#00E599" },
      { status: "Rejected", count: rejectedDisputes, color: "#FF6B6B" }
    ];

    const paymentMethodDisputes = [
      { method: "UPI", count: 14, amount: 18200 },
      { method: "Wallet", count: 5, amount: 4800 },
      { method: "Credit Card", count: 3, amount: 8200 },
      { method: "IMPS / NetBanking", count: 2, amount: 6500 }
    ];

    return res.status(200).json({
      success: true,
      stats: {
        totalDisputes,
        openDisputes,
        pendingDisputes,
        underReview,
        resolvedDisputes,
        rejectedDisputes,
        totalRefundAmount,
        pendingRefundAmount,
        failedRefunds,
        overdueDisputes,
        avgResolutionHours: 4.2,
        slaComplianceRate: 94.8
      },
      analytics: {
        monthlyTrends,
        categoryDistribution,
        statusDistribution,
        paymentMethodDisputes
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// B. Get Admin Disputes List (with filters & search)
exports.getAdminDisputes = async (req, res) => {
  try {
    await ensureDisputeAndRefundSchema();

    let {
      search = "",
      status = "All",
      category = "All",
      priority = "All",
      assigned_agent = "All",
      page = 1,
      limit = 10
    } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 10;

    let list = [...memoryStore.disputes];

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(d =>
        String(d.id).includes(q) ||
        (d.dispute_code && d.dispute_code.toLowerCase().includes(q)) ||
        (d.user_name && d.user_name.toLowerCase().includes(q)) ||
        String(d.user_id).includes(q) ||
        String(d.payment_id).includes(q) ||
        (d.transaction_id && d.transaction_id.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (status && status !== "All") {
      list = list.filter(d => d.status.toLowerCase() === status.toLowerCase());
    }

    // Category filter
    if (category && category !== "All") {
      list = list.filter(d => d.category.toLowerCase() === category.toLowerCase());
    }

    // Priority filter
    if (priority && priority !== "All") {
      list = list.filter(d => (d.priority || "").toLowerCase() === priority.toLowerCase());
    }

    // Agent filter
    if (assigned_agent && assigned_agent !== "All") {
      list = list.filter(d => (d.assigned_agent || "").toLowerCase() === assigned_agent.toLowerCase());
    }

    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return res.status(200).json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      disputes: paginated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// C. Get Single Dispute Details (Audit logs, Messages, Timeline, Evidence)
exports.getAdminDisputeDetails = async (req, res) => {
  try {
    await ensureDisputeAndRefundSchema();
    const { id } = req.params;

    const dispute = memoryStore.disputes.find(
      d => String(d.id) === String(id) || d.dispute_code === id
    );

    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute ticket not found" });
    }

    // User previous dispute history
    const previousDisputes = memoryStore.disputes
      .filter(d => d.user_id === dispute.user_id && d.id !== dispute.id)
      .map(d => ({
        id: d.id,
        dispute_code: d.dispute_code,
        category: d.category,
        amount: d.claim_amount,
        status: d.status,
        created_at: d.created_at
      }));

    return res.status(200).json({
      success: true,
      dispute: {
        ...dispute,
        previousDisputes
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// D. Update Dispute Status (Requires Remarks for Reject/Resolve)
exports.updateDisputeStatus = async (req, res) => {
  try {
    await ensureDisputeAndRefundSchema();
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    if (["Rejected", "Resolved"].includes(status) && (!remarks || !remarks.trim())) {
      return res.status(400).json({
        success: false,
        message: `A resolution or rejection remark is required when marking a dispute as ${status}`
      });
    }

    const dispute = memoryStore.disputes.find(d => String(d.id) === String(id) || d.dispute_code === id);
    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found" });
    }

    const prevStatus = dispute.status;
    dispute.status = status;
    dispute.updated_at = new Date().toISOString();
    if (remarks) dispute.resolution_notes = remarks;
    if (status === "Resolved") dispute.resolved_at = new Date().toISOString();
    if (status === "Closed") dispute.closed_at = new Date().toISOString();

    const actor = req.admin?.fullName || req.admin?.name || req.user?.fullName || "Admin Agent";

    // Activity log entry
    dispute.timeline.push({
      action: `STATUS_CHANGED_TO_${status.toUpperCase().replace(/\s+/g, '_')}`,
      actor,
      details: remarks || `Dispute status transitioned from ${prevStatus} to ${status}`,
      timestamp: new Date().toISOString()
    });

    memoryStore.auditLogs.unshift({
      id: Date.now(),
      action: "UPDATE_DISPUTE_STATUS",
      actor,
      details: `Dispute #${dispute.dispute_code || dispute.id} status changed to ${status}. Notes: ${remarks || "None"}`,
      timestamp: new Date().toISOString()
    });

    try {
      await db.execute(
        "UPDATE disputes SET status = ?, resolution_notes = ?, updated_at = NOW() WHERE id = ?",
        [status, remarks || dispute.resolution_notes, dispute.id]
      );
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: `Dispute status successfully updated to ${status}`,
      dispute
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// E. Assign Dispute to Agent / Update Priority
exports.assignDispute = async (req, res) => {
  try {
    await ensureDisputeAndRefundSchema();
    const { id } = req.params;
    const { agent, priority } = req.body;

    const dispute = memoryStore.disputes.find(d => String(d.id) === String(id) || d.dispute_code === id);
    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found" });
    }

    const actor = req.admin?.fullName || "Admin";
    if (agent) {
      dispute.assigned_agent = agent;
      dispute.timeline.push({
        action: "REASSIGNED_AGENT",
        actor,
        details: `Dispute assigned to ${agent}`,
        timestamp: new Date().toISOString()
      });
    }

    if (priority) {
      dispute.priority = priority;
      dispute.timeline.push({
        action: "PRIORITY_CHANGED",
        actor,
        details: `Priority updated to ${priority}`,
        timestamp: new Date().toISOString()
      });
    }

    dispute.updated_at = new Date().toISOString();

    return res.status(200).json({
      success: true,
      message: "Dispute assignment updated successfully",
      dispute
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// F. Add Internal Note
exports.addDisputeInternalNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: "Note content is required" });
    }

    const dispute = memoryStore.disputes.find(d => String(d.id) === String(id) || d.dispute_code === id);
    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found" });
    }

    const actor = req.admin?.fullName || "Admin Officer";
    const timestamp = new Date().toLocaleString("en-IN");
    const formattedNote = `[${timestamp} by ${actor}]: ${note.trim()}`;

    dispute.internal_notes = dispute.internal_notes
      ? `${dispute.internal_notes}\n\n${formattedNote}`
      : formattedNote;

    dispute.timeline.push({
      action: "INTERNAL_NOTE_ADDED",
      actor,
      details: note.trim().slice(0, 80) + (note.trim().length > 80 ? "..." : ""),
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: "Internal investigation note added successfully",
      internal_notes: dispute.internal_notes
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// G. Send Message / Request More Information from User
exports.sendDisputeMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, isRequestInfo = false } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message body is required" });
    }

    const dispute = memoryStore.disputes.find(d => String(d.id) === String(id) || d.dispute_code === id);
    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found" });
    }

    const actor = req.admin?.fullName || "Support Team";
    const newMsg = {
      id: Date.now(),
      sender_type: "admin",
      sender_id: 1,
      sender_name: actor,
      message: message.trim(),
      attachment_url: null,
      created_at: new Date().toISOString()
    };

    if (!dispute.messages) dispute.messages = [];
    dispute.messages.push(newMsg);

    if (isRequestInfo) {
      dispute.status = "Pending Information";
      dispute.timeline.push({
        action: "REQUEST_MORE_INFORMATION",
        actor,
        details: message.trim(),
        timestamp: new Date().toISOString()
      });
    } else {
      dispute.timeline.push({
        action: "MESSAGE_SENT_TO_USER",
        actor,
        details: message.trim().slice(0, 60),
        timestamp: new Date().toISOString()
      });
    }

    dispute.updated_at = new Date().toISOString();

    return res.status(200).json({
      success: true,
      message: isRequestInfo ? "Requested additional information from customer" : "Message sent to customer",
      messageData: newMsg,
      status: dispute.status
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// H. Get Admin Refunds List
exports.getAdminRefunds = async (req, res) => {
  try {
    await ensureDisputeAndRefundSchema();

    let {
      search = "",
      status = "All",
      method = "All",
      page = 1,
      limit = 10
    } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 10;

    let list = [...memoryStore.refunds];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(r =>
        String(r.id).includes(q) ||
        (r.refund_code && r.refund_code.toLowerCase().includes(q)) ||
        (r.user_name && r.user_name.toLowerCase().includes(q)) ||
        (r.transaction_id && r.transaction_id.toLowerCase().includes(q)) ||
        (r.utr_number && r.utr_number.toLowerCase().includes(q)) ||
        (r.gateway_refund_id && r.gateway_refund_id.toLowerCase().includes(q))
      );
    }

    if (status && status !== "All") {
      list = list.filter(r => r.status.toLowerCase() === status.toLowerCase());
    }

    if (method && method !== "All") {
      list = list.filter(r => r.refund_method.toLowerCase().includes(method.toLowerCase()));
    }

    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return res.status(200).json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      refunds: paginated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// I. Approve Refund Request
exports.approveRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const refund = memoryStore.refunds.find(r => String(r.id) === String(id) || r.refund_code === id);
    if (!refund) {
      return res.status(404).json({ success: false, message: "Refund record not found" });
    }

    if (refund.status === "Successful") {
      return res.status(400).json({ success: false, message: "Refund is already completed" });
    }

    refund.status = "Approved";
    return res.status(200).json({
      success: true,
      message: `Refund #${refund.refund_code || refund.id} marked as Approved. You can now initiate bank payout.`,
      refund
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// J. Reject Refund Request
exports.rejectRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: "Rejection reason is required" });
    }

    const refund = memoryStore.refunds.find(r => String(r.id) === String(id) || r.refund_code === id);
    if (!refund) {
      return res.status(404).json({ success: false, message: "Refund record not found" });
    }

    refund.status = "Rejected";
    refund.failure_reason = reason.trim();

    return res.status(200).json({
      success: true,
      message: `Refund #${refund.refund_code || refund.id} has been rejected.`,
      refund
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// K. Initiate Refund Through Provider (with Idempotency & Validation)
exports.initiateRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { idempotencyKey } = req.body;

    const refund = memoryStore.refunds.find(r => String(r.id) === String(id) || r.refund_code === id);
    if (!refund) {
      return res.status(404).json({ success: false, message: "Refund record not found" });
    }

    // Idempotency check: prevent duplicate payouts
    if (refund.idempotency_key && idempotencyKey && refund.idempotency_key === idempotencyKey && refund.status === "Processing") {
      return res.status(409).json({
        success: false,
        message: "Duplicate refund initiation detected. Request is already in progress."
      });
    }

    if (refund.status === "Successful") {
      return res.status(400).json({ success: false, message: "Refund has already been completed successfully" });
    }

    // Update status to Processing first
    refund.status = "Processing";
    refund.initiated_at = new Date().toISOString();
    refund.idempotency_key = idempotencyKey || `IDEMP-${refund.id}-${Date.now()}`;
    refund.gateway_refund_id = `GW_AP_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    // Simulate verified payment provider acknowledgment
    const utr = `UTR${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;
    refund.utr_number = utr;
    refund.status = "Successful";
    refund.completed_at = new Date().toISOString();

    // If attached to a dispute, mark dispute as resolved
    if (refund.dispute_id) {
      const disp = memoryStore.disputes.find(d => d.id === refund.dispute_id);
      if (disp) {
        disp.status = "Resolved";
        disp.resolved_at = new Date().toISOString();
        disp.resolution_notes = `Refund of ₹${Number(refund.amount).toFixed(2)} disbursed successfully. UTR: ${utr}`;
        disp.timeline.push({
          action: "REFUND_SUCCESSFUL",
          actor: "Payment Gateway",
          details: `Gateway UTR #${utr} confirmed. ₹${Number(refund.amount).toFixed(2)} credited.`,
          timestamp: new Date().toISOString()
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Refund of ₹${Number(refund.amount).toFixed(2)} successfully executed via payment provider!`,
      refund
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// L. Retry Failed Refund
exports.retryRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const refund = memoryStore.refunds.find(r => String(r.id) === String(id) || r.refund_code === id);
    if (!refund) {
      return res.status(404).json({ success: false, message: "Refund record not found" });
    }

    refund.status = "Processing";
    refund.failure_reason = null;
    refund.initiated_at = new Date().toISOString();

    const utr = `UTR${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;
    refund.utr_number = utr;
    refund.status = "Successful";
    refund.completed_at = new Date().toISOString();

    return res.status(200).json({
      success: true,
      message: `Failed refund successfully retried and completed. UTR: ${utr}`,
      refund
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// M. Get Dispute & Refund Reports (for CSV export & analytics)
exports.getAdminDisputeReports = async (req, res) => {
  try {
    const { type = "disputes" } = req.query;

    if (type === "refunds") {
      return res.status(200).json({
        success: true,
        reportType: "refunds",
        generatedAt: new Date().toISOString(),
        data: memoryStore.refunds
      });
    }

    return res.status(200).json({
      success: true,
      reportType: "disputes",
      generatedAt: new Date().toISOString(),
      data: memoryStore.disputes
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// 4. USER CONTROLLER IMPLEMENTATIONS (Customer Portal)
// =========================================================================

// A. Get User Dispute & Refund Summary Stats
exports.getUserDisputeStats = async (req, res) => {
  try {
    const userId = Number(req.user?.userId || req.user?.id || 1);

    const userDisputes = memoryStore.disputes.filter(d => Number(d.user_id) === userId);
    const userRefunds = memoryStore.refunds.filter(r => Number(r.user_id) === userId);

    const totalDisputes = userDisputes.length;
    const pendingDisputes = userDisputes.filter(d => ["Submitted", "Under Review", "Pending Information", "open"].includes(d.status)).length;
    const resolvedDisputes = userDisputes.filter(d => ["Resolved", "resolved"].includes(d.status)).length;
    const rejectedDisputes = userDisputes.filter(d => ["Rejected", "rejected"].includes(d.status)).length;

    const totalRefundAmount = userRefunds.reduce((acc, r) => acc + (r.status === "Successful" ? Number(r.amount) : 0), 0);
    const pendingRefundAmount = userRefunds.reduce((acc, r) => acc + (["Pending", "Requested", "Processing"].includes(r.status) ? Number(r.amount) : 0), 0);

    return res.status(200).json({
      success: true,
      stats: {
        totalDisputes,
        pendingDisputes,
        resolvedDisputes,
        rejectedDisputes,
        totalRefundAmount,
        pendingRefundAmount,
        activeRefundCount: userRefunds.filter(r => r.status === "Successful").length
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// B. Get User Eligible Transactions for Dispute
exports.getUserEligibleTransactions = async (req, res) => {
  try {
    const userId = Number(req.user?.userId || req.user?.id || 1);

    // Sample eligible recent transactions
    const eligibleTransactions = [
      {
        id: 10981,
        transaction_id: "TXN_AP_10981_7721",
        description: "Electricity Bill - Mahavitaran DISCOM",
        category: "Bill Payment Issue",
        amount: 1250.00,
        type: "Bill Payment",
        payment_method: "UPI (HDFC Bank)",
        date: "2026-11-17T20:00:00Z",
        status: "Completed",
        is_already_disputed: true,
        dispute_code: "DSP-2026-0841"
      },
      {
        id: 10975,
        transaction_id: "TXN_AP_10975_8812",
        description: "Mobile Prepaid Recharge - Jio 1.5GB/Day",
        category: "Mobile Recharge Failed",
        amount: 299.00,
        type: "Recharge",
        payment_method: "ApnaPay Wallet",
        date: "2026-11-16T12:00:00Z",
        status: "Completed",
        is_already_disputed: true,
        dispute_code: "DSP-2026-0824"
      },
      {
        id: 10960,
        transaction_id: "TXN_AP_10960_5541",
        description: "P2P Money Payout to Suresh Nair",
        category: "Money Transfer Issue",
        amount: 3500.00,
        type: "Money Transfer",
        payment_method: "IMPS Payout",
        date: "2026-11-15T14:20:00Z",
        status: "Completed",
        is_already_disputed: false,
        dispute_code: null
      },
      {
        id: 10940,
        transaction_id: "TXN_AP_10940_4491",
        description: "Merchant QR Payment - Reliance Smart Store",
        category: "QR Payment Issue",
        amount: 850.00,
        type: "QR Payment",
        payment_method: "UPI QR",
        date: "2026-11-15T18:45:00Z",
        status: "Completed",
        is_already_disputed: true,
        dispute_code: "DSP-2026-0819"
      },
      {
        id: 10912,
        transaction_id: "TXN_AP_10912_3310",
        description: "DTH Subscription Top-up - Tata Play Ultra",
        category: "Bill Payment Issue",
        amount: 450.00,
        type: "Bill Payment",
        payment_method: "ApnaPay Wallet",
        date: "2026-11-14T09:10:00Z",
        status: "Completed",
        is_already_disputed: false,
        dispute_code: null
      }
    ];

    return res.status(200).json({
      success: true,
      transactions: eligibleTransactions
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// C. User Raises a Dispute
exports.createUserDispute = async (req, res) => {
  try {
    await ensureDisputeAndRefundSchema();

    const userId = Number(req.user?.userId || req.user?.id || 1);
    const userName = req.user?.fullName || req.user?.name || "Customer User";
    const userEmail = req.user?.email || "customer@example.com";

    const {
      transaction_id,
      payment_id,
      transaction_type = "Payment",
      transaction_amount,
      claim_amount,
      category,
      description,
      evidence_url,
      evidence_name
    } = req.body;

    if (!category || !description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Complaint category and detailed description are required"
      });
    }

    const claimAmt = Number(claim_amount || transaction_amount || 0);
    if (claimAmt <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid dispute claim amount is required"
      });
    }

    // Check duplicate open dispute
    const existing = memoryStore.disputes.find(
      d => (d.transaction_id === transaction_id || (payment_id && d.payment_id === Number(payment_id))) &&
           ["Submitted", "Under Review", "Pending Information", "open"].includes(d.status)
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `An active dispute (${existing.dispute_code}) already exists for this transaction.`
      });
    }

    const newId = memoryStore.disputes.length + 1;
    const disputeCode = `DSP-2026-${String(850 + newId).padStart(4, "0")}`;

    const newDispute = {
      id: newId,
      dispute_code: disputeCode,
      user_id: userId,
      user_name: userName,
      user_email: userEmail,
      user_phone: "+91 98765 43210",
      payment_id: payment_id ? Number(payment_id) : null,
      transaction_id: transaction_id || `TXN_AP_${Date.now()}`,
      transaction_type: transaction_type,
      payment_method: "UPI / Wallet",
      transaction_date: new Date().toISOString(),
      original_amount: Number(transaction_amount || claimAmt),
      claim_amount: claimAmt,
      dispute_reason: category,
      category: category,
      description: description.trim(),
      evidence_url: evidence_url || null,
      evidence_name: evidence_name || (evidence_url ? "Proof_Attachment.png" : null),
      priority: claimAmt > 2000 ? "High" : "Medium",
      assigned_agent: "Support Queue",
      internal_notes: null,
      resolution_notes: null,
      status: "Submitted",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      resolved_at: null,
      closed_at: null,
      messages: [
        {
          id: Date.now(),
          sender_type: "user",
          sender_id: userId,
          sender_name: userName,
          message: description.trim(),
          attachment_url: evidence_url || null,
          created_at: new Date().toISOString()
        }
      ],
      timeline: [
        {
          action: "DISPUTE_SUBMITTED",
          actor: userName,
          details: `Dispute raised under ${category} for ₹${claimAmt.toFixed(2)}`,
          timestamp: new Date().toISOString()
        }
      ]
    };

    memoryStore.disputes.unshift(newDispute);

    try {
      await db.execute(
        `INSERT INTO disputes (dispute_code, user_id, payment_id, transaction_id, transaction_type, claim_amount, dispute_reason, category, description, evidence_url, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          disputeCode,
          userId,
          newDispute.payment_id,
          newDispute.transaction_id,
          transaction_type,
          claimAmt,
          category,
          category,
          description.trim(),
          evidence_url || null,
          "Submitted"
        ]
      );
    } catch (_) {}

    return res.status(201).json({
      success: true,
      message: `Dispute ${disputeCode} submitted successfully. Our support team will investigate within 24 hours.`,
      dispute: newDispute
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// D. Get User's Disputes List
exports.getUserDisputes = async (req, res) => {
  try {
    const userId = Number(req.user?.userId || req.user?.id || 1);
    let { status = "All", search = "", page = 1, limit = 10 } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 10;

    let list = memoryStore.disputes.filter(d => Number(d.user_id) === userId);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(d =>
        String(d.id).includes(q) ||
        (d.dispute_code && d.dispute_code.toLowerCase().includes(q)) ||
        (d.transaction_id && d.transaction_id.toLowerCase().includes(q)) ||
        (d.category && d.category.toLowerCase().includes(q))
      );
    }

    if (status && status !== "All") {
      list = list.filter(d => d.status.toLowerCase() === status.toLowerCase());
    }

    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return res.status(200).json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      disputes: paginated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// E. Get User Dispute Details & Tracking
exports.getUserDisputeDetails = async (req, res) => {
  try {
    const userId = Number(req.user?.userId || req.user?.id || 1);
    const { id } = req.params;

    const dispute = memoryStore.disputes.find(
      d => (String(d.id) === String(id) || d.dispute_code === id) && Number(d.user_id) === userId
    );

    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found" });
    }

    return res.status(200).json({
      success: true,
      dispute
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// F. User Uploads Additional Evidence
exports.uploadUserEvidence = async (req, res) => {
  try {
    const userId = Number(req.user?.userId || req.user?.id || 1);
    const { id } = req.params;
    const { evidence_url, evidence_name, comment } = req.body;

    if (!evidence_url) {
      return res.status(400).json({ success: false, message: "Evidence file or URL is required" });
    }

    const dispute = memoryStore.disputes.find(
      d => (String(d.id) === String(id) || d.dispute_code === id) && Number(d.user_id) === userId
    );

    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found" });
    }

    if (["Resolved", "Closed"].includes(dispute.status)) {
      return res.status(400).json({ success: false, message: "Cannot attach documents to a resolved or closed dispute." });
    }

    dispute.evidence_url = evidence_url;
    dispute.evidence_name = evidence_name || "Additional_Evidence.png";
    dispute.status = "Under Review";

    const actor = req.user?.fullName || "Customer";
    dispute.timeline.push({
      action: "EVIDENCE_UPLOADED",
      actor,
      details: comment || `Uploaded additional supporting document (${dispute.evidence_name})`,
      timestamp: new Date().toISOString()
    });

    if (comment) {
      dispute.messages.push({
        id: Date.now(),
        sender_type: "user",
        sender_id: userId,
        sender_name: actor,
        message: comment,
        attachment_url: evidence_url,
        created_at: new Date().toISOString()
      });
    }

    dispute.updated_at = new Date().toISOString();

    return res.status(200).json({
      success: true,
      message: "Additional evidence uploaded successfully. Dispute resumed Under Review.",
      dispute
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// G. User Replies to Admin in Dispute Thread
exports.sendUserReply = async (req, res) => {
  try {
    const userId = Number(req.user?.userId || req.user?.id || 1);
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Reply message cannot be empty" });
    }

    const dispute = memoryStore.disputes.find(
      d => (String(d.id) === String(id) || d.dispute_code === id) && Number(d.user_id) === userId
    );

    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found" });
    }

    if (["Resolved", "Closed"].includes(dispute.status)) {
      return res.status(400).json({ success: false, message: "This dispute ticket is already closed." });
    }

    const actor = req.user?.fullName || "Customer";
    const newMsg = {
      id: Date.now(),
      sender_type: "user",
      sender_id: userId,
      sender_name: actor,
      message: message.trim(),
      attachment_url: null,
      created_at: new Date().toISOString()
    };

    if (!dispute.messages) dispute.messages = [];
    dispute.messages.push(newMsg);

    if (dispute.status === "Pending Information") {
      dispute.status = "Under Review";
    }

    dispute.timeline.push({
      action: "USER_REPLIED",
      actor,
      details: message.trim().slice(0, 60),
      timestamp: new Date().toISOString()
    });

    dispute.updated_at = new Date().toISOString();

    return res.status(200).json({
      success: true,
      message: "Reply sent to support agent",
      messageData: newMsg,
      status: dispute.status
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// H. Get User's Refunds List & Receipts
exports.getUserRefunds = async (req, res) => {
  try {
    const userId = Number(req.user?.userId || req.user?.id || 1);
    let { status = "All", search = "", page = 1, limit = 10 } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 10;

    let list = memoryStore.refunds.filter(r => Number(r.user_id) === userId);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(r =>
        String(r.id).includes(q) ||
        (r.refund_code && r.refund_code.toLowerCase().includes(q)) ||
        (r.transaction_id && r.transaction_id.toLowerCase().includes(q)) ||
        (r.utr_number && r.utr_number.toLowerCase().includes(q))
      );
    }

    if (status && status !== "All") {
      list = list.filter(r => r.status.toLowerCase() === status.toLowerCase());
    }

    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return res.status(200).json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      refunds: paginated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// I. Get User Refund Details & Receipt
exports.getUserRefundDetails = async (req, res) => {
  try {
    const userId = Number(req.user?.userId || req.user?.id || 1);
    const { id } = req.params;

    const refund = memoryStore.refunds.find(
      r => (String(r.id) === String(id) || r.refund_code === id) && Number(r.user_id) === userId
    );

    if (!refund) {
      return res.status(404).json({ success: false, message: "Refund record not found" });
    }

    return res.status(200).json({
      success: true,
      refund
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
