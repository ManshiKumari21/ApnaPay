const crypto = require("crypto");
const db = require("../config/db");
const { sendOtpSms, maskPhone } = require("../services/smsService");
const adminKycController = require("./adminKycController");

// In-memory OTP, user state, and KYC fallback store for resilient zero-downtime execution
const kycMemoryStore = {
  otps: new Map(), // key: userId -> { otpHash, expiresAt, attempts, purpose, createdAt, lastSentAt, cleanPhone }
  userStatus: new Map(), // key: userId -> { mobile_verified: boolean, mobile_verified_at: string, phone: string, pending_phone: string }
  personalDetails: new Map(), // key: userId -> { full_name, date_of_birth, gender, father_name, address, city, state, postal_code }
  documents: new Map() // key: userId -> [ { document_type, secure_storage_key, ... } ]
};

// Fallback demo user ID if unauthenticated
const FALLBACK_USER_ID = 1;

/**
 * Helper: Retrieve current user details from DB or memory fallback
 */
async function getUserRecord(userId) {
  let user = null;
  try {
    const [rows] = await db.execute(
      "SELECT id, full_name, email, phone, status, gender, phone_verified_at FROM users WHERE id = ?",
      [userId]
    );
    if (rows && rows.length > 0) {
      user = { ...rows[0] };
      user.mobile_verified = Boolean(user.phone_verified_at);
      user.mobile_verified_at = user.phone_verified_at;
    }
  } catch (err) {
    try {
      const [basicRows] = await db.execute(
        "SELECT id, full_name, email, phone, status, gender FROM users WHERE id = ?",
        [userId]
      );
      if (basicRows && basicRows.length > 0) {
        user = { ...basicRows[0] };
        user.mobile_verified = 0;
        user.mobile_verified_at = null;
      }
    } catch (e) {
      // Ignore
    }
  }

  if (!user) {
    user = {
      id: userId,
      full_name: "Customer",
      email: "user@example.com",
      phone: "+91 99812 80069",
      status: "active",
      gender: "Male",
      mobile_verified: 0,
      mobile_verified_at: null
    };
  }

  // Sync memory status if available
  const mem = kycMemoryStore.userStatus.get(userId);
  if (mem) {
    if (mem.mobile_verified !== undefined) {
      user.mobile_verified = mem.mobile_verified ? 1 : 0;
    }
    if (mem.mobile_verified_at !== undefined) {
      user.mobile_verified_at = mem.mobile_verified_at;
    }
    if (mem.phone) {
      user.phone = mem.phone;
    }
  }

  return user;
}

