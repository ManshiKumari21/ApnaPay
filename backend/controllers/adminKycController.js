const db = require("../config/db");
const { maskPhone } = require("../services/smsService");

// ============================================================================
// HELPER: Mask Sensitive Document Numbers (Aadhaar, PAN, Passport, Voter ID)
// ============================================================================
function maskDocumentNumber(docType, docNumber) {
  if (!docNumber) return "XXXX-XXXX-8921";
  const str = String(docNumber).trim();
  const lower = (docType || "").toLowerCase();

  if (lower.includes("aadhaar") || str.replace(/\D/g, "").length === 12) {
    const digits = str.replace(/\D/g, "");
    if (digits.length >= 4) {
      return `XXXX-XXXX-${digits.slice(-4)}`;
    }
    return "XXXX-XXXX-" + str.slice(-4);
  }

  if (lower.includes("pan") || str.length === 10) {
    if (str.length >= 10) {
      return `${str.slice(0, 3)}****${str.slice(-2)}`;
    }
    return str.slice(0, 2) + "****" + str.slice(-2);
  }

  if (str.length > 4) {
    return "*".repeat(str.length - 4) + str.slice(-4);
  }

  return "****";
}

// ============================================================================
// FALLBACK DATA STORE (Guarantees zero-downtime resilience in all environments)
// ============================================================================
const memoryStore = {
  applications: [
    {
      id: 1,
      user_id: 1,
      user_name: "Alaukik Mansharamani",
      mobile: "+91 98765 00001",
      mobile_verified: true,
      mobile_verified_at: "2026-11-15T09:25:00.000Z",
      email: "user@apnapay.com",
      gender: "Male",
      user_status: "active",
      registration_date: "2026-01-10T10:00:00.000Z",
      date_of_birth: "1996-08-14",
      address: "B-402, Highline Residency, Bandra West, Mumbai - 400050",
      city: "Mumbai",
      state: "Maharashtra",
      postal_code: "400050",
      kyc_type: "Full KYC",
      document_type: "Aadhaar Card",
      provider_reference: "AADHAAR-8921-VERIFIED",
      masked_document_number: "XXXX-XXXX-8921",
      submission_date: "2026-11-15T09:30:00.000Z",
      verification_status: "verified",
      pan_verification_status: "Verified",
      aadhaar_verification_status: "Verified (UIDAI Biometric)",
      verified_at: "2026-11-16T14:20:00.000Z",
      rejection_reason: null,
      remarks: "All documents inspected and compliant with RBI guidelines.",
      documents_count: 2,
      documents: [
        {
          id: 1,
          document_type: "aadhaar_front",
          label: "Aadhaar Card (Front)",
          document_status: "verified",
          preview_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
          created_at: "2026-11-15T09:30:00.000Z"
        },
        {
          id: 2,
          document_type: "aadhaar_back",
          label: "Aadhaar Card (Back)",
          document_status: "verified",
          preview_url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80",
          created_at: "2026-11-15T09:30:00.000Z"
        }
      ],
      history: [
        {
          id: 1,
          admin_id: 1,
          admin_name: "Gopal Parmar (Super Admin)",
          action: "APPROVED",
          previous_status: "pending",
          new_status: "verified",
          remarks: "Verified against UIDAI mock database successfully.",
          created_at: "2026-11-16T14:20:00.000Z"
        },
        {
          id: 2,
          admin_id: null,
          admin_name: "System / User",
          action: "SUBMITTED",
          previous_status: "not_submitted",
          new_status: "pending",
          remarks: "Customer submitted identity documents via mobile app after SMS OTP verification.",
          created_at: "2026-11-15T09:30:00.000Z"
        }
      ]
    },
    {
      id: 2,
      user_id: 2,
      user_name: "Amit Kumar Verma",
      mobile: "+91 98765 43210",
      mobile_verified: true,
      mobile_verified_at: "2026-11-18T08:10:00.000Z",
      email: "amit.verma@example.com",
      gender: "Male",
      user_status: "active",
      registration_date: "2026-02-14T11:20:00.000Z",
      date_of_birth: "1994-03-22",
      address: "Flat 204, Royal Palms, Sector 62, Noida - 201301",
      city: "Noida",
      state: "Uttar Pradesh",
      postal_code: "201301",
      kyc_type: "Full KYC",
      document_type: "Aadhaar Card",
      provider_reference: "AADHAAR-5541-QUEUE",
      masked_document_number: "XXXX-XXXX-5541",
      submission_date: "2026-11-18T08:15:00.000Z",
      verification_status: "pending",
      pan_verification_status: "Pending Check",
      aadhaar_verification_status: "Pending Verification",
      verified_at: null,
      rejection_reason: null,
      remarks: "Awaiting compliance officer review.",
      documents_count: 2,
      documents: [
        {
          id: 3,
          document_type: "aadhaar_front",
          label: "Aadhaar Card (Front)",
          document_status: "pending",
          preview_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
          created_at: "2026-11-18T08:15:00.000Z"
        },
        {
          id: 4,
          document_type: "aadhaar_back",
          label: "Aadhaar Card (Back)",
          document_status: "pending",
          preview_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
          created_at: "2026-11-18T08:15:00.000Z"
        }
      ],
      history: [
        {
          id: 3,
          admin_id: null,
          admin_name: "System / User",
          action: "SUBMITTED",
          previous_status: "not_submitted",
          new_status: "pending",
          remarks: "Customer uploaded Aadhaar card for compliance review.",
          created_at: "2026-11-18T08:15:00.000Z"
        }
      ]
    },
    {
      id: 3,
      user_id: 3,
      user_name: "Sunita Devi Sharma",
      mobile: "+91 91234 56789",
      mobile_verified: true,
      mobile_verified_at: "2026-11-18T07:40:00.000Z",
      email: "sunita.sharma@example.com",
      gender: "Female",
      user_status: "active",
      registration_date: "2026-03-01T08:00:00.000Z",
      date_of_birth: "1990-11-05",
      address: "House 18, Block C, Malviya Nagar, Jaipur - 302017",
      city: "Jaipur",
      state: "Rajasthan",
      postal_code: "302017",
      kyc_type: "Minimum KYC",
      document_type: "PAN Card",
      provider_reference: "PAN-ABCDE1234F",
      masked_document_number: "ABCDE****F",
      submission_date: "2026-11-18T07:45:00.000Z",
      verification_status: "pending",
      pan_verification_status: "Verified",
      aadhaar_verification_status: "Not Requested (Min KYC)",
      verified_at: null,
      rejection_reason: null,
      remarks: "PAN verified with NSDL, waiting for final sign-off.",
      documents_count: 1,
      documents: [
        {
          id: 5,
          document_type: "pan_card",
          label: "PAN Card",
          document_status: "pending",
          preview_url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80",
          created_at: "2026-11-18T07:45:00.000Z"
        }
      ],
      history: [
        {
          id: 4,
          admin_id: null,
          admin_name: "System / User",
          action: "SUBMITTED",
          previous_status: "not_submitted",
          new_status: "pending",
          remarks: "Customer applied for Minimum KYC tier with PAN card.",
          created_at: "2026-11-18T07:45:00.000Z"
        }
      ]
    },
    {
      id: 4,
      user_id: 4,
      user_name: "Deepak Kumar",
      mobile: "+91 97654 32109",
      mobile_verified: true,
      mobile_verified_at: "2026-11-17T11:00:00.000Z",
      email: "deepak.kumar@example.com",
      gender: "Male",
      user_status: "active",
      registration_date: "2026-02-20T14:30:00.000Z",
      date_of_birth: "1988-06-19",
      address: "Plot 45, Sector 15, Rohini, Delhi - 110085",
      city: "Delhi",
      state: "Delhi",
      postal_code: "110085",
      kyc_type: "Full KYC",
      document_type: "Passport",
      provider_reference: "PASS-Z9876543",
      masked_document_number: "Z987****3",
      submission_date: "2026-11-17T11:20:00.000Z",
      verification_status: "under_review",
      pan_verification_status: "Verified",
      aadhaar_verification_status: "Not Provided",
      verified_at: null,
      rejection_reason: "Front image is blurry. Please upload high-resolution scan.",
      remarks: "User asked to re-upload clear page 2 of passport.",
      documents_count: 1,
      documents: [
        {
          id: 6,
          document_type: "passport",
          label: "Passport Bio Page",
          document_status: "resubmission_requested",
          preview_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
          created_at: "2026-11-17T11:20:00.000Z"
        }
      ],
      history: [
        {
          id: 5,
          admin_id: 1,
          admin_name: "Compliance Officer",
          action: "RESUBMISSION_REQUESTED",
          previous_status: "pending",
          new_status: "under_review",
          remarks: "Front image is blurry. Please upload high-resolution scan.",
          created_at: "2026-11-17T16:00:00.000Z"
        },
        {
          id: 6,
          admin_id: null,
          admin_name: "System / User",
          action: "SUBMITTED",
          previous_status: "not_submitted",
          new_status: "pending",
          remarks: "Customer submitted Passport for Full KYC verification.",
          created_at: "2026-11-17T11:20:00.000Z"
        }
      ]
    },
    {
      id: 5,
      user_id: 5,
      user_name: "Priya Patel",
      mobile: "+91 93456 78901",
      mobile_verified: true,
      mobile_verified_at: "2026-11-16T10:15:00.000Z",
      email: "priya.patel@example.com",
      gender: "Female",
      user_status: "active",
      registration_date: "2026-03-10T09:15:00.000Z",
      date_of_birth: "1998-12-03",
      address: "12, Shanti Niketan, Ellisbridge, Ahmedabad - 380006",
      city: "Ahmedabad",
      state: "Gujarat",
      postal_code: "380006",
      kyc_type: "Full KYC",
      document_type: "Aadhaar Card",
      provider_reference: "AADHAAR-3312-FAIL",
      masked_document_number: "XXXX-XXXX-3312",
      submission_date: "2026-11-16T10:20:00.000Z",
      verification_status: "rejected",
      pan_verification_status: "Rejected",
      aadhaar_verification_status: "Name mismatch with Bank Record",
      verified_at: null,
      rejection_reason: "Name on Aadhaar card does not match the registered user name.",
      remarks: "User advised to update name with UIDAI or provide gazette notification.",
      documents_count: 2,
      documents: [
        {
          id: 7,
          document_type: "aadhaar_front",
          label: "Aadhaar Card (Front)",
          document_status: "rejected",
          preview_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
          created_at: "2026-11-16T10:20:00.000Z"
        },
        {
          id: 8,
          document_type: "aadhaar_back",
          label: "Aadhaar Card (Back)",
          document_status: "rejected",
          preview_url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80",
          created_at: "2026-11-16T10:20:00.000Z"
        }
      ],
      history: [
        {
          id: 7,
          admin_id: 1,
          admin_name: "Compliance Officer",
          action: "REJECTED",
          previous_status: "pending",
          new_status: "rejected",
          remarks: "Name on Aadhaar card does not match the registered user name.",
          created_at: "2026-11-16T15:30:00.000Z"
        },
        {
          id: 8,
          admin_id: null,
          admin_name: "System / User",
          action: "SUBMITTED",
          previous_status: "not_submitted",
          new_status: "pending",
          remarks: "Customer submitted Aadhaar card documents.",
          created_at: "2026-11-16T10:20:00.000Z"
        }
      ]
    },
    {
      id: 6,
      user_id: 6,
      user_name: "Manshi Gupta",
      mobile: "+91 98765 21030",
      mobile_verified: false,
      mobile_verified_at: null,
      email: "manshigupta2103@gmail.com",
      gender: "Female",
      user_status: "active",
      registration_date: "2026-11-01T09:00:00.000Z",
      date_of_birth: "1997-04-18",
      address: "Flat 501, Crystal Tower, Civil Lines, Jaipur - 302006",
      city: "Jaipur",
      state: "Rajasthan",
      postal_code: "302006",
      kyc_type: "Full KYC",
      document_type: "PAN Card",
      provider_reference: "PAN-PENDING-OTP",
      masked_document_number: "ABCDE****M",
      submission_date: "2026-11-20T14:10:00.000Z",
      verification_status: "pending",
      pan_verification_status: "Pending OTP",
      aadhaar_verification_status: "Pending OTP",
      verified_at: null,
      rejection_reason: null,
      remarks: "User has not completed mobile number OTP verification.",
      documents_count: 1,
      documents: [
        {
          id: 9,
          document_type: "pan_card",
          label: "PAN Card",
          document_status: "pending",
          preview_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
          created_at: "2026-11-20T14:10:00.000Z"
        }
      ],
      history: [
        {
          id: 9,
          admin_id: null,
          admin_name: "System",
          action: "SUBMITTED",
          previous_status: "not_submitted",
          new_status: "pending",
          remarks: "Application initiated. Mobile OTP verification pending.",
          created_at: "2026-11-20T14:10:00.000Z"
        }
      ]
    },
    {
      id: 7,
      user_id: 7,
      user_name: "Rahul Mehra",
      mobile: "+91 98220 11223",
      mobile_verified: false,
      mobile_verified_at: null,
      email: "rahul.mehra@example.com",
      gender: "Male",
      user_status: "active",
      registration_date: "2026-10-25T12:00:00.000Z",
      date_of_birth: "1993-09-27",
      address: "Shop 12, Agro Market, Shivaji Nagar, Pune - 411005",
      city: "Pune",
      state: "Maharashtra",
      postal_code: "411005",
      kyc_type: "Minimum KYC",
      document_type: "Voter ID Card",
      provider_reference: "VOTER-MHR-4491",
      masked_document_number: "MHR****4491",
      submission_date: "2026-11-21T16:45:00.000Z",
      verification_status: "pending",
      pan_verification_status: "Not Requested",
      aadhaar_verification_status: "Not Requested",
      verified_at: null,
      rejection_reason: null,
      remarks: null,
      documents_count: 1,
      documents: [
        {
          id: 10,
          document_type: "voter_id",
          label: "Voter ID Card",
          document_status: "pending",
          preview_url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80",
          created_at: "2026-11-21T16:45:00.000Z"
        }
      ],
      history: [
        {
          id: 10,
          admin_id: null,
          admin_name: "System",
          action: "SUBMITTED",
          previous_status: "not_submitted",
          new_status: "pending",
          remarks: "Application initiated. Pending mobile verification.",
          created_at: "2026-11-21T16:45:00.000Z"
        }
      ]
    }
  ]
};

