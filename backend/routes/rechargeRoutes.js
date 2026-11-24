const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
    getOperators,
    getOperatorById,
    getPlans,
    getPlanById,
    createRecharge,
    getRechargeById,
    getUserRecharges,
    updateRechargeStatus
} = require("../controllers/rechargeController");

// Operators (Public)
router.get("/operators", getOperators);
router.get("/operators/:id", getOperatorById);

// Recharge Plans (Public)
router.get("/plans", getPlans);
router.get("/plans/:id", getPlanById);

// Create Recharge (Protected with Auth)
router.post("/create", authMiddleware, createRecharge);

// User Recharge History (Protected / Params supported)
router.get("/history", authMiddleware, getUserRecharges);
router.get("/user/:userId", getUserRecharges);

// Admin Overview & Aggregated Analytics (Module 10)
const adminOps = require("../controllers/adminOperationsController");
router.get("/admin/overview", adminOps.getRechargeOverview);

// Recharge Details
router.get("/:id", getRechargeById);

// Update Status (Testing only)
router.put("/:id/status", updateRechargeStatus);

module.exports = router;
