const express = require("express");
const router = express.Router();

const {
  getKycStats,
  getAllKycApplications,
  getKycDetails,
  getKycHistory,
  approveKyc,
  rejectKyc,
  requestResubmission,
  updateKycStatus,
  addKycRemarks
} = require("../controllers/adminKycController");

// ==========================================
// 1. STATS & LISTING
// ==========================================
// GET /api/admin/kyc/stats - KYC Dashboard Statistics (Total, Pending, Verified, Rejected, Under Review, Mobile Not Verified)
router.get("/stats", getKycStats);

// GET /api/admin/kyc - Get All KYC Applications (Search, Filters, Pagination, Date range, Mobile OTP Status)
router.get("/", getAllKycApplications);

// ==========================================
// 2. DETAILS & HISTORY
// ==========================================
// GET /api/admin/kyc/:id - Get Individual KYC Application Details (User info, Mobile verification, KYC info, Documents)
router.get("/:id", getKycDetails);

// GET /api/admin/kyc/:id/history - Get KYC Verification History Timeline
router.get("/:id/history", getKycHistory);

// ==========================================
// 3. ADMIN REVIEW ACTIONS & REMARKS
// ==========================================
// PUT /api/admin/kyc/:id/approve - Approve KYC application
router.put("/:id/approve", approveKyc);

// PUT /api/admin/kyc/:id/reject - Reject KYC application (with mandatory reason)
router.put("/:id/reject", rejectKyc);

// PUT /api/admin/kyc/:id/request-resubmission - Request document resubmission
router.put("/:id/request-resubmission", requestResubmission);

// PATCH /api/admin/kyc/:id/status - Update KYC Status (Approve / Reject / Resubmit)
router.patch("/:id/status", updateKycStatus);

// POST /api/admin/kyc/:id/remarks - Add Admin Remarks to Verification History
router.post("/:id/remarks", addKycRemarks);

module.exports = router;
