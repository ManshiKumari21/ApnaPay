import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import Dashboard from "../Dashboard";
import Users from "../Users";
import KYC from "../kyc/KYC";
import Payments from "../payments/Payments";
import MoneyTransfers from "../transfers/MoneyTransfers";
import WalletManagement from "../WalletManagement";
import TransactionManagement from "../TransactionManagement";
import QrManagement from "../QrManagement";
import DisputeManagement from "../DisputeManagement";
import RechargeManagement from "../RechargeManagement";
import BillPaymentManagement from "../BillPaymentManagement";
import SipManagement from "../SipManagement";
import DigitalLandManagement from "../DigitalLandManagement";
import CommissionManagement from "../CommissionManagement";
import ReportsAnalytics from "../ReportsAnalytics";
import NotificationsManagement from "../NotificationsManagement";
import SettingsManagement from "../SettingsManagement";
import AuditLogs from "../AuditLogs";
import AdminUsers from "../AdminUsers";
import AdminAuth from "../AdminAuth";

// Wealth & Investment Modules
import WealthDashboard from "../wealth/WealthDashboard";
import MutualFundManagement from "../wealth/MutualFundManagement";
import SipManagementAdmin from "../wealth/SipManagementAdmin";
import InvestmentTransactions from "../wealth/InvestmentTransactions";
import PartnerManagement from "../wealth/PartnerManagement";

// Loan Management Modules
import LoanDashboard from "../loans/LoanDashboard";
import LoanApplications from "../loans/LoanApplications";
import LoanProducts from "../loans/LoanProducts";
import EmiRepayments from "../loans/EmiRepayments";
import LenderPartners from "../loans/LenderPartners";

// Credit Score Management Modules
import CreditDashboard from "../credit/CreditDashboard";
import CreditScoreRequests from "../credit/CreditScoreRequests";
import ScoreHistory from "../credit/ScoreHistory";
import CreditBureauPartners from "../credit/CreditBureauPartners";

