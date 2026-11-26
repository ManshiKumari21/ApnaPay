import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';

// Layout for wrapped modules
import DashboardLayout from './components/layout/DashboardLayout';

// Customer Auth Pages
import LoginPage from './pages/customer/LoginPage';
import SignupPage from './pages/customer/SignupPage';
import VerifyOtpPage from './pages/customer/VerifyOtpPage';
import ForgotPasswordPage from './pages/customer/ForgotPasswordPage';
import VerifyResetOtpPage from './pages/customer/VerifyResetOtpPage';
import ResetPasswordPage from './pages/customer/ResetPasswordPage';

// Customer Portal Pages
import CustomerDashboardOverview from './pages/customer/CustomerDashboardOverview';
import CustomerBankAccountsPage from './pages/customer/CustomerBankAccountsPage';
import CustomerUpiPage from './pages/customer/CustomerUpiPage';
import CustomerProfilePage from './pages/customer/CustomerProfilePage';
import CustomerWalletPage from './pages/customer/CustomerWalletPage';
import CustomerTransactionsPage from './pages/customer/CustomerTransactionsPage';
import CustomerLandPage from './pages/customer/CustomerLandPage';
import CustomerBillsPage from './pages/customer/CustomerBillsPage';
import CustomerServicesPage from './pages/customer/CustomerServicesPage';

// Full Customer Platform Modules
import MoneyTransfers from './pages/transfers/MoneyTransfers';
import Payments from './pages/payments/Payments';
import KYC from './pages/kyc/KYC';
import UserKycCenter from './pages/customer/UserKycCenter';
import RechargeManagement from './pages/RechargeManagement';
import SipManagement from './pages/SipManagement';
import QrManagement from './pages/QrManagement';
import DisputeManagement from './pages/DisputeManagement';
import UserDisputeCenter from './pages/customer/UserDisputeCenter';
import Users from './pages/Users';
import ReportsAnalytics from './pages/ReportsAnalytics';
import Dashboard from './pages/Dashboard';

// Admin Auth Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminVerifyOtpPage from './pages/admin/AdminVerifyOtpPage';
import AdminForgotPasswordPage from './pages/admin/AdminForgotPasswordPage';
import AdminVerifyResetOtpPage from './pages/admin/AdminVerifyResetOtpPage';
import AdminResetPasswordPage from './pages/admin/AdminResetPasswordPage';
import AdminChangePasswordPage from './pages/admin/AdminChangePasswordPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminDigitalLandPage from './pages/admin/AdminDigitalLandPage';

// Enterprise Admin Panel (18 Active Modules with Sidebar)
import AdminPanel from './pages/admin/AdminPanel';

// Guards
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';

// Smart Root Redirect: Sends authenticated admins to /admin, users to /app, guests to /login
function RootRedirect() {
  const adminToken = localStorage.getItem('apnapay_admin_token');
  const userToken = localStorage.getItem('apnapay_token');
  if (adminToken) return <Navigate to="/admin" replace />;
  if (userToken) return <Navigate to="/app" replace />;
  return <Navigate to="/login" replace />;
}

