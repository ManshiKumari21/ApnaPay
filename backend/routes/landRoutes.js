const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminAuthMiddleware = require('../middleware/adminAuthMiddleware');
const landController = require('../controllers/landController');

// ==========================================
// USER DIGITAL LAND ROUTES
// ==========================================

// 1. GET /api/land/projects - Get all available land projects (Public)
router.get('/projects', landController.getProjects);

// 2. GET /api/land/projects/:id - Get specific project details (Public)
router.get('/projects/:id', landController.getProjectById);

// 3. GET /api/land/holdings - Get logged-in user's land holdings (Protected)
router.get('/holdings', authMiddleware, landController.getHoldings);

// 4. POST /api/land/orders - Create a land purchase/order request (Protected)
router.post('/orders', authMiddleware, landController.createOrder);

// 5. GET /api/land/orders - Get logged-in user's land orders (Protected)
router.get('/orders', authMiddleware, landController.getUserOrders);

// 6. GET /api/land/orders/:id - Get specific order status (Protected)
router.get('/orders/:id', authMiddleware, landController.getOrderById);

// 7. GET /api/land/transactions - Get land transaction history (Protected)
router.get('/transactions', authMiddleware, landController.getTransactions);

// 8. GET /api/land/valuations - Get land valuation history (Public / Filterable)
router.get('/valuations', landController.getValuations);

// ==========================================
// ADMIN DIGITAL LAND MANAGEMENT ROUTES
// (Protected with adminAuthMiddleware)
// ==========================================

// 9. GET /api/land/admin/orders - Admin Land Orders with Dashboard Counts
router.get('/admin/orders', adminAuthMiddleware, landController.getAdminOrders);

// 10. GET /api/land/admin/orders/:id - Admin Single Order Details
router.get('/admin/orders/:id', adminAuthMiddleware, landController.getAdminOrderById);

// 11. POST/PUT /api/land/admin/orders/:id/approve - Approve Land Order
router.post('/admin/orders/:id/approve', adminAuthMiddleware, landController.approveOrder);
router.put('/admin/orders/:id/approve', adminAuthMiddleware, landController.approveOrder);

// 12. POST/PUT /api/land/admin/orders/:id/reject - Reject Land Order
router.post('/admin/orders/:id/reject', adminAuthMiddleware, landController.rejectOrder);
router.put('/admin/orders/:id/reject', adminAuthMiddleware, landController.rejectOrder);

module.exports = router;