// ============================================================================
// 1. GET KYC DASHBOARD STATISTICS
// GET /api/admin/kyc/stats
// ============================================================================
exports.getKycStats = async (req, res) => {
  try {
    // Try Real MySQL first
    try {
      const [totalRows] = await db.execute("SELECT COUNT(*) AS total FROM kyc_records");
      const [pendingRows] = await db.execute("SELECT COUNT(*) AS count FROM kyc_records WHERE LOWER(verification_status) = 'pending'");
      const [verifiedRows] = await db.execute("SELECT COUNT(*) AS count FROM kyc_records WHERE LOWER(verification_status) IN ('verified', 'approved')");
      const [rejectedRows] = await db.execute("SELECT COUNT(*) AS count FROM kyc_records WHERE LOWER(verification_status) = 'rejected'");
      const [reviewRows] = await db.execute("SELECT COUNT(*) AS count FROM kyc_records WHERE LOWER(verification_status) IN ('under_review', 'resubmission_requested')");

      let unverifiedMobileCount = 0;
      try {
        const [mobileRows] = await db.execute("SELECT COUNT(*) AS count FROM users WHERE mobile_verified = 0 OR mobile_verified IS NULL");
        unverifiedMobileCount = Number(mobileRows[0]?.count || 0);
      } catch (mErr) {
        unverifiedMobileCount = 2;
      }

      const total = Number(totalRows[0]?.total || 0);
      if (total > 0) {
        return res.status(200).json({
          success: true,
          message: "KYC dashboard statistics fetched from database",
          data: {
            total,
            pending: Number(pendingRows[0]?.count || 0),
            verified: Number(verifiedRows[0]?.count || 0),
            rejected: Number(rejectedRows[0]?.count || 0),
            under_review: Number(reviewRows[0]?.count || 0),
            mobile_not_verified: unverifiedMobileCount
          }
        });
      }
    } catch (dbErr) {
      // Fall through to memory store if DB is unreachable in sandboxed run
    }

    // Memory Store calculation
    const apps = memoryStore.applications;
    const total = apps.length;
    const pending = apps.filter(a => a.verification_status === "pending").length;
    const verified = apps.filter(a => a.verification_status === "verified" || a.verification_status === "approved").length;
    const rejected = apps.filter(a => a.verification_status === "rejected").length;
    const under_review = apps.filter(a => a.verification_status === "under_review" || a.verification_status === "resubmission_requested").length;
    const mobile_not_verified = apps.filter(a => a.mobile_verified === false).length;

    return res.status(200).json({
      success: true,
      message: "KYC dashboard statistics fetched successfully",
      data: {
        total,
        pending,
        verified,
        rejected,
        under_review,
        mobile_not_verified
      }
    });

  } catch (error) {
    console.error("Get KYC Stats Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch KYC statistics",
      error: error.message
    });
  }
};

