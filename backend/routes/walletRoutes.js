const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const authMiddleware = require('../middleware/authMiddleware');

// All wallet routes require authentication
router.use(authMiddleware);

// 1. GET /api/wallet - Wallet Overview
router.get('/', walletController.getWalletOverview);

// 2. GET /api/wallet/balance - Real-time Balance
router.get('/balance', walletController.getWalletBalance);

// 3. GET /api/wallet/ledger - Double-entry Ledger History
router.get('/ledger', walletController.getWalletLedger);

// 4. GET /api/wallet/summary - Financial Inflow/Outflow Summary
router.get('/summary', walletController.getWalletSummary);

// 5. GET /api/wallet/limits - Tiered Wallet Limits
router.get('/limits', walletController.getWalletLimits);

module.exports = router;
