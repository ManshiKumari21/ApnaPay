const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

// All notification operations require customer authentication
router.use(authMiddleware);

// 1. GET /api/notifications - List user's notifications (paginated + status filter)
router.get('/', notificationController.getNotifications);

// 2. Mark all unread notifications as read (POST, PATCH, PUT)
router.post('/read-all', notificationController.markAllAsRead);
router.patch('/read-all', notificationController.markAllAsRead);
router.put('/read-all', notificationController.markAllAsRead);

// 3. Mark single notification as read - supports PATCH /:id/read, PUT /:id/read, POST /:id/read
router.patch('/:id/read', notificationController.markAsRead);
router.put('/:id/read', notificationController.markAsRead);
router.post('/:id/read', notificationController.markAsRead);

// Direct /:id endpoints
router.patch('/:id', notificationController.markAsRead);
router.put('/:id', notificationController.markAsRead);

// Alternate path order /read/:id
router.patch('/read/:id', notificationController.markAsRead);
router.post('/read/:id', notificationController.markAsRead);

// Body-based /read with { id }
router.patch('/read', notificationController.markAsRead);
router.post('/read', notificationController.markAsRead);

module.exports = router;