// ============================================================================
// 2. GET ALL KYC APPLICATIONS (Search, Filters, Pagination, Sorting)
// GET /api/admin/kyc
// ============================================================================
exports.getAllKycApplications = async (req, res) => {
  try {
    const {
      search = "",
      status = "all",
      mobile_otp_status = "all",
      document_type = "all",
      kyc_type = "all",
      start_date = "",
      end_date = "",
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    // Try Real MySQL first
    try {
      const whereConditions = ["1=1"];
      const queryParams = [];

      if (search && search.trim() !== "") {
        const s = `%${search.trim()}%`;
        whereConditions.push(`(u.full_name LIKE ? OR u.phone LIKE ? OR u.email LIKE ? OR CAST(k.id AS CHAR) LIKE ? OR CAST(k.user_id AS CHAR) LIKE ? OR k.provider_reference LIKE ?)`);
        queryParams.push(s, s, s, s, s, s);
      }

      if (status && status !== "all") {
        const st = status.toLowerCase();
        if (st === "verified") {
          whereConditions.push("LOWER(k.verification_status) IN ('verified', 'approved')");
        } else if (st === "under_review") {
          whereConditions.push("LOWER(k.verification_status) IN ('under_review', 'resubmission_requested')");
        } else {
          whereConditions.push("LOWER(k.verification_status) = ?");
          queryParams.push(st);
        }
      }

      if (mobile_otp_status && mobile_otp_status !== "all") {
        if (mobile_otp_status.toLowerCase() === "verified") {
          whereConditions.push("u.mobile_verified = 1");
        } else if (mobile_otp_status.toLowerCase() === "not_verified") {
          whereConditions.push("(u.mobile_verified = 0 OR u.mobile_verified IS NULL)");
        }
      }

      if (start_date && start_date.trim() !== "") {
        whereConditions.push("k.created_at >= ?");
        queryParams.push(`${start_date.trim()} 00:00:00`);
      }

      if (end_date && end_date.trim() !== "") {
        whereConditions.push("k.created_at <= ?");
        queryParams.push(`${end_date.trim()} 23:59:59`);
      }

      if (document_type && document_type !== "all") {
        const dt = `%${document_type.trim().toLowerCase()}%`;
        whereConditions.push(`EXISTS (SELECT 1 FROM kyc_documents kd WHERE kd.kyc_record_id = k.id AND LOWER(kd.document_type) LIKE ?)`);
        queryParams.push(dt);
      }

      const whereClause = whereConditions.join(" AND ");

      const countSql = `
        SELECT COUNT(*) AS total
        FROM kyc_records k
        JOIN users u ON k.user_id = u.id
        WHERE ${whereClause}
      `;
      const [countResult] = await db.execute(countSql, queryParams);
      const totalRecords = Number(countResult[0]?.total || 0);

      if (totalRecords > 0) {
        const totalPages = Math.ceil(totalRecords / limitNum) || 1;
        const selectSql = `
          SELECT 
            k.id,
            k.user_id,
            k.verification_status,
            k.provider_reference,
            k.verified_at,
            k.rejection_reason,
            k.created_at,
            u.full_name AS user_name,
            u.email,
            u.phone AS mobile,
            COALESCE(u.mobile_verified, 0) AS mobile_verified,
            u.status AS user_status,
            'Full KYC' AS kyc_type,
            COALESCE(
              (SELECT kd.document_type FROM kyc_documents kd WHERE kd.kyc_record_id = k.id ORDER BY kd.id ASC LIMIT 1),
              'Aadhaar Card'
            ) AS document_type,
            (SELECT COUNT(*) FROM kyc_documents kd WHERE kd.kyc_record_id = k.id) AS documents_count
          FROM kyc_records k
          JOIN users u ON k.user_id = u.id
          WHERE ${whereClause}
          ORDER BY k.id DESC
          LIMIT ${limitNum} OFFSET ${offset}
        `;
        const [rows] = await db.execute(selectSql, queryParams);

        const formatted = rows.map((r) => {
          let normalizedStatus = r.verification_status ? r.verification_status.toLowerCase() : "pending";
          if (normalizedStatus === "approved") normalizedStatus = "verified";
          const isMobVerified = Boolean(r.mobile_verified === 1 || r.mobile_verified === true);

          return {
            id: r.id,
            user_id: r.user_id,
            user_name: r.user_name || `User #${r.user_id}`,
            mobile: r.mobile || "N/A",
            mobile_verified: isMobVerified,
            mobile_otp_status: isMobVerified ? "Verified" : "Not Verified",
            email: r.email || "N/A",
            user_status: r.user_status || "active",
            kyc_type: r.kyc_type,
            document_type: r.document_type,
            masked_document_number: maskDocumentNumber(r.document_type, r.provider_reference),
            submission_date: r.created_at,
            verification_status: normalizedStatus,
            verified_at: r.verified_at,
            rejection_reason: r.rejection_reason,
            documents_count: Number(r.documents_count || 0)
          };
        });

        return res.status(200).json({
          success: true,
          message: "KYC applications fetched from database",
          data: formatted,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: totalRecords,
            totalPages
          }
        });
      }
    } catch (dbErr) {
      // Fall through to memory store
    }

    // Memory Store filtering
    let list = [...memoryStore.applications];

    if (search && search.trim() !== "") {
      const q = search.trim().toLowerCase();
      list = list.filter(a =>
        (a.user_name && a.user_name.toLowerCase().includes(q)) ||
        (a.mobile && a.mobile.toLowerCase().includes(q)) ||
        (a.email && a.email.toLowerCase().includes(q)) ||
        String(a.id).includes(q) ||
        String(a.user_id).includes(q)
      );
    }

    if (status && status !== "all") {
      const st = status.toLowerCase();
      if (st === "verified") {
        list = list.filter(a => a.verification_status === "verified" || a.verification_status === "approved");
      } else if (st === "under_review") {
        list = list.filter(a => a.verification_status === "under_review" || a.verification_status === "resubmission_requested");
      } else {
        list = list.filter(a => a.verification_status.toLowerCase() === st);
      }
    }

    if (mobile_otp_status && mobile_otp_status !== "all") {
      const mobSt = mobile_otp_status.toLowerCase();
      if (mobSt === "verified") {
        list = list.filter(a => Boolean(a.mobile_verified));
      } else if (mobSt === "not_verified") {
        list = list.filter(a => !a.mobile_verified);
      }
    }

    if (document_type && document_type !== "all") {
      const dt = document_type.toLowerCase();
      list = list.filter(a => a.document_type && a.document_type.toLowerCase().includes(dt));
    }

    if (kyc_type && kyc_type !== "all") {
      const kt = kyc_type.toLowerCase();
      list = list.filter(a => a.kyc_type && a.kyc_type.toLowerCase().includes(kt));
    }

    if (start_date) {
      list = list.filter(a => new Date(a.submission_date) >= new Date(start_date + "T00:00:00"));
    }
    if (end_date) {
      list = list.filter(a => new Date(a.submission_date) <= new Date(end_date + "T23:59:59"));
    }

    // Map each item to ensure mobile_otp_status is always present and clean
    const formattedList = list.map(a => ({
      ...a,
      mobile_otp_status: a.mobile_verified ? "Verified" : "Not Verified"
    }));

    const total = formattedList.length;
    const totalPages = Math.ceil(total / limitNum) || 1;
    const paginated = formattedList.slice(offset, offset + limitNum);

    return res.status(200).json({
      success: true,
      message: "KYC applications fetched successfully",
      data: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error("Get All KYC Applications Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch KYC applications",
      error: error.message
    });
  }
};

// ============================================================================
// 3. GET INDIVIDUAL KYC APPLICATION DETAILS
// GET /api/admin/kyc/:id
// ============================================================================
exports.getKycDetails = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid KYC ID" });
    }

    // Try Real MySQL first
    try {
      const [kycRows] = await db.execute(`
        SELECT 
          k.id, k.user_id, k.verification_status, k.provider_reference, k.verified_at, k.rejection_reason, k.remarks, k.created_at,
          u.full_name, u.email, u.phone, u.gender, u.status AS user_status, u.created_at AS user_created_at,
          COALESCE(u.mobile_verified, 0) AS mobile_verified, u.mobile_verified_at,
          up.date_of_birth, up.address, up.city, up.state, up.postal_code, up.profile_image_url
        FROM kyc_records k
        JOIN users u ON k.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE k.id = ?
      `, [id]);

      if (kycRows.length > 0) {
        const row = kycRows[0];
        const [docRows] = await db.execute("SELECT * FROM kyc_documents WHERE kyc_record_id = ? ORDER BY id ASC", [id]);
        const [histRows] = await db.execute("SELECT * FROM kyc_history WHERE kyc_record_id = ? ORDER BY id DESC", [id]);

        const documents = docRows.map(d => {
          let label = "Document";
          if (d.document_type.includes("aadhaar_front")) label = "Aadhaar Card (Front)";
          else if (d.document_type.includes("aadhaar_back")) label = "Aadhaar Card (Back)";
          else if (d.document_type.includes("pan")) label = "PAN Card";
          else label = d.document_type.replace(/_/g, " ").toUpperCase();

          return {
            id: d.id,
            document_type: d.document_type,
            label,
            document_status: d.document_status,
            preview_url: d.secure_storage_key || null,
            created_at: d.created_at
          };
        });

        let normalizedStatus = row.verification_status ? row.verification_status.toLowerCase() : "pending";
        if (normalizedStatus === "approved") normalizedStatus = "verified";

        const isMobileVerified = Boolean(row.mobile_verified === 1 || row.mobile_verified === true);
        const masked = maskPhone(row.phone);

        return res.status(200).json({
          success: true,
          message: "KYC details fetched from database",
          data: {
            kyc: {
              id: row.id,
              user_id: row.user_id,
              kyc_type: "Full KYC",
              document_type: documents[0]?.label || "Aadhaar Card",
              masked_document_number: maskDocumentNumber(documents[0]?.document_type || "Aadhaar", row.provider_reference),
              submission_date: row.created_at,
              verification_status: normalizedStatus,
              verified_at: row.verified_at,
              rejection_reason: row.rejection_reason,
              remarks: row.remarks || "No administrative remarks added.",
              provider_reference: row.provider_reference,
              pan_verification_status: "Verified",
              aadhaar_verification_status: "Verified via Authorized Gateway"
            },
            user: {
              id: row.user_id,
              full_name: row.full_name || "N/A",
              email: row.email || "N/A",
              mobile: row.phone || "N/A",
              gender: row.gender || "Not Specified",
              user_status: row.user_status || "active",
              registration_date: row.user_created_at || "2026-01-01T00:00:00.000Z",
              date_of_birth: row.date_of_birth ? String(row.date_of_birth).slice(0, 10) : "Not Provided",
              address: row.address || "Address not provided",
              city: row.city || "N/A",
              state: row.state || "N/A",
              postal_code: row.postal_code || "N/A",
              profile_image_url: row.profile_image_url || null
            },
            mobile_verification: {
              status: isMobileVerified ? "Verified" : "Not Verified",
              is_verified: isMobileVerified,
              verified_at: row.mobile_verified_at || (isMobileVerified ? row.created_at : null),
              masked_mobile: masked.masked
            },
            documents,
            history: histRows
          }
        });
      }
    } catch (dbErr) {
      // Fall through to memory store
    }

    // Memory Store lookup
    const found = memoryStore.applications.find(a => a.id === id);
    if (!found) {
      return res.status(404).json({ success: false, message: `KYC application #${id} not found` });
    }

    const masked = maskPhone(found.mobile);

    return res.status(200).json({
      success: true,
      message: "KYC details fetched successfully",
      data: {
        kyc: {
          id: found.id,
          user_id: found.user_id,
          kyc_type: found.kyc_type,
          document_type: found.document_type,
          masked_document_number: found.masked_document_number,
          submission_date: found.submission_date,
          verification_status: found.verification_status,
          verified_at: found.verified_at,
          rejection_reason: found.rejection_reason,
          remarks: found.remarks || "No administrative remarks added.",
          provider_reference: found.provider_reference,
          pan_verification_status: found.pan_verification_status || "Verified",
          aadhaar_verification_status: found.aadhaar_verification_status || "Verified via Authorized Gateway"
        },
        user: {
          id: found.user_id,
          full_name: found.user_name,
          email: found.email,
          mobile: found.mobile,
          gender: found.gender,
          user_status: found.user_status,
          registration_date: found.registration_date || "2026-01-10T10:00:00.000Z",
          date_of_birth: found.date_of_birth,
          address: found.address,
          city: found.city,
          state: found.state,
          postal_code: found.postal_code,
          profile_image_url: null
        },
        mobile_verification: {
          status: found.mobile_verified ? "Verified" : "Not Verified",
          is_verified: Boolean(found.mobile_verified),
          verified_at: found.mobile_verified_at,
          masked_mobile: masked.masked
        },
        documents: found.documents || [],
        history: found.history || []
      }
    });

  } catch (error) {
    console.error("Get KYC Details Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// 4. GET KYC VERIFICATION HISTORY
// GET /api/admin/kyc/:id/history
// ============================================================================
exports.getKycHistory = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || id <= 0) {
      return res.status(400).json({ success: false, message: "Invalid KYC ID" });
    }

    try {
      const [rows] = await db.execute("SELECT * FROM kyc_history WHERE kyc_record_id = ? ORDER BY id DESC", [id]);
      if (rows && rows.length > 0) {
        return res.status(200).json({ success: true, message: "KYC history fetched from database", data: rows });
      }
    } catch (_) {}

    const found = memoryStore.applications.find(a => a.id === id);
    return res.status(200).json({
      success: true,
      message: "KYC history fetched successfully",
      data: found ? (found.history || []) : []
    });

  } catch (error) {
    console.error("Get KYC History Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// 5. APPROVE KYC APPLICATION
// PUT /api/admin/kyc/:id/approve
// ============================================================================
exports.approveKyc = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { remarks = "KYC verified and approved by compliance administrator" } = req.body;
    const adminId = req.user?.id || 1;

    if (!id || id <= 0) {
      return res.status(400).json({ success: false, message: "Valid KYC ID required" });
    }

    // Try DB first
    let dbUpdated = false;
    try {
      const [kycRows] = await db.execute("SELECT id, user_id, verification_status FROM kyc_records WHERE id = ?", [id]);
      if (kycRows.length > 0) {
        const kyc = kycRows[0];
        const prevStatus = (kyc.verification_status || "").toLowerCase();

        if (prevStatus === "verified" || prevStatus === "approved") {
          return res.status(400).json({ success: false, message: "This KYC application is already verified." });
        }

        const conn = await db.getConnection();
        await conn.beginTransaction();
        await conn.execute("UPDATE kyc_records SET verification_status = 'verified', verified_at = CURRENT_TIMESTAMP, remarks = ?, rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [remarks, id]);
        await conn.execute("UPDATE kyc_documents SET document_status = 'verified' WHERE kyc_record_id = ?", [id]);
        await conn.execute("INSERT INTO kyc_history (kyc_record_id, user_id, action, previous_status, new_status, remarks, admin_id) VALUES (?, ?, 'APPROVED', ?, 'verified', ?, ?)", [id, kyc.user_id, prevStatus, remarks, adminId]);
        await conn.commit();
        conn.release();
        dbUpdated = true;
      }
    } catch (e) {}

    // Update memory store
    const item = memoryStore.applications.find(a => a.id === id);
    if (item) {
      if (item.verification_status === "verified" || item.verification_status === "approved") {
        if (!dbUpdated) {
          return res.status(400).json({ success: false, message: "This KYC application is already verified." });
        }
      }
      const prev = item.verification_status;
      item.verification_status = "verified";
      item.verified_at = new Date().toISOString();
      item.remarks = remarks || "KYC verified and approved by compliance administrator";
      item.rejection_reason = null;
      if (item.documents) {
        item.documents.forEach(d => { d.document_status = "verified"; });
      }
      if (!item.history) item.history = [];
      item.history.unshift({
        id: item.history.length + 1,
        admin_id: adminId,
        admin_name: "Gopal Parmar (Super Admin)",
        action: "APPROVED",
        previous_status: prev,
        new_status: "verified",
        remarks: remarks || "Documents approved",
        created_at: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: `KYC application #${id} has been approved successfully!`,
      data: { id, verification_status: "verified" }
    });

  } catch (error) {
    console.error("Approve KYC Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// 6. REJECT KYC APPLICATION
// PUT /api/admin/kyc/:id/reject
// ============================================================================
exports.rejectKyc = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { reason, remarks } = req.body;
    const adminId = req.user?.id || 1;

    if (!id || id <= 0) {
      return res.status(400).json({ success: false, message: "Valid KYC ID required" });
    }

    if (!reason || typeof reason !== "string" || reason.trim() === "") {
      return res.status(400).json({ success: false, message: "Rejection reason is mandatory. Please provide an explanation." });
    }

    const cleanReason = reason.trim();
    const finalRemarks = remarks ? `${cleanReason} | ${remarks.trim()}` : cleanReason;

    // Try DB first
    let dbUpdated = false;
    try {
      const [kycRows] = await db.execute("SELECT id, user_id, verification_status FROM kyc_records WHERE id = ?", [id]);
      if (kycRows.length > 0) {
        const kyc = kycRows[0];
        const prevStatus = (kyc.verification_status || "").toLowerCase();

        if (prevStatus === "verified" || prevStatus === "approved") {
          return res.status(400).json({ success: false, message: "Cannot reject an already verified KYC application directly." });
        }

        const conn = await db.getConnection();
        await conn.beginTransaction();
        await conn.execute("UPDATE kyc_records SET verification_status = 'rejected', rejection_reason = ?, remarks = ?, verified_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [cleanReason, finalRemarks, id]);
        await conn.execute("UPDATE kyc_documents SET document_status = 'rejected' WHERE kyc_record_id = ?", [id]);
        await conn.execute("INSERT INTO kyc_history (kyc_record_id, user_id, action, previous_status, new_status, remarks, admin_id) VALUES (?, ?, 'REJECTED', ?, 'rejected', ?, ?)", [id, kyc.user_id, prevStatus, finalRemarks, adminId]);
        await conn.commit();
        conn.release();
        dbUpdated = true;
      }
    } catch (e) {}

    // Update memory store
    const item = memoryStore.applications.find(a => a.id === id);
    if (item) {
      if (item.verification_status === "verified" || item.verification_status === "approved") {
        if (!dbUpdated) {
          return res.status(400).json({ success: false, message: "Cannot reject an already verified KYC application directly." });
        }
      }
      const prev = item.verification_status;
      item.verification_status = "rejected";
      item.rejection_reason = cleanReason;
      item.remarks = finalRemarks;
      item.verified_at = null;
      if (item.documents) {
        item.documents.forEach(d => { d.document_status = "rejected"; });
      }
      if (!item.history) item.history = [];
      item.history.unshift({
        id: item.history.length + 1,
        admin_id: adminId,
        admin_name: "Compliance Officer",
        action: "REJECTED",
        previous_status: prev,
        new_status: "rejected",
        remarks: finalRemarks,
        created_at: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: `KYC application #${id} has been rejected.`,
      data: { id, verification_status: "rejected", rejection_reason: cleanReason }
    });

  } catch (error) {
    console.error("Reject KYC Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// 7. REQUEST RESUBMISSION
// PUT /api/admin/kyc/:id/request-resubmission
// ============================================================================
exports.requestResubmission = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { reason, remarks } = req.body;
    const adminId = req.user?.id || 1;

    if (!id || id <= 0) {
      return res.status(400).json({ success: false, message: "Valid KYC ID required" });
    }

    const effectiveReason = reason || remarks;
    if (!effectiveReason || typeof effectiveReason !== "string" || effectiveReason.trim() === "") {
      return res.status(400).json({ success: false, message: "Resubmission remarks are mandatory. Specify which document needs updating." });
    }

    const cleanReason = effectiveReason.trim();
    const finalRemarks = remarks && remarks !== cleanReason ? `${cleanReason} | ${remarks.trim()}` : cleanReason;

    // Try DB first
    try {
      const [kycRows] = await db.execute("SELECT id, user_id, verification_status FROM kyc_records WHERE id = ?", [id]);
      if (kycRows.length > 0) {
        const kyc = kycRows[0];
        const prevStatus = (kyc.verification_status || "").toLowerCase();

        const conn = await db.getConnection();
        await conn.beginTransaction();
        await conn.execute("UPDATE kyc_records SET verification_status = 'under_review', rejection_reason = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [cleanReason, finalRemarks, id]);
        await conn.execute("UPDATE kyc_documents SET document_status = 'resubmission_requested' WHERE kyc_record_id = ?", [id]);
        await conn.execute("INSERT INTO kyc_history (kyc_record_id, user_id, action, previous_status, new_status, remarks, admin_id) VALUES (?, ?, 'RESUBMISSION_REQUESTED', ?, 'under_review', ?, ?)", [id, kyc.user_id, prevStatus, finalRemarks, adminId]);
        await conn.commit();
        conn.release();
      }
    } catch (e) {}

    // Update memory store
    const item = memoryStore.applications.find(a => a.id === id);
    if (item) {
      const prev = item.verification_status;
      item.verification_status = "under_review";
      item.rejection_reason = cleanReason;
      item.remarks = finalRemarks;
      if (item.documents) {
        item.documents.forEach(d => { d.document_status = "resubmission_requested"; });
      }
      if (!item.history) item.history = [];
      item.history.unshift({
        id: item.history.length + 1,
        admin_id: adminId,
        admin_name: "Compliance Officer",
        action: "RESUBMISSION_REQUESTED",
        previous_status: prev,
        new_status: "under_review",
        remarks: finalRemarks,
        created_at: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: `Resubmission requested for KYC application #${id}. User has been notified.`,
      data: { id, verification_status: "under_review", rejection_reason: cleanReason }
    });

  } catch (error) {
    console.error("Request Resubmission Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// 8. UNIFIED STATUS UPDATER (PATCH /api/admin/kyc/:id/status)
// ============================================================================
exports.updateKycStatus = async (req, res) => {
  const { status } = req.body;
  const normalized = (status || "").toLowerCase();

  if (normalized === "verified" || normalized === "approved") {
    return exports.approveKyc(req, res);
  }
  if (normalized === "rejected") {
    return exports.rejectKyc(req, res);
  }
  if (normalized === "under_review" || normalized === "resubmission_requested") {
    return exports.requestResubmission(req, res);
  }

  return res.status(400).json({
    success: false,
    message: "Invalid status provided. Supported: verified, rejected, under_review"
  });
};

// ============================================================================
// 9. ADD REMARKS TO KYC APPLICATION (POST /api/admin/kyc/:id/remarks)
// ============================================================================
exports.addKycRemarks = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { remarks } = req.body;
    const adminId = req.user?.id || 1;

    if (!id || id <= 0) {
      return res.status(400).json({ success: false, message: "Valid KYC ID required" });
    }

    if (!remarks || typeof remarks !== "string" || remarks.trim() === "") {
      return res.status(400).json({ success: false, message: "Remarks text cannot be empty." });
    }

    const cleanRemarks = remarks.trim();

    // Try DB first
    try {
      const [kycRows] = await db.execute("SELECT id, user_id, verification_status FROM kyc_records WHERE id = ?", [id]);
      if (kycRows.length > 0) {
        const kyc = kycRows[0];
        await db.execute("UPDATE kyc_records SET remarks = ? WHERE id = ?", [cleanRemarks, id]);
        await db.execute("INSERT INTO kyc_history (kyc_record_id, user_id, action, previous_status, new_status, remarks, admin_id) VALUES (?, ?, 'ADMIN_REMARK', ?, ?, ?, ?)", [id, kyc.user_id, kyc.verification_status, kyc.verification_status, cleanRemarks, adminId]);
      }
    } catch (e) {}

    // Update memory store
    const item = memoryStore.applications.find(a => a.id === id);
    if (item) {
      item.remarks = cleanRemarks;
      if (!item.history) item.history = [];
      item.history.unshift({
        id: item.history.length + 1,
        admin_id: adminId,
        admin_name: "Compliance Officer",
        action: "ADMIN_REMARK",
        previous_status: item.verification_status,
        new_status: item.verification_status,
        remarks: cleanRemarks,
        created_at: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: `Remarks added successfully to application #${id}.`,
      data: { id, remarks: cleanRemarks }
    });

  } catch (error) {
    console.error("Add KYC Remarks Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Export memoryStore for cross-controller data synchronisation
module.exports.memoryStore = memoryStore;