// Global React Error Boundary to prevent blank white screens
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('React ErrorBoundary caught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#071224',
          color: '#FFFFFF',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            background: '#0B1D35',
            border: '1px solid #16365C',
            borderRadius: '14px',
            padding: '32px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px', color: '#00D5FF' }}>
              Application Notice
            </h2>
            <p style={{ fontSize: '14px', color: '#8BA2C1', marginBottom: '20px' }}>
              {this.state.error?.message || 'An unexpected error occurred while loading this view.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #087BFF, #00D5FF)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Reload
              </button>
              <a
                href="/login"
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  background: '#08172C',
                  border: '1px solid #16365C',
                  color: '#FFFFFF',
                  fontWeight: '600',
                  textDecoration: 'none'
                }}
              >
                Go to Login
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <AdminAuthProvider>
            <Routes>
              {/* Smart Root Redirect */}
              <Route path="/" element={<RootRedirect />} />

              {/* ================= Customer Auth Routes ================= */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/verify-otp" element={<VerifyOtpPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/verify-reset-otp" element={<VerifyResetOtpPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Redirect /dashboard to Customer Portal */}
              <Route path="/dashboard" element={<Navigate to="/app" replace />} />

              {/* Direct Route Aliases */}
              <Route path="/transfers" element={<Navigate to="/app/transfers" replace />} />
              <Route path="/payments" element={<Navigate to="/app/payments" replace />} />
              <Route path="/kyc" element={<Navigate to="/app/kyc" replace />} />
              <Route path="/recharge" element={<Navigate to="/app/recharge" replace />} />
              <Route path="/sip" element={<Navigate to="/app/sip" replace />} />
              <Route path="/qr" element={<Navigate to="/app/qr" replace />} />
              <Route path="/disputes" element={<Navigate to="/app/disputes" replace />} />
              <Route path="/users" element={<Navigate to="/app/users" replace />} />
              <Route path="/wallet" element={<Navigate to="/app/wallet" replace />} />
              <Route path="/transactions" element={<Navigate to="/app/transactions" replace />} />
              <Route path="/bills" element={<Navigate to="/app/bills" replace />} />
              <Route path="/land" element={<Navigate to="/app/land" replace />} />

              {/* ================= Customer Protected Portal ================= */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <CustomerDashboardOverview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/services"
                element={
                  <ProtectedRoute>
                    <CustomerServicesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/overview"
                element={
                  <ProtectedRoute>
                    <DashboardLayout title="Platform Overview" subtitle="System-wide transaction volumes, user KPIs, and gateway health">
                      <Dashboard />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/transfers"
                element={
                  <ProtectedRoute>
                    <DashboardLayout title="Money Transfers" subtitle="Instant peer-to-peer transfers, bank payouts, and transaction tracking">
                      <MoneyTransfers />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/payments"
                element={
                  <ProtectedRoute>
                    <DashboardLayout title="Payment Management" subtitle="Manage checkout transactions, orders, and payment gateway logs">
                      <Payments />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/kyc"
                element={
                  <ProtectedRoute>
                    <DashboardLayout title="KYC Verification" subtitle="Government identity verification, document proofs, and compliance">
                      <UserKycCenter />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/recharge"
                element={
                  <ProtectedRoute>
                    <DashboardLayout title="Mobile & DTH Recharge" subtitle="Browse operators, prepaid recharge plans, and instant service top-ups">
                      <RechargeManagement />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/sip"
                element={
                  <ProtectedRoute>
                    <DashboardLayout title="SIP & Mutual Funds" subtitle="Systematic Investment Plans, wealth funds, and recurring mandates">
                      <SipManagement />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/qr"
                element={
                  <ProtectedRoute>
                    <DashboardLayout title="QR Payments" subtitle="Generate dynamic QR invoices, merchant static counters, and scan & pay">
                      <QrManagement />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/disputes"
                element={
                  <ProtectedRoute>
                    <DashboardLayout title="Dispute & Refund Center" subtitle="File chargebacks, track resolution status, and view refund receipts">
                      <UserDisputeCenter />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/refunds"
                element={
                  <ProtectedRoute>
                    <DashboardLayout title="My Refunds" subtitle="Track chargeback reversals, wallet credits, and bank UTR numbers">
                      <UserDisputeCenter />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/users"
                element={
                  <ProtectedRoute>
                    <DashboardLayout title="User Directory" subtitle="Search customer profiles, accounts, and directory details">
                      <Users />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/analytics"
                element={
                  <ProtectedRoute>
                    <DashboardLayout title="Reports & Analytics" subtitle="Financial performance metrics, retention rates, and daily volumes">
                      <ReportsAnalytics />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/banks"
                element={
                  <ProtectedRoute>
                    <CustomerBankAccountsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/wallet"
                element={
                  <ProtectedRoute>
                    <CustomerWalletPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/bills"
                element={
                  <ProtectedRoute>
                    <CustomerBillsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/transactions"
                element={
                  <ProtectedRoute>
                    <CustomerTransactionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/land"
                element={
                  <ProtectedRoute>
                    <CustomerLandPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/upi"
                element={
                  <ProtectedRoute>
                    <CustomerUpiPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/profile"
                element={
                  <ProtectedRoute>
                    <CustomerProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* ================= Admin Auth Routes ================= */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin/verify-otp" element={<AdminVerifyOtpPage />} />
              <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
              <Route path="/admin/verify-reset-otp" element={<AdminVerifyResetOtpPage />} />
              <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />
              <Route
                path="/admin/change-password"
                element={
                  <AdminProtectedRoute>
                    <AdminChangePasswordPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/profile"
                element={
                  <AdminProtectedRoute>
                    <AdminProfilePage />
                  </AdminProtectedRoute>
                }
              />

              {/* ================= Admin Digital Land & Subsystem Pages ================= */}
              <Route
                path="/admin/land"
                element={
                  <AdminProtectedRoute>
                    <AdminDigitalLandPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/digital-land"
                element={
                  <AdminProtectedRoute>
                    <AdminDigitalLandPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/overview"
                element={
                  <AdminProtectedRoute>
                    <AdminDashboardPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <AdminProtectedRoute>
                    <AdminPanel />
                  </AdminProtectedRoute>
                }
              />

              {/* ================= Enterprise 18-Module Admin Console ================= */}
              <Route
                path="/admin/transfers"
                element={
                  <AdminProtectedRoute>
                    <Navigate to="/admin?tab=Money+Transfers" replace />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminProtectedRoute>
                    <AdminPanel />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/*"
                element={
                  <AdminProtectedRoute>
                    <AdminPanel />
                  </AdminProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </AdminAuthProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
