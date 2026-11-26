const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const walletController = require('../controllers/walletController');

// All wallet endpoints strictly require valid JWT customer authentication
router.use(authMiddleware);

// 1. GET /api/wallet - Wallet overview
router.get('/', walletController.getWalletOverview);

// 2. GET /api/wallet/balance - Get available wallet balance
router.get('/balance', walletController.getWalletBalance);

// 3. GET /api/wallet/ledger - Get debit and credit entries
router.get('/ledger', walletController.getWalletLedger);

// 4. GET /api/wallet/summary - Get wallet balance summary
router.get('/summary', walletController.getWalletSummary);

// 5. GET /api/wallet/limits - Get transaction limits
router.get('/limits', walletController.getWalletLimits);

module.exports = router;