export default function AdminPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [active, setActive] = useState(tabParam || "Dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (tabParam && tabParam !== active) {
      setActive(tabParam);
    }
  }, [tabParam]);

  const handleSetActive = (tabName) => {
    setActive(tabName);
    setSearchParams({ tab: tabName });
  };

  return (
    <div className="portal-root">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="portal-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 1. Customer-Themed Stationary Admin Sidebar */}
      <Sidebar
        active={active}
        setActive={handleSetActive}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* 2. Customer-Themed Main Content Area */}
      <div className="portal-main-area">
        {/* Top Navbar */}
        <Header
          active={active}
          setActive={handleSetActive}
          onMenuToggle={() => setMobileOpen(!mobileOpen)}
          onProfileClick={() => handleSetActive("Admin Roles")}
        />

        {/* Independent Smooth Vertical Scroll Content */}
        <main className="portal-page-content">
          {/* 1. Dashboard */}
          {active === "Dashboard" && <Dashboard onNavigate={handleSetActive} setActive={handleSetActive} />}

          {/* 2. Admin Authentication */}
          {active === "Admin Auth" && <AdminAuth />}

          {/* 3. Admin Users & Roles */}
          {active === "Admin Roles" && <AdminUsers />}

          {/* 4. User Management */}
          {active === "User Management" && <Users />}

          {/* 5. KYC Management */}
          {active === "KYC Management" && <KYC />}

          {/* Payment Management */}
          {active === "Payment Management" && <Payments />}

          {/* Money Transfer Management */}
          {(active === "Money Transfers" || active === "Money Transfer Management") && <MoneyTransfers />}

          {/* 6. Wallet Management */}
          {active === "Wallet Management" && <WalletManagement />}

          {/* 7. Transaction Management */}
          {active === "Transactions" && <TransactionManagement />}

          {/* 8. QR Payment Management */}
          {(active === "QR Payments" || active === "QR Management") && <QrManagement />}

          {/* 9. Dispute & Refund Management */}
          {(active === "Disputes" || active === "Dispute Management" || active === "Refund Management") && (
            <DisputeManagement defaultTab={active === "Refund Management" ? "refunds" : "disputes"} />
          )}

          {/* 10. Recharge Management */}
          {(active === "Recharge" || active === "Recharge & Bills") && <RechargeManagement />}

          {/* 11. Bill Payment Management */}
          {active === "Bill Payments" && <BillPaymentManagement />}

          {/* 12. Investment & Wealth Modules */}
          {(active === "Wealth Dashboard" || active === "Wealth") && (
            <WealthDashboard onNavigate={handleSetActive} />
          )}

          {(active === "Mutual Funds" || active === "Mutual Fund Management") && (
            <MutualFundManagement onNavigate={handleSetActive} />
          )}

          {(active === "SIP Investments" || active === "SIP Management" || active === "SIP & Wealth") && (
            <SipManagementAdmin onNavigate={handleSetActive} />
          )}

          {active === "Investment Transactions" && (
            <InvestmentTransactions onNavigate={handleSetActive} />
          )}

          {active === "Partner Management" && (
            <PartnerManagement onNavigate={handleSetActive} />
          )}

          {/* 13. Loan Management Modules */}
          {(active === "Loan Dashboard" || active === "Loans") && (
            <LoanDashboard onNavigate={handleSetActive} />
          )}

          {active === "Loan Applications" && (
            <LoanApplications onNavigate={handleSetActive} />
          )}

          {active === "Loan Products" && (
            <LoanProducts onNavigate={handleSetActive} />
          )}

          {(active === "EMI & Repayments" || active === "EMI Repayments") && (
            <EmiRepayments onNavigate={handleSetActive} />
          )}

          {active === "Lender Partners" && (
            <LenderPartners onNavigate={handleSetActive} />
          )}

          {/* 14. Credit Score Management Modules */}
          {(active === "Credit Dashboard" || active === "Credit Score") && (
            <CreditDashboard onNavigate={handleSetActive} />
          )}

          {active === "Credit Score Requests" && (
            <CreditScoreRequests onNavigate={handleSetActive} />
          )}

          {active === "Score History" && (
            <ScoreHistory onNavigate={handleSetActive} />
          )}

          {active === "Credit Bureau Partners" && (
            <CreditBureauPartners onNavigate={handleSetActive} />
          )}

          {/* 15. Digital Land / Digital Gold */}
          {(active === "Digital Land" || active === "Digital Gold") && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 20px",
                background: "linear-gradient(135deg, rgba(8, 123, 255, 0.15) 0%, rgba(0, 213, 255, 0.08) 100%)",
                border: "1px solid rgba(0, 213, 255, 0.25)",
                borderRadius: "12px",
                flexWrap: "wrap",
                gap: "10px"
              }}>
                <div>
                  <div style={{ fontWeight: "700", color: "#FFFFFF", fontSize: "14px" }}>
                    Digital Land Order Approvals & Verification Console
                  </div>
                  <div style={{ color: "#8BA2C1", fontSize: "12px", marginTop: "3px" }}>
                    Review customer plot purchases, approve deed transfers, or inspect survey numbers
                  </div>
                </div>
                <a
                  href="/admin/land"
                  style={{
                    padding: "8px 16px",
                    background: "linear-gradient(135deg, #087BFF, #00D5FF)",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontWeight: "600",
                    fontSize: "12.5px",
                    textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(0, 168, 255, 0.35)"
                  }}
                >
                  Open Order Approvals Console →
                </a>
              </div>
              <DigitalLandManagement />
            </div>
          )}

          {/* 14. Commission Management */}
          {active === "Commission" && <CommissionManagement />}

          {/* 15. Reports & Analytics */}
          {active === "Reports & Analytics" && <ReportsAnalytics />}

          {/* 16. Notifications */}
          {active === "Notifications" && <NotificationsManagement />}

          {/* 17. Settings */}
          {active === "Settings" && <SettingsManagement />}

          {/* 18. Audit Logs */}
          {active === "Audit Logs" && <AuditLogs />}

          <footer
            style={{
              marginTop: "16px",
              paddingTop: "12px",
              paddingBottom: "8px",
              borderTop: "1px solid var(--border-color)",
              textAlign: "center",
              fontSize: "12px",
              color: "var(--muted-text)"
            }}
          >
            ApnaPay Enterprise Admin Console · 30 Active Fintech Modules · Connected to Port 5000
          </footer>
        </main>
      </div>
    </div>
  );
}
