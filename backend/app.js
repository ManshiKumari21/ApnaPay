const express = require('express');
const cors = require('cors');

const app = express();

// ==========================================
// 1. IMPORT ROUTES & CONTROLLERS
// ==========================================

// Core Authentication & User Management
const authRoutes = require('./routes/authRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const profileRoutes = require('./routes/profileRoutes');
const kycRoutes = require('./routes/kycRoutes');
const adminKycRoutes = require('./routes/adminKycRoutes');

// Banking, UPI & Wallet
const bankAccountRoutes = require('./routes/bankAccountRoutes');
const upiRoutes = require('./routes/upiRoutes');
const walletRoutes = require('./routes/walletRoutes');

// Payments, Transfers & QR
const paymentRoutes = require('./routes/paymentRoutes');
const qrRoutes = require('./routes/qrRoutes');
const refundRoutes = require('./routes/refundRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const disputeRoutes = require('./routes/disputeRoutes');

// Utility, Recharges & Investments
const billPaymentRoutes = require('./routes/billPaymentRoutes');
const rechargeRoutes = require('./routes/rechargeRoutes');
const sipRoutes = require('./routes/sipRoutes');
const landRoutes = require('./routes/landRoutes');

// Notifications
const notificationRoutes = require('./routes/notificationRoutes');
const notificationController = require('./controllers/notificationController');

// Admin Panel Management
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Middlewares
const authMiddleware = require('./middleware/authMiddleware');

// ==========================================
// 2. GLOBAL MIDDLEWARE
// ==========================================
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 3. HEALTH CHECK APIS
// ==========================================
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'ApnaPay API is running!'
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Backend is healthy'
    });
});

// ==========================================
// 4. ROUTE MOUNTING
// ==========================================

// Authentication Routes - mounted at /api/v1/auth, /api/auth, /auth
app.use('/api/v1/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

// Admin Auth Routes - mounted at /api/v1/admin/auth, /api/admin/auth, /admin/auth
app.use('/api/v1/admin/auth', adminAuthRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/admin/auth', adminAuthRoutes);

// User Profile & KYC Routes
app.use(['/users', '/api/users', '/api/v1/users'], profileRoutes);
app.use(['/kyc', '/api/kyc', '/api/v1/kyc'], kycRoutes);

// Bank Accounts and UPI Routes - mounted at /api/v1, /api, and root paths
app.use(['/api/v1/bank-accounts', '/api/bank-accounts', '/bank-accounts'], bankAccountRoutes);
app.use(['/api/v1/upi', '/api/upi', '/upi'], upiRoutes);

// Wallet and Ledger Routes - mounted at /api/wallet, /api/v1/wallet and /wallet
app.use(['/api/wallet', '/api/v1/wallet', '/wallet'], walletRoutes);

// Payments, Transfers & QR
app.use(['/payment', '/api/payment', '/api/v1/payment'], paymentRoutes);
app.use(['/qr', '/api/qr', '/api/v1/qr'], qrRoutes);
app.use(['/refunds', '/api/refunds', '/api/v1/refunds'], refundRoutes);
app.use(['/disputes', '/api/disputes', '/api/v1/disputes'], disputeRoutes);

// Transaction History Routes - mounted at /api/transactions, /api/v1/transactions and /transactions
app.use(['/api/transactions', '/api/v1/transactions', '/transactions'], transactionRoutes);

// Digital Land Routes - mounted at /api/land, /api/v1/land and /land
app.use(['/api/land', '/api/v1/land', '/land'], landRoutes);

// SIP & Recharges
app.use(['/sip', '/api/sip', '/api/v1/sip'], sipRoutes);
app.use(['/wealth', '/api/wealth', '/api/v1/wealth', '/partners', '/api/partners', '/api/v1/partners'], adminRoutes);
app.use(['/recharge', '/api/recharge', '/api/v1/recharge'], rechargeRoutes);

// Bill Payment Routes - mounted at /api/bills, /api/v1/bills and /bills
app.use(['/api/bills', '/api/v1/bills', '/bills'], billPaymentRoutes);

// Notification Routes - mounted at /api/notifications, /api/v1/notifications, /notifications and /notification
app.use(['/api/notifications', '/api/v1/notifications', '/notifications', '/api/notification', '/api/v1/notification', '/notification'], notificationRoutes);

// Notification Preferences Routes - mounted at /api/notification-preferences, /api/v1/notification-preferences and /notification-preferences
app.get(['/api/notification-preferences', '/api/v1/notification-preferences', '/notification-preferences'], authMiddleware, notificationController.getPreferences);

// Friendly redirect for frontend routes accessed directly in browser on backend port 5000
app.get(['/admin/login', '/admin', '/admin/*', '/login', '/signup', '/verify-otp', '/app', '/app/*'], (req, res) => {
    return res.redirect(`http://localhost:5173${req.originalUrl}`);
});

// Admin Panel Modules & KYC Management
app.use(['/admin/dashboard', '/api/admin/dashboard', '/api/v1/admin/dashboard'], adminDashboardRoutes);
app.use(['/admin/kyc', '/api/admin/kyc', '/api/v1/admin/kyc', '/api/v1/api/admin/kyc'], adminKycRoutes);
app.use(['/admin', '/api/admin', '/api/v1/admin'], adminRoutes);

// ==========================================
// 5. ERROR & 404 HANDLERS
// ==========================================

// Handle invalid JSON syntax in request bodies
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON payload sent in request body.'
        });
    }
    next(err);
});

// Global 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint ${req.method} ${req.originalUrl} not found.`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled Application Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error.'
    });
});

module.exports = app;
