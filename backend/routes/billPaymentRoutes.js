const express = require('express');
const router = express.Router();
const billPaymentController = require('../controllers/billPaymentController');
const authMiddleware = require('../middleware/authMiddleware');

// 1. GET /api/bills/categories - List available bill payment categories
router.get('/categories', (req, res) => billPaymentController.getCategories(req, res));

// 2. GET /api/bills/billers - List billers for a category
router.get('/billers', (req, res) => billPaymentController.getBillers(req, res));

// 3. POST /api/bills/fetch - Fetch bill details for consumer number (Protected)
router.post('/fetch', authMiddleware, (req, res) => billPaymentController.fetchBill(req, res));

// 4. POST /api/bills/validate - Validate bill before payment (Protected)
router.post('/validate', authMiddleware, (req, res) => billPaymentController.validateBill(req, res));

// 5. POST /api/bills/payments - Process bill payment (Protected)
router.post('/payments', authMiddleware, (req, res) => billPaymentController.createPayment(req, res));

// 6. GET /api/bills/payments/:id - Get payment details by ID or Txn Reference (Protected)
router.get('/payments/:id', authMiddleware, (req, res) => billPaymentController.getPaymentById(req, res));

// 7. GET /api/bills/history - View user's previous bill payments (Protected)
router.get('/history', authMiddleware, (req, res) => billPaymentController.getHistory(req, res));

// 8. POST /api/bills/favorites - Save biller & consumer number to favorites (Protected)
router.post('/favorites', authMiddleware, (req, res) => billPaymentController.addFavorite(req, res));

// 9. GET /api/bills/favorites - List saved favorite billers (Protected)
router.get('/favorites', authMiddleware, (req, res) => billPaymentController.getFavorites(req, res));

// 10. DELETE /api/bills/favorites/:id - Remove saved favorite (Protected)
router.delete('/favorites/:id', authMiddleware, (req, res) => billPaymentController.deleteFavorite(req, res));

module.exports = router;