// ======================================
// 1. GET KYC STATUS
// GET /api/v1/kyc/status
// ======================================
exports.getKycStatus = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || FALLBACK_USER_ID;
    const user = await getUserRecord(userId);
    const masked = maskPhone(user.phone);

    let kycRecord = null;
    let documents = [];

    // Try fetching from DB
    try {
      const [records] = await db.execute(
        `SELECT *
         FROM kyc_records
         WHERE user_id = ?
         ORDER BY id DESC
         LIMIT 1`,
        [userId]
      );

      if (records && records.length > 0) {
        kycRecord = records[0];
        const [docs] = await db.execute(
          `SELECT id, document_type, secure_storage_key, document_status, created_at
           FROM kyc_documents
           WHERE kyc_record_id = ?
           ORDER BY id ASC`,
          [kycRecord.id]
        );
        documents = docs || [];
      }
    } catch (dbErr) {
      // Fall through to memory store
    }

    // If not in DB, check admin memory store
    if (!kycRecord && adminKycController.memoryStore) {
      const memApp = adminKycController.memoryStore.applications.find(
        (a) => Number(a.user_id) === Number(userId)
      );
      if (memApp) {
        kycRecord = {
          id: memApp.id,
          user_id: memApp.user_id,
          verification_status: memApp.verification_status,
          kyc_type: memApp.kyc_type,
          document_type: memApp.document_type,
          provider_reference: memApp.provider_reference,
          rejection_reason: memApp.rejection_reason,
          remarks: memApp.remarks,
          verified_at: memApp.verified_at,
          submission_date: memApp.submission_date,
          created_at: memApp.submission_date,
          pan_verification_status: memApp.pan_verification_status,
          aadhaar_verification_status: memApp.aadhaar_verification_status
        };
        documents = (memApp.documents || []).map(d => ({
          id: d.id,
          document_type: d.document_type,
          secure_storage_key: d.preview_url,
          document_status: d.document_status,
          created_at: d.created_at
        }));
      }
    }

    // Check memory documents if any
    const localDocs = kycMemoryStore.documents.get(userId);
    if (localDocs && localDocs.length > 0) {
      documents = [...localDocs, ...documents];
    }

    const isMobileVerified = Boolean(user.mobile_verified === 1 || user.mobile_verified === true || user.phone_verified_at);
    
    // Determine accurate KYC status
    let currentStatus = "not_submitted";
    if (kycRecord && kycRecord.verification_status) {
      currentStatus = kycRecord.verification_status.toLowerCase();
    }

    // Check active OTP from database or memory
    let activeOtpInfo = null;
    try {
      const [otpRows] = await db.execute(
        `SELECT phone, expires_at, attempts
         FROM otp_verifications
         WHERE user_id = ? AND purpose = 'kyc_mobile_verification' AND verified_at IS NULL AND expires_at > NOW()
         ORDER BY id DESC LIMIT 1`,
        [userId]
      );
      if (otpRows && otpRows.length > 0) {
        const o = otpRows[0];
        const rem = Math.max(0, Math.floor((new Date(o.expires_at).getTime() - Date.now()) / 1000));
        if (rem > 0) {
          activeOtpInfo = {
            phone: o.phone,
            masked_phone: maskPhone(o.phone).masked,
            expires_in_seconds: rem,
            attempts: o.attempts
          };
        }
      }
    } catch (_) {}

    // Get personal details from user_profiles table, memory or profile
    let personal = null;
    try {
      const [profileRows] = await db.execute(
        "SELECT date_of_birth, address, city, state, postal_code FROM user_profiles WHERE user_id = ?",
        [userId]
      );
      if (profileRows && profileRows.length > 0) {
        const prof = profileRows[0];
        personal = {
          full_name: user.full_name || "",
          date_of_birth: prof.date_of_birth ? new Date(prof.date_of_birth).toISOString().split('T')[0] : "",
          gender: user.gender || "Male",
          father_name: "",
          address: prof.address || "",
          city: prof.city || "",
          state: prof.state || "",
          postal_code: prof.postal_code || ""
        };
      }
    } catch (_) {}

    if (!personal) {
      const memPersonal = kycMemoryStore.personalDetails.get(userId);
      personal = memPersonal || {
        full_name: user.full_name || "",
        date_of_birth: "",
        gender: user.gender || "Male",
        father_name: "",
        address: "",
        city: "",
        state: "",
        postal_code: ""
      };
    }

    const hasPersonalDetails = Boolean(personal.full_name && personal.date_of_birth && personal.address);
    const hasDocuments = Boolean(documents && documents.length > 0) || (currentStatus !== "not_submitted");
    const isSubmitted = currentStatus === "pending" || currentStatus === "under_review" || currentStatus === "verified" || currentStatus === "approved" || currentStatus === "rejected" || currentStatus === "resubmission_requested";

    // Step calculation
    let currentStep = 1;
    if (isMobileVerified) {
      currentStep = 2;
      if (hasPersonalDetails) {
        currentStep = 3;
        if (hasDocuments) {
          currentStep = 4;
        }
      }
    }

    const stepProgress = {
      current_step: currentStep,
      step1: isMobileVerified ? "completed" : "current",
      step2: isMobileVerified ? (hasPersonalDetails ? "completed" : "current") : "locked",
      step3: (isMobileVerified && hasPersonalDetails) ? (hasDocuments ? "completed" : "current") : "locked",
      step4: (isMobileVerified && hasPersonalDetails && hasDocuments) ? (isSubmitted ? "completed" : "current") : "locked"
    };

    // Calculate human status label
    let statusLabel = "KYC Not Submitted";
    if (!isMobileVerified) {
      statusLabel = "Mobile Verification Required";
    } else if (currentStatus === "verified" || currentStatus === "approved") {
      statusLabel = "Verified";
    } else if (currentStatus === "rejected") {
      statusLabel = "Rejected";
    } else if (currentStatus === "resubmission_requested" || (currentStatus === "under_review" && kycRecord?.rejection_reason)) {
      statusLabel = "Document Resubmission Required";
    } else if (currentStatus === "under_review") {
      statusLabel = "Under Review";
    } else if (currentStatus === "pending" || currentStatus === "submitted") {
      statusLabel = "KYC Submitted";
    }

    return res.status(200).json({
      success: true,
      message: "KYC status retrieved successfully",
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          masked_phone: masked.masked,
          phone_last4: masked.last4
        },
        personal_details: personal,
        mobile_verification: {
          status: isMobileVerified ? "Verified" : "Not Verified",
          is_verified: isMobileVerified,
          verified_at: user.mobile_verified_at,
          masked_phone: masked.masked,
          registered_phone: user.phone
        },
        kyc: {
          verification_status: currentStatus,
          status_label: statusLabel,
          id: kycRecord?.id || null,
          kyc_type: kycRecord?.kyc_type || "Full KYC",
          document_type: kycRecord?.document_type || "Aadhaar Card",
          submission_date: kycRecord?.submission_date || kycRecord?.created_at || null,
          verified_at: kycRecord?.verified_at || null,
          rejection_reason: kycRecord?.rejection_reason || null,
          remarks: kycRecord?.remarks || null,
          pan_verification_status: kycRecord?.pan_verification_status || (currentStatus === "verified" ? "Verified" : "Pending Verification"),
          aadhaar_verification_status: kycRecord?.aadhaar_verification_status || (currentStatus === "verified" ? "Verified" : "Pending Verification"),
          documents: documents
        },
        active_otp: activeOtpInfo,
        step_progress: stepProgress,
        can_submit_kyc: isMobileVerified && (currentStatus === "not_submitted" || currentStatus === "rejected" || currentStatus === "resubmission_requested"),
        can_resubmit: currentStatus === "rejected" || currentStatus === "resubmission_requested" || (currentStatus === "under_review" && Boolean(kycRecord?.rejection_reason))
      }
    });

  } catch (error) {
    console.error("Get KYC Status Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching KYC status."
    });
  }
};

