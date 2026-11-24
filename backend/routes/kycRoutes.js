const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  getKycStatus,
  sendMobileOtp,
  verifyMobileOtp,
  resendMobileOtp,
  updatePersonalDetails,
  submitKyc,
  addKycDocument,
  getKycDocuments,
  deleteKycDocument
} = require("../controllers/kycController");

// All customer KYC routes require authentication
router.use(authMiddleware);

// ======================================
// 1. MOBILE OTP VERIFICATION ENDPOINTS
// ======================================
// POST /api/v1/kyc/send-otp - Generate & dispatch 6-digit SMS OTP
router.post("/send-otp", sendMobileOtp);

// POST /api/v1/kyc/verify-otp - Verify hashed 6-digit OTP & mark mobile verified
router.post("/verify-otp", verifyMobileOtp);

// POST /api/v1/kyc/resend-otp - Resend OTP with cooldown & rate limit
router.post("/resend-otp", resendMobileOtp);

// ======================================
// 2. PERSONAL DETAILS & KYC STEPS
// ======================================
// PUT /api/v1/kyc/personal-details - Save demographic information
router.put("/personal-details", updatePersonalDetails);

// POST /api/v1/kyc/upload-document - Upload single document
router.post("/upload-document", addKycDocument);

// ======================================
// 3. KYC STATUS & SUBMISSION ENDPOINTS
// ======================================
// GET /api/v1/kyc/status - Get user KYC and mobile verification status
router.get("/status", getKycStatus);

// POST /api/v1/kyc/submit - Submit KYC documents (requires verified mobile)
router.post("/submit", submitKyc);

// POST /api/v1/kyc/documents - Add supplementary KYC document
router.post("/documents", addKycDocument);

// GET /api/v1/kyc/documents - Get all uploaded KYC documents
router.get("/documents", getKycDocuments);

// DELETE /api/v1/kyc/documents/:id - Delete a pending document
router.delete("/documents/:id", deleteKycDocument);

module.exports = router;
