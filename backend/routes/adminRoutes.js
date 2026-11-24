const express = require("express");
const router = express.Router();

const adminOps = require("../controllers/adminOperationsController");
const paymentController = require("../controllers/paymentController");
const wealthOps = require("../controllers/adminWealthController");
const dispRefundOps = require("../controllers/disputeRefundManagementController");

// =====================================
// INVESTMENT & WEALTH MANAGEMENT APIS
// =====================================
router.get("/wealth/dashboard", wealthOps.getWealthDashboard);
router.get("/wealth/mutual-funds", wealthOps.getMutualFunds);
router.put("/wealth/mutual-funds/:id/status", wealthOps.updateMutualFundStatus);
router.patch("/wealth/mutual-funds/:id/status", wealthOps.updateMutualFundStatus);

router.get("/wealth/sip", wealthOps.getSipManagementData);
router.put("/wealth/sip/:id/status", wealthOps.updateSipStatus);
router.patch("/wealth/sip/:id/status", wealthOps.updateSipStatus);

router.get("/wealth/transactions", wealthOps.getInvestmentTransactions);

// =====================================
// LOAN MANAGEMENT APIS
// =====================================
router.get("/loans/dashboard", wealthOps.getLoanDashboard);
router.get("/loans/applications", wealthOps.getLoanApplications);
router.get("/loans/applications/:id", wealthOps.getLoanApplicationDetails);
router.put("/loans/applications/:id/status", wealthOps.updateLoanApplicationStatus);
router.patch("/loans/applications/:id/status", wealthOps.updateLoanApplicationStatus);

router.get("/loans/products", wealthOps.getLoanProducts);
router.get("/loans/repayments", wealthOps.getLoanRepayments);
router.get("/loans/lenders", wealthOps.getLenderPartners);

// =====================================
// CREDIT SCORE MANAGEMENT APIS
// =====================================
router.get("/credit/dashboard", wealthOps.getCreditDashboard);
router.get("/credit/requests", wealthOps.getCreditScoreRequests);
router.get("/credit/requests/:id", wealthOps.getCreditScoreDetails);
router.get("/credit/history", wealthOps.getCreditScoreHistory);
router.get("/credit/bureaus", wealthOps.getCreditBureauPartners);

// =====================================
// PARTNER MANAGEMENT APIS
// =====================================
router.get("/partners", wealthOps.getUnifiedPartners);

// Module 2: Admin Auth
router.post("/auth/login", adminOps.adminLogin);
router.post("/auth/logout", adminOps.adminLogout);

// Module 3: Admin Users & Roles
router.get("/admins", adminOps.getAdminUsers);
router.post("/admins", adminOps.createAdminUser);
router.delete("/admins/:id", adminOps.deleteAdminUser);

// Module 5: KYC Management
router.get("/kyc/queue", adminOps.getKycQueue);
router.put("/kyc/:id/review", adminOps.reviewKyc);

// Module 6: Wallet Management
router.get("/wallets", adminOps.getWallets);
router.post("/wallets/adjust", adminOps.adjustWalletBalance);

// Module 7: Transactions Management
router.get("/transactions", adminOps.getAllTransactions);

// Money Transfer Management (Admin APIs)
router.get("/transfers/stats", paymentController.getTransferStats);
router.get("/transfers/analytics", paymentController.getTransferAnalytics);
router.get("/transfers", paymentController.getAllTransfers);
router.get("/transfers/:id", paymentController.getTransfer);

// Module 8: QR Payments Monitor
router.get("/qr", adminOps.getQrOverview);
router.patch("/qr/:id/status", adminOps.toggleQrStatus);
router.put("/qr/:id/status", adminOps.toggleQrStatus);

// Module 9: Dispute & Refund Management
router.get("/disputes/stats", dispRefundOps.getAdminDisputeDashboardStats);
router.get("/disputes/reports", dispRefundOps.getAdminDisputeReports);
router.get("/disputes", dispRefundOps.getAdminDisputes);
router.get("/disputes/:id", dispRefundOps.getAdminDisputeDetails);
router.patch("/disputes/:id/status", dispRefundOps.updateDisputeStatus);
router.put("/disputes/:id/status", dispRefundOps.updateDisputeStatus);
router.patch("/disputes/:id/assign", dispRefundOps.assignDispute);
router.post("/disputes/:id/assign", dispRefundOps.assignDispute);
router.post("/disputes/:id/notes", dispRefundOps.addDisputeInternalNote);
router.post("/disputes/:id/messages", dispRefundOps.sendDisputeMessage);
router.post("/disputes/:id/request-information", dispRefundOps.sendDisputeMessage);
router.put("/disputes/:id/resolve", dispRefundOps.updateDisputeStatus);
router.post("/disputes/:id/resolve", dispRefundOps.updateDisputeStatus);

// Admin Refund Management APIs
router.get("/refunds", dispRefundOps.getAdminRefunds);
router.post("/refunds/:id/approve", dispRefundOps.approveRefund);
router.post("/refunds/:id/reject", dispRefundOps.rejectRefund);
router.post("/refunds/:id/initiate", dispRefundOps.initiateRefund);
router.post("/refunds/:id/retry", dispRefundOps.retryRefund);

// Module 10: Recharge Management
router.get("/recharge", adminOps.getRechargeOverview);
router.patch("/recharge/operator/:id/status", adminOps.updateOperatorStatus);
router.put("/recharge/operator/:id/status", adminOps.updateOperatorStatus);
router.patch("/recharge/order/:id/status", adminOps.updateRechargeOrderStatus);
router.put("/recharge/order/:id/status", adminOps.updateRechargeOrderStatus);

// Module 11: Bill Payments
router.get("/bills", adminOps.getBillPayments);

// Module 13: Digital Land Management
router.get("/land", adminOps.getLandData);
router.post("/land/projects", adminOps.createLandPlot);

// Module 14: Commission Management
router.get("/commission", adminOps.getCommissionRules);
router.put("/commission/:id", adminOps.updateCommissionRule);

// Module 15: Reports & Analytics
router.get("/reports", adminOps.getReports);

// Module 16: Notifications
router.get("/notifications", adminOps.getNotifications);
router.post("/notifications/broadcast", adminOps.sendNotification);

// Module 17: Settings
router.get("/settings", adminOps.getSettings);
router.put("/settings/:key", adminOps.updateSetting);

// Module 18: Audit Logs
router.get("/audit-logs", adminOps.getAuditLogs);

module.exports = router;