// ======================================
// 2. SEND MOBILE OTP
// POST /api/v1/kyc/send-otp
// ======================================
exports.sendMobileOtp = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || FALLBACK_USER_ID;
    const user = await getUserRecord(userId);

    // If mobile is already verified, disallow resending unless requested with new phone
    const hasNewPhone = req.body?.phone && String(req.body.phone).trim() !== "" && String(req.body.phone).trim() !== user.phone;
    if ((user.mobile_verified === 1 || user.mobile_verified === true) && !hasNewPhone) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is already verified."
      });
    }

    let phone = user.phone;
    if (hasNewPhone) {
      const raw = String(req.body.phone).trim();
      const digits = raw.replace(/\D/g, "");
      if (digits.length < 10) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid 10-digit mobile number."
        });
      }
      phone = raw.startsWith("+") ? raw : `+91 ${digits.slice(-10)}`;
      // Save pending phone change
      const currentMem = kycMemoryStore.userStatus.get(userId) || {};
      kycMemoryStore.userStatus.set(userId, {
        ...currentMem,
        pending_phone: phone
      });
    }

    const cleanPhone = String(phone).trim();
    const { masked, last4 } = maskPhone(cleanPhone);

    // 1. Rate Limiting Check (Memory store or DB)
    const existingOtp = kycMemoryStore.otps.get(userId);
    const now = Date.now();

    if (existingOtp) {
      const elapsedSeconds = Math.floor((now - existingOtp.lastSentAt) / 1000);
      if (elapsedSeconds < 60) {
        const remainingCooldown = 60 - elapsedSeconds;
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingCooldown} seconds before requesting a new OTP.`,
          cooldown_remaining_seconds: remainingCooldown
        });
      }

      // Max 4 requests in 15 minutes window
      if (existingOtp.requestCount >= 4 && (now - existingOtp.windowStart) < 15 * 60 * 1000) {
        return res.status(429).json({
          success: false,
          message: "Too many OTP requests. Please wait 15 minutes before requesting again."
        });
      }
    }

    // 2. Generate cryptographically secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();

    // 3. Generate SHA-256 hash with phone salt
    const otpHash = crypto
      .createHash("sha256")
      .update(`${cleanPhone}:${rawOtp}`)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // 4. Save to DB or memory
    try {
      await db.execute(
        `INSERT INTO otp_verifications
          (user_id, phone, otp_hash, purpose, expires_at, attempts)
         VALUES (?, ?, ?, 'kyc_mobile_verification', ?, 0)`,
        [userId, cleanPhone, otpHash, expiresAt]
      );
    } catch (dbErr) {
      // Memory fallback handles table absence or DB failure
    }

    // Update memory cache
    const windowStart = existingOtp && (now - existingOtp.windowStart) < 15 * 60 * 1000 ? existingOtp.windowStart : now;
    const requestCount = existingOtp && (now - existingOtp.windowStart) < 15 * 60 * 1000 ? (existingOtp.requestCount + 1) : 1;

    kycMemoryStore.otps.set(userId, {
      cleanPhone,
      otpHash,
      expiresAt: expiresAt.getTime(),
      attempts: 0,
      lastSentAt: now,
      windowStart,
      requestCount,
      purpose: "kyc_mobile_verification"
    });

    // 5. Send via configured SMS gateway
    const smsResult = await sendOtpSms({
      phone: cleanPhone,
      otp: rawOtp,
      purpose: "kyc_mobile_verification"
    });

    if (!smsResult.success) {
      return res.status(503).json({
        success: false,
        message: smsResult.message || "Failed to dispatch SMS through gateway."
      });
    }

    // Response must NEVER leak the OTP
    return res.status(200).json({
      success: true,
      message: `OTP sent successfully via SMS to ${cleanPhone}.`,
      data: {
        masked_phone: masked,
        phone_last4: last4,
        registered_phone: cleanPhone,
        expires_in_seconds: 300,
        resend_cooldown_seconds: 60
      }
    });

  } catch (error) {
    console.error("Send Mobile OTP Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while sending OTP."
    });
  }
};

// ======================================
// 3. VERIFY MOBILE OTP
// POST /api/v1/kyc/verify-otp
// ======================================
exports.verifyMobileOtp = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || FALLBACK_USER_ID;
    const { otp } = req.body;

    if (!otp || !/^\d{6}$/.test(String(otp).trim())) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP format. Please enter a 6-digit verification code."
      });
    }

    const cleanOtp = String(otp).trim();
    const user = await getUserRecord(userId);

    // Check DB first for active OTP
    let storedHash = null;
    let expiresAtTime = null;
    let currentAttempts = 0;
    let otpRecordId = null;
    let targetPhone = user.phone;

    try {
      const [rows] = await db.execute(
        `SELECT id, phone, otp_hash, expires_at, attempts
         FROM otp_verifications
         WHERE user_id = ?
           AND purpose = 'kyc_mobile_verification'
           AND verified_at IS NULL
         ORDER BY id DESC
         LIMIT 1`,
        [userId]
      );

      if (rows && rows.length > 0) {
        otpRecordId = rows[0].id;
        storedHash = rows[0].otp_hash;
        expiresAtTime = new Date(rows[0].expires_at).getTime();
        currentAttempts = Number(rows[0].attempts || 0);
        targetPhone = rows[0].phone || user.phone;
      }
    } catch (e) {
      // Fall through to memory
    }

    // If not found in DB, check memory
    if (!storedHash) {
      const memOtp = kycMemoryStore.otps.get(userId);
      if (memOtp && memOtp.purpose === "kyc_mobile_verification") {
        storedHash = memOtp.otpHash;
        expiresAtTime = memOtp.expiresAt;
        currentAttempts = memOtp.attempts;
        targetPhone = memOtp.cleanPhone;
      }
    }

    if (!storedHash) {
      return res.status(400).json({
        success: false,
        message: "No active OTP request found. Please request an OTP first."
      });
    }

    // Check expiration (5 minutes)
    if (Date.now() > expiresAtTime) {
      return res.status(400).json({
        success: false,
        message: "The OTP has expired. Please request a new verification code."
      });
    }

    // Check max attempts (3 attempts)
    if (currentAttempts >= 3) {
      return res.status(429).json({
        success: false,
        message: "Maximum incorrect verification attempts exceeded. Please request a new OTP."
      });
    }

    // Compare hash with timing-safe comparison
    const inputHash = crypto
      .createHash("sha256")
      .update(`${targetPhone}:${cleanOtp}`)
      .digest("hex");

    const isMatch = crypto.timingSafeEqual(
      Buffer.from(inputHash, "utf8"),
      Buffer.from(storedHash, "utf8")
    );

    if (!isMatch) {
      const newAttempts = currentAttempts + 1;
      const remainingAttempts = Math.max(0, 3 - newAttempts);

      if (otpRecordId) {
        try {
          await db.execute(
            "UPDATE otp_verifications SET attempts = ? WHERE id = ?",
            [newAttempts, otpRecordId]
          );
        } catch (e) {}
      }
      const mem = kycMemoryStore.otps.get(userId);
      if (mem) mem.attempts = newAttempts;

      return res.status(400).json({
        success: false,
        message: remainingAttempts > 0
          ? `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`
          : "Invalid verification code. Maximum attempts reached. Please request a new OTP.",
        remaining_attempts: remainingAttempts
      });
    }

    // OTP is valid! Mark as verified
    const verifiedTimestamp = new Date().toISOString();

    // 1. Update otp_verifications
    if (otpRecordId) {
      try {
        await db.execute(
          "UPDATE otp_verifications SET verified_at = NOW() WHERE id = ?",
          [otpRecordId]
        );
      } catch (e) {}
    }

    // 2. Check if user was changing phone number
    const memStatus = kycMemoryStore.userStatus.get(userId) || {};
    const finalPhone = memStatus.pending_phone || targetPhone || user.phone;

    // 3. Update users table with phone_verified_at and phone
    try {
      await db.execute(
        "UPDATE users SET phone = ?, phone_verified_at = NOW() WHERE id = ?",
        [finalPhone, userId]
      );
    } catch (e) {
      try {
        await db.execute(
          "UPDATE users SET phone = ?, mobile_verified = 1, mobile_verified_at = NOW() WHERE id = ?",
          [finalPhone, userId]
        );
      } catch (colErr) {}
    }

    // 4. Update memory status
    kycMemoryStore.userStatus.set(userId, {
      mobile_verified: true,
      mobile_verified_at: verifiedTimestamp,
      phone: finalPhone
    });
    kycMemoryStore.otps.delete(userId); // clear used OTP

    // Also update admin memoryStore if user exists there
    if (adminKycController.memoryStore) {
      const app = adminKycController.memoryStore.applications.find(
        (a) => Number(a.user_id) === Number(userId)
      );
      if (app) {
        app.mobile = finalPhone;
        app.mobile_verified = true;
        app.mobile_verified_at = verifiedTimestamp;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Mobile number verified successfully! Step 2 is now unlocked.",
      data: {
        mobile_verified: true,
        mobile_verified_at: verifiedTimestamp,
        phone: finalPhone
      }
    });

  } catch (error) {
    console.error("Verify Mobile OTP Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while verifying OTP."
    });
  }
};

// ======================================
// 4. RESEND MOBILE OTP
// POST /api/v1/kyc/resend-otp
// ======================================
exports.resendMobileOtp = async (req, res) => {
  return exports.sendMobileOtp(req, res);
};

// ======================================
// 5. UPDATE STEP 2 PERSONAL DETAILS
// PUT /api/v1/kyc/personal-details
// ======================================
exports.updatePersonalDetails = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || FALLBACK_USER_ID;
    const user = await getUserRecord(userId);

    // Require mobile verification first
    if (!user.mobile_verified && user.mobile_verified !== 1) {
      return res.status(403).json({
        success: false,
        message: "Mobile OTP verification must be completed before entering personal details."
      });
    }

    const {
      full_name,
      date_of_birth,
      gender = "Male",
      father_name,
      address,
      state,
      city,
      postal_code
    } = req.body;

    if (!full_name || !String(full_name).trim()) {
      return res.status(400).json({ success: false, message: "Full Legal Name is required." });
    }
    if (!date_of_birth) {
      return res.status(400).json({ success: false, message: "Date of Birth is required." });
    }
    if (!address || !String(address).trim()) {
      return res.status(400).json({ success: false, message: "Residential Address is required." });
    }
    if (!postal_code || !/^\d{6}$/.test(String(postal_code).trim())) {
      return res.status(400).json({ success: false, message: "Please enter a valid 6-digit PIN code." });
    }

    const saved = {
      full_name: String(full_name).trim(),
      date_of_birth: String(date_of_birth).trim(),
      gender: String(gender).trim(),
      father_name: father_name ? String(father_name).trim() : "",
      address: String(address).trim(),
      city: city ? String(city).trim() : "",
      state: state ? String(state).trim() : "",
      postal_code: String(postal_code).trim()
    };

    kycMemoryStore.personalDetails.set(userId, saved);

    // Update in MySQL if possible
    try {
      await db.execute(
        `UPDATE users SET full_name = ?, gender = ? WHERE id = ?`,
        [saved.full_name, saved.gender, userId]
      );
      await db.execute(
        `INSERT INTO user_profiles (user_id, date_of_birth, address, city, state, postal_code)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE date_of_birth = VALUES(date_of_birth), address = VALUES(address), city = VALUES(city), state = VALUES(state), postal_code = VALUES(postal_code)`,
        [userId, saved.date_of_birth, saved.address, saved.city, saved.state, saved.postal_code]
      );
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: "Personal information saved successfully. You may proceed to Document Verification.",
      data: saved
    });

  } catch (error) {
    console.error("Update Personal Details Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error saving personal details."
    });
  }
};

// ======================================
// 6. SUBMIT KYC APPLICATION & DOCUMENTS
// POST /api/v1/kyc/submit
// ======================================
exports.submitKyc = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || FALLBACK_USER_ID;
    const user = await getUserRecord(userId);

    // CRITICAL: Block submission if mobile is NOT verified
    if (user.mobile_verified !== 1 && user.mobile_verified !== true) {
      return res.status(403).json({
        success: false,
        message: "Mobile number OTP verification is mandatory before KYC document submission. Please verify your mobile number first."
      });
    }

    const savedPersonal = kycMemoryStore.personalDetails.get(userId) || {};

    const {
      kyc_type = "Full KYC",
      full_name = savedPersonal.full_name,
      date_of_birth = savedPersonal.date_of_birth,
      gender = savedPersonal.gender,
      father_name = savedPersonal.father_name,
      address = savedPersonal.address,
      city = savedPersonal.city,
      state = savedPersonal.state,
      postal_code = savedPersonal.postal_code,
      pan_number,
      aadhaar_number,
      document_type = "Aadhaar Card",
      pan_document,
      aadhaar_front_document,
      aadhaar_back_document,
      supporting_document
    } = req.body;

    // Validate PAN
    if (!pan_number || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(String(pan_number).trim())) {
      return res.status(400).json({
        success: false,
        message: "Valid 10-character PAN is required (e.g. ABCDE1234F)."
      });
    }

    // Check existing KYC record
    let existingKyc = null;
    try {
      const [records] = await db.execute(
        `SELECT id, verification_status
         FROM kyc_records
         WHERE user_id = ?
         ORDER BY id DESC
         LIMIT 1`,
        [userId]
      );
      if (records && records.length > 0) {
        existingKyc = records[0];
      }
    } catch (e) {}

    if (existingKyc) {
      const st = existingKyc.verification_status.toLowerCase();
      if (st === "approved" || st === "verified") {
        return res.status(400).json({
          success: false,
          message: "Your KYC is already verified and approved. Resubmission is not required."
        });
      }
    }

    // Create or update KYC record
    let newKycId = null;
    const providerRef = `KYC-${Date.now().toString().slice(-6)}`;

    try {
      const [result] = await db.execute(
        `INSERT INTO kyc_records
          (user_id, verification_status, provider_reference, remarks)
         VALUES (?, 'pending', ?, 'Application submitted via User Portal')`,
        [userId, providerRef]
      );
      newKycId = result.insertId;

      // Add documents if provided
      if (pan_document) {
        await db.execute(
          `INSERT INTO kyc_documents (kyc_record_id, document_type, secure_storage_key, document_status)
           VALUES (?, 'pan_card', ?, 'pending')`,
          [newKycId, pan_document]
        );
      }
      if (aadhaar_front_document) {
        await db.execute(
          `INSERT INTO kyc_documents (kyc_record_id, document_type, secure_storage_key, document_status)
           VALUES (?, 'aadhaar_front', ?, 'pending')`,
          [newKycId, aadhaar_front_document]
        );
      }
      if (aadhaar_back_document) {
        await db.execute(
          `INSERT INTO kyc_documents (kyc_record_id, document_type, secure_storage_key, document_status)
           VALUES (?, 'aadhaar_back', ?, 'pending')`,
          [newKycId, aadhaar_back_document]
        );
      }
      if (supporting_document) {
        await db.execute(
          `INSERT INTO kyc_documents (kyc_record_id, document_type, secure_storage_key, document_status)
           VALUES (?, 'supporting_doc', ?, 'pending')`,
          [newKycId, supporting_document]
        );
      }

      // Add history record
      try {
        await db.execute(
          `INSERT INTO kyc_history
            (kyc_record_id, user_id, action, previous_status, new_status, remarks)
           VALUES (?, ?, 'SUBMITTED', 'not_submitted', 'pending', 'User submitted identity documents after mobile OTP verification')`,
          [newKycId, userId]
        );
      } catch (hErr) {}

    } catch (dbErr) {
      newKycId = Date.now();
    }

    // Synchronize with admin memoryStore so it's instantly visible in the Admin Queue
    if (adminKycController.memoryStore) {
      const submissionDate = new Date().toISOString();
      const newAdminApp = {
        id: newKycId,
        user_id: userId,
        user_name: full_name || user.full_name || "ApnaPay Customer",
        mobile: user.phone,
        mobile_verified: true,
        mobile_verified_at: user.mobile_verified_at || submissionDate,
        email: user.email,
        gender: gender || user.gender || "Male",
        father_name: father_name || "",
        user_status: "active",
        date_of_birth: date_of_birth || "1994-08-15",
        address: address || "42, Highline Tech Park, Sector 44",
        city: city || "Gurugram",
        state: state || "Haryana",
        postal_code: postal_code || "122003",
        kyc_type: kyc_type,
        document_type: document_type,
        provider_reference: providerRef,
        masked_document_number: aadhaar_number ? `XXXX-XXXX-${String(aadhaar_number).slice(-4)}` : `${String(pan_number).slice(0,3)}****${String(pan_number).slice(-2)}`,
        submission_date: submissionDate,
        verification_status: "pending",
        pan_verification_status: "Pending Check",
        aadhaar_verification_status: "Pending Verification",
        verified_at: null,
        rejection_reason: null,
        remarks: "Submitted via User KYC Portal after mobile SMS verification.",
        documents_count: 2,
        documents: [
          {
            id: Date.now() + 1,
            document_type: "pan_card",
            label: "PAN Card",
            document_status: "pending",
            preview_url: pan_document || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
            created_at: submissionDate
          },
          {
            id: Date.now() + 2,
            document_type: "aadhaar_front",
            label: "Aadhaar Card (Front)",
            document_status: "pending",
            preview_url: aadhaar_front_document || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
            created_at: submissionDate
          }
        ],
        history: [
          {
            id: Date.now() + 3,
            action: "SUBMITTED",
            previous_status: "not_submitted",
            new_status: "pending",
            remarks: "Customer submitted identity documents after successful mobile OTP verification.",
            created_at: submissionDate
          }
        ]
      };

      const existingIdx = adminKycController.memoryStore.applications.findIndex(
        (a) => Number(a.user_id) === Number(userId)
      );
      if (existingIdx >= 0) {
        adminKycController.memoryStore.applications[existingIdx] = newAdminApp;
      } else {
        adminKycController.memoryStore.applications.unshift(newAdminApp);
      }
    }

    return res.status(201).json({
      success: true,
      message: "KYC application submitted successfully! Your application is now queued for compliance verification.",
      data: {
        kyc_record_id: newKycId,
        application_id: `#KYC-${newKycId}`,
        verification_status: "pending",
        provider_reference: providerRef,
        submitted_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Submit KYC Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error while submitting KYC."
    });
  }
};

