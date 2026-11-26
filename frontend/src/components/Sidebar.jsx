import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, ShieldCheck, ArrowLeftRight,
  Wallet, QrCode, AlertCircle, Smartphone, Receipt,
  TrendingUp, Map, Percent, BarChart3, Bell,
  Settings, History, Lock, UserCog, LogOut,
  CreditCard, Send, ExternalLink, Shield, X, RefreshCcw,
  Calendar, Building2, Landmark, FileText, Layers, Calculator, Gauge, Search
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";

const menuGroups = [
  {
    group: "OVERVIEW",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, badge: "New", badgeColor: "cyan" },
      { name: "Reports & Analytics", icon: BarChart3, badge: "Beta", badgeColor: "blue" }
    ]
  },
  {
    group: "USERS & ACCESS",
    items: [
      { name: "User Management", icon: Users, badge: "1,248", badgeColor: "blue" },
      { name: "KYC Management", icon: ShieldCheck, badge: "Pending 12", badgeColor: "orange" },
      { name: "Admin Roles", icon: UserCog, badge: "RBAC", badgeColor: "blue" },
      { name: "Admin Auth", icon: Lock, badge: "2FA", badgeColor: "green" }
    ]
  },
  {
    group: "FINANCE & LEDGER",
    items: [
      { name: "Payment Management", icon: CreditCard, badge: "PG", badgeColor: "blue" },
      { name: "Money Transfers", icon: Send, badge: "P2P", badgeColor: "blue" }
    ]
  },
  {
    group: "PAYMENTS & SERVICES",
    items: [
      { name: "QR Management", icon: QrCode, badge: "QR", badgeColor: "blue" },
      { name: "Recharge & Bills", icon: Smartphone, badge: "RECH", badgeColor: "cyan" },
      { name: "Digital Land", icon: Map, badge: "LAND", badgeColor: "gold" }
    ]
  },
  {
    group: "INVESTMENT & WEALTH",
    items: [
      { name: "Wealth Dashboard", icon: TrendingUp, badge: "AUM", badgeColor: "cyan" },
      { name: "Mutual Funds", icon: BarChart3, badge: "MF", badgeColor: "blue" },
      { name: "SIP Management", icon: Calendar, badge: "SIP", badgeColor: "green" },
      { name: "Investment Transactions", icon: Receipt, badge: "TXN", badgeColor: "blue" },
      { name: "Partner Management", icon: Building2, badge: "DIR", badgeColor: "blue" }
    ]
  },
  {
    group: "LOAN MANAGEMENT",
    items: [
      { name: "Loan Dashboard", icon: Landmark, badge: "LOAN", badgeColor: "cyan" },
      { name: "Loan Applications", icon: FileText, badge: "APP", badgeColor: "orange" },
      { name: "Loan Products", icon: Layers, badge: "PROD", badgeColor: "blue" },
      { name: "EMI & Repayments", icon: Calculator, badge: "EMI", badgeColor: "green" },
      { name: "Lender Partners", icon: Building2, badge: "NBFC", badgeColor: "blue" }
    ]
  },
  {
    group: "CREDIT SCORE MANAGEMENT",
    items: [
      { name: "Credit Dashboard", icon: Gauge, badge: "CIBIL", badgeColor: "cyan" },
      { name: "Credit Score Requests", icon: Search, badge: "REQ", badgeColor: "blue" },
      { name: "Score History", icon: History, badge: "HIST", badgeColor: "green" },
      { name: "Credit Bureau Partners", icon: ShieldCheck, badge: "BUREAU", badgeColor: "blue" }
    ]
  },
  {
    group: "SUPPORT & COMPLIANCE",
    items: [
      { name: "Refund Management", icon: RefreshCcw, badge: "RF", badgeColor: "blue" },
      { name: "Dispute Management", icon: AlertCircle, badge: "DS", badgeColor: "blue" }
    ]
  }
];

