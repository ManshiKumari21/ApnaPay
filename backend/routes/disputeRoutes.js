const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const disputeController = require("../controllers/disputeController");
const dispRefundController = require("../controllers/disputeRefundManagementController");

// User Dispute Center Stats
router.get("/stats", authMiddleware, dispRefundController.getUserDisputeStats);

// User Eligible Transactions for Dispute
router.get("/eligible-transactions", authMiddleware, dispRefundController.getUserEligibleTransactions);

// User's Disputes List
router.get("/my-disputes", authMiddleware, dispRefundController.getUserDisputes);

// Raise Dispute (Protected)
router.post("/", authMiddleware, dispRefundController.createUserDispute);
router.post("/create", authMiddleware, dispRefundController.createUserDispute);

// Upload Additional Evidence
router.post("/:id/evidence", authMiddleware, dispRefundController.uploadUserEvidence);

// User Reply to Support Thread
router.post("/:id/reply", authMiddleware, dispRefundController.sendUserReply);

// Dispute Tracking Details (Protected)
router.get("/tracking/:id", authMiddleware, dispRefundController.getUserDisputeDetails);

// Get disputes by payment ID (Legacy support)
router.get("/payment/:paymentId", disputeController.getDisputesByPayment);

// Get all disputes (Legacy support)
router.get("/", disputeController.getAllDisputes);

// Get dispute by ID
router.get("/:id", (req, res, next) => {
  // If user token exists, use user tracking details
  if (req.headers.authorization) {
    return authMiddleware(req, res, () => dispRefundController.getUserDisputeDetails(req, res, next));
  }
  return disputeController.getDispute(req, res, next);
});

module.exports = router;