// ======================================
// 7. ADD KYC DOCUMENT / UPLOAD DOCUMENT
// POST /api/v1/kyc/documents & /upload-document
// ======================================
exports.addKycDocument = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || FALLBACK_USER_ID;
    const { document_type, document_image } = req.body;

    if (!document_type || String(document_type).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Document type is required."
      });
    }

    const docObj = {
      id: Date.now(),
      document_type: document_type.trim(),
      secure_storage_key: document_image || "",
      document_status: "pending",
      created_at: new Date().toISOString()
    };

    const currentDocs = kycMemoryStore.documents.get(userId) || [];
    currentDocs.push(docObj);
    kycMemoryStore.documents.set(userId, currentDocs);

    return res.status(201).json({
      success: true,
      message: "Document uploaded successfully.",
      document: docObj
    });

  } catch (error) {
    console.error("Add KYC Document Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error adding document."
    });
  }
};

// ======================================
// 8. GET KYC DOCUMENTS
// GET /api/v1/kyc/documents
// ======================================
exports.getKycDocuments = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || FALLBACK_USER_ID;
    const local = kycMemoryStore.documents.get(userId) || [];
    return res.status(200).json({
      success: true,
      total: local.length,
      documents: local
    });
  } catch (error) {
    console.error("Get KYC Documents Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
};

// ======================================
// 9. DELETE PENDING DOCUMENT
// DELETE /api/v1/kyc/documents/:id
// ======================================
exports.deleteKycDocument = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || FALLBACK_USER_ID;
    const documentId = Number(req.params.id);

    const local = kycMemoryStore.documents.get(userId) || [];
    const filtered = local.filter(d => d.id !== documentId);
    kycMemoryStore.documents.set(userId, filtered);

    return res.status(200).json({
      success: true,
      message: "Pending document removed successfully."
    });
  } catch (error) {
    console.error("Delete KYC Document Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
};

module.exports.kycMemoryStore = kycMemoryStore;
