const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const paymentController = require("../controllers/paymentController");

// PAYMENT APIs (Protected)
router.post("/payments", authMiddleware, paymentController.createPayment);
router.get("/payments/:id", authMiddleware, paymentController.getPayment);
router.post("/payments/:id/confirm", authMiddleware, paymentController.confirmPayment);
router.get("/payments/:id/status", authMiddleware, paymentController.getPaymentStatus);

// MONEY TRANSFER APIs (Protected)
router.get("/transfers/stats", authMiddleware, paymentController.getTransferStats);
router.get("/transfers/analytics", authMiddleware, paymentController.getTransferAnalytics);
router.get("/transfers", authMiddleware, paymentController.getAllTransfers);
router.post("/transfers", authMiddleware, paymentController.createTransfer);
router.get("/transfers/:id", authMiddleware, paymentController.getTransfer);
router.post("/transfers/:id/cancel", authMiddleware, paymentController.cancelTransfer);

// PAYMENT METHODS APIs (Protected)
router.get("/payment-methods", authMiddleware, paymentController.getPaymentMethods);
router.post("/payment-methods", authMiddleware, paymentController.createPaymentMethod);
router.delete("/payment-methods/:id", authMiddleware, paymentController.deletePaymentMethod);

// PAYMENT WEBHOOK API (Public webhook from external payment provider)
router.post("/webhooks/payment-provider", paymentController.receivePaymentWebhook);

module.exports = router;
