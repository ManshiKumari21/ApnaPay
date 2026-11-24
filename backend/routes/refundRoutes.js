const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const refundController = require("../controllers/refundController");
const dispRefundController = require("../controllers/disputeRefundManagementController");

// User's Refunds List & Receipts
router.get("/my-refunds", authMiddleware, dispRefundController.getUserRefunds);

// Request a refund (Legacy support)
router.post("/request", authMiddleware, refundController.createRefund);

// Get refunds by payment ID (Legacy support)
router.get("/payment/:paymentId", authMiddleware, refundController.getRefundsByPayment);

// Get refund by ID (Protected)
router.get("/:id", authMiddleware, (req, res, next) => {
  return dispRefundController.getUserRefundDetails(req, res, () => {
    return refundController.getRefund(req, res, next);
  });
});

module.exports = router;