export default function Sidebar({ active, setActive, mobileOpen, setMobileOpen }) {
  const navigate = useNavigate();
  const { admin, adminLogout } = useAdminAuth() || {};

  const handleLogout = async () => {
    try {
      if (adminLogout) await adminLogout();
    } catch (e) {
      console.warn("Logout error:", e);
    }
    navigate("/admin/login");
  };

  const getInitials = (name) => {
    if (!name) return "AD";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const adminName = admin?.fullName || admin?.full_name || admin?.name || "Manshi Gupta";
  const adminEmail = admin?.email || "manshigupta2103@gmail.com";
  const adminRole = admin?.role ? admin.role.toUpperCase() : "SUPER ADMIN";

  return (
    <aside className={`portal-sidebar ${mobileOpen ? "open" : ""}`}>
      {/* 1. Brand Header */}
      <div className="portal-sidebar-header">
        <div
          className="sidebar-brand-link"
          onClick={() => {
            setActive("Dashboard");
            if (setMobileOpen) setMobileOpen(false);
          }}
          title="Go to Admin Dashboard"
          aria-label="ApnaPay Admin Home"
        >
          <div
            className="brand-logo-icon"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "11px",
              background: "linear-gradient(135deg, #087BFF 0%, #00D5FF 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(0, 168, 255, 0.4)",
              fontWeight: "900",
              fontSize: "20px",
              color: "#FFFFFF",
              flexShrink: 0
            }}
          >
            A
          </div>
          <div>
            <div style={{ fontSize: "18px", fontWeight: "800", letterSpacing: "-0.3px", color: "#FFFFFF", lineHeight: 1.2 }}>
              Apna<span style={{ color: "#00D5FF" }}>Pay</span>
            </div>
            <div style={{ fontSize: "11px", color: "#A9BDD7", fontWeight: "500", marginTop: "1px" }}>
              Enterprise Admin
            </div>
          </div>
        </div>

        {/* Mobile Close Button */}
        {setMobileOpen && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="mobile-close-btn"
            aria-label="Close Sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* 2. Middle Navigation (Independent Scroll with Preserved Separation) */}
      <nav className="portal-sidebar-nav">
        {menuGroups.map((grp) => (
          <div key={grp.group} className="sidebar-group" style={{ marginBottom: "8px" }}>
            <div className="sidebar-category-label">
              {grp.group}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {grp.items.map((item) => {
                const Icon = item.icon;
                const isSelected =
                  active === item.name ||
                  (item.name === "Money Transfers" && active === "Money Transfer Management") ||
                  (item.name === "QR Management" && active === "QR Payments") ||
                  (item.name === "Recharge & Bills" && (active === "Recharge Management" || active === "Mobile Recharge")) ||
                  (item.name === "SIP Management" && (active === "SIP & Wealth" || active === "SIP Investments")) ||
                  (item.name === "Mutual Funds" && active === "Mutual Fund Management") ||
                  (item.name === "Wealth Dashboard" && active === "Wealth") ||
                  (item.name === "Loan Dashboard" && active === "Loans") ||
                  (item.name === "EMI & Repayments" && active === "EMI Repayments") ||
                  (item.name === "Credit Dashboard" && active === "Credit Score") ||
                  (item.name === "Reports & Analytics" && active === "Reports");

                return (
                  <button
                    key={item.name}
                    type="button"
                    className={`sidebar-link ${isSelected ? "active" : ""}`}
                    onClick={() => {
                      setActive(item.name);
                      if (setMobileOpen) setMobileOpen(false);
                    }}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                    {item.badge && (
                      <span className={`sidebar-badge ${item.badgeColor || "blue"}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Trust Badge Pinned Above User Footer */}
      <div className="sidebar-trust-badge">
        <div className="trust-icon-wrap">
          <ShieldCheck size={18} />
        </div>
        <div>
          <div className="trust-title">ApnaPay</div>
          <div className="trust-subtitle">Safe • Secure • Reliable</div>
        </div>
      </div>

      {/* 3. Stationary Pinned Footer */}
      <div className="portal-sidebar-footer">
        {/* Admin User Card */}
        <div className="sidebar-user-card">
          <div className="user-avatar-initials">
            {getInitials(adminName)}
          </div>
          <div className="user-info">
            <div className="user-name" title={adminName}>
              {adminName}
            </div>
            <div className="user-email" style={{ textTransform: "uppercase", fontSize: "10px", color: "var(--cyan-highlight)", fontWeight: "600" }}>
              {adminRole}
            </div>
          </div>
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Sign Out of Admin Console"
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Customer Portal Shortcut */}
        <Link
          to="/app"
          className="sidebar-link sidebar-customer-portal"
          style={{
            marginTop: "8px",
            background: "rgba(0, 168, 255, 0.08)",
            border: "1px solid rgba(0, 168, 255, 0.22)",
            color: "#00D5FF",
            padding: "8px 12px",
            minHeight: "36px",
            fontSize: "12.5px"
          }}
          title="Open Customer Dashboard"
        >
          <ExternalLink size={15} />
          <span style={{ flex: 1 }}>Customer Portal</span>
          <span className="sidebar-badge blue">App</span>
        </Link>
      </div>
    </aside>
  );
}
