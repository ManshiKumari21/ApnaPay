const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const transactionController = require('../controllers/transactionController');

// All transaction history operations strictly require valid JWT customer authentication
router.use(authMiddleware);

// 1. GET /api/transactions - Get transaction list (paginated, filtered, sorted)
router.get('/', transactionController.getTransactions);
router.get('/history', transactionController.getTransactions);

// 2. GET /api/transactions/summary - Get credits and debits summary
router.get('/summary', transactionController.getTransactionSummary);

// 3. GET /api/transactions/export - Export transaction statement (CSV/PDF)
router.get('/export', transactionController.exportTransactions);
router.get('/statement', transactionController.exportTransactions);

// 4. GET /api/transactions/:id - Get transaction details by ID
router.get('/:id', transactionController.getTransactionById);

module.exports = router;

