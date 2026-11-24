const express = require("express");
const router = express.Router();

const {
    getDashboard,
    getUserStats,
    getKycStats,
    getTransactionStats,
    getFinancialStats
} = require("../controllers/adminDashboardController");

// Main Dashboard Overview
router.get("/", getDashboard);
router.get("/summary", getDashboard);

// Sub-modules & Breakdown
router.get("/users", getUserStats);
router.get("/kyc", getKycStats);
router.get("/transactions", getTransactionStats);
router.get("/financials", getFinancialStats);

module.exports = router;
