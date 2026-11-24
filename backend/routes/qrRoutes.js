const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
    createQR,
    getQR,
    createPaymentRequest,
    payPaymentRequest,
    getPaymentRequest,
    cancelPaymentRequest
} = require("../controllers/qrController");

// ==========================================
// 1. QR CODE CREATION & SCANNING
// ==========================================
router.post("/create", authMiddleware, createQR);
router.get("/:publicId", getQR); // Public scanning

// ==========================================
// 2. QR PAYMENT REQUESTS (qr_payment_requests)
// ==========================================
router.post("/:publicId/payment-request", authMiddleware, createPaymentRequest);
router.get("/requests/:referenceId", getPaymentRequest);
router.post("/requests/:referenceId/cancel", authMiddleware, cancelPaymentRequest);

// ==========================================
// 3. QR TRANSACTIONS (qr_transactions)
// ==========================================
router.post("/requests/:referenceId/pay", authMiddleware, payPaymentRequest);

module.exports = router;
