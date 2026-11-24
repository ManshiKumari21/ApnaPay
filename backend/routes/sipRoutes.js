const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
    getProducts,
    getProductById,
    createSIP,
    getUserSIPs,
    getSIPDetails,
    getInstallments,
    pauseSIP,
    resumeSIP,
    cancelSIP,
    createMandate,
    getMandate,
    getTransactions,
    createOneTimeInvestment,
    getUserInvestmentOrders,
    getInvestmentOrderDetails
} = require("../controllers/sipController");

// Products (Public)
router.get("/products", getProducts);
router.get("/products/:id", getProductById);

// SIP plans (Protected with Auth)
router.post("/create", authMiddleware, createSIP);
router.get("/my-sips", authMiddleware, getUserSIPs);
router.get("/user/:userId", getUserSIPs);
router.get("/details/:id", getSIPDetails);

// Installments
router.get("/:id/installments", getInstallments);

// Pause / Resume / Cancel (Protected)
router.put("/:id/pause", authMiddleware, pauseSIP);
router.put("/:id/resume", authMiddleware, resumeSIP);
router.post("/:id/cancel", authMiddleware, cancelSIP);

// Mandates (Protected)
router.post("/:id/mandate", authMiddleware, createMandate);
router.get("/:id/mandate", getMandate);

// Transactions
router.get("/:id/transactions", getTransactions);

// Create One-Time Investment (Protected)
router.post("/investments/one-time", authMiddleware, createOneTimeInvestment);

// Get User Investment Orders (Protected & Param supported)
router.get("/investments/my-orders", authMiddleware, getUserInvestmentOrders);
router.get("/investments/user/:userId", getUserInvestmentOrders);

// Get Single Investment Order Details
router.get("/investments/:id", getInvestmentOrderDetails);

module.exports = router;
