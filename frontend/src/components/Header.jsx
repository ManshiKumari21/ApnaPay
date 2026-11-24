import React, { useState, useRef, useEffect } from "react";
import { Search, Bell, ChevronDown, ExternalLink, Menu, Shield, Check, X, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

const adminModules = [
  { name: "Dashboard", category: "Overview", desc: "System KPIs, users, KYC & transaction summaries" },
  { name: "Reports & Analytics", category: "Overview", desc: "Financial metrics, volume analysis & reports" },
  { name: "User Management", category: "Users & Access", desc: "Customer accounts directory, status & balance" },
  { name: "KYC Management", category: "Users & Access", desc: "Aadhaar, PAN & identity document verification" },
  { name: "Admin Roles", category: "Users & Access", desc: "Admin staff permissions, RBAC & security" },
  { name: "Admin Auth", category: "Users & Access", desc: "Dual-tenant 2FA login & token management" },
  { name: "Payment Management", category: "Finance & Ledger", desc: "Payment intents, gateways & checkout requests" },
  { name: "Money Transfers", category: "Finance & Ledger", desc: "P2P transfers, bank payouts & settlements" },
  { name: "Wallet Management", category: "Finance & Ledger", desc: "RBI escrow balance, ledger limits & freezes" },
  { name: "Transactions", category: "Finance & Ledger", desc: "Full financial transaction audit logs" },
  { name: "QR Payments", category: "Finance & Ledger", desc: "Static & dynamic UPI QR codes" },
  { name: "Disputes", category: "Finance & Ledger", desc: "Chargebacks, user complaints & resolutions" },
  { name: "Commission", category: "Finance & Ledger", desc: "Platform fees, partner splits & rule tiers" },
  { name: "Recharge", category: "Services & VAS", desc: "Jio, Airtel, Vi, BSNL mobile & DTH recharges" },
  { name: "Bill Payments", category: "Services & VAS", desc: "BBPS electricity, water, gas & utility bills" },
  { name: "SIP Investments", category: "Services & VAS", desc: "Mutual funds, SIP mandates & investments" },
  { name: "Digital Land", category: "Services & VAS", desc: "Fractional digital real estate asset holdings" },
  { name: "Notifications", category: "System & Audit", desc: "SMTP email alerts & broadcast messages" },
  { name: "Settings", category: "System & Audit", desc: "System parameters, maintenance & configurations" },
  { name: "Audit Logs", category: "System & Audit", desc: "Admin access trails & forensic logs" }
];

export default function Header({ active, setActive, onMenuToggle, onProfileClick }) {
  const { admin } = useAdminAuth() || {};
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef(null);

  const adminName = admin?.fullName || admin?.full_name || admin?.name || "Manshi Gupta";
  const adminRole = "Super Admin";

  const getInitials = (name) => {
    if (!name) return "AD";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const filteredModules = searchQuery.trim()
    ? adminModules.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="portal-top-navbar">
      {/* Left Area: Mobile Hamburger */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {onMenuToggle && (
          <button
            className="portal-hamburger-btn"
            onClick={onMenuToggle}
            aria-label="Toggle Navigation Drawer"
            title="Open Menu"
          >
            <Menu size={20} />
          </button>
        )}
      </div>

      {/* Middle Area: Search with Module Jump */}
      <div className="top-search-wrap" ref={searchRef} style={{ maxWidth: "420px", position: "relative" }}>
        <div className="top-search-icon">
          <Search size={16} />
        </div>
        <input
          type="text"
          className="top-search-input"
          placeholder="Search users, transactions, KYC, etc..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
        />
        {!searchQuery ? (
          <span
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(23, 56, 93, 0.6)",
              border: "1px solid #214C7C",
              borderRadius: "5px",
              padding: "2px 7px",
              fontSize: "11px",
              color: "#8BA2C1",
              fontWeight: "600",
              pointerEvents: "none"
            }}
          >
            Ctrl + K
          </span>
        ) : (
          <button
            onClick={() => setSearchQuery("")}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              color: "var(--muted-text)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center"
            }}
          >
            <X size={14} />
          </button>
        )}

        {/* Live Search Autocomplete Results */}
        {searchFocused && filteredModules.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              background: "#0B1B32",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-card)",
              zIndex: 100,
              maxHeight: "340px",
              overflowY: "auto",
              padding: "6px"
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontWeight: "700",
                color: "var(--muted-text)",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                padding: "6px 10px 4px"
              }}
            >
              Matching Modules ({filteredModules.length})
            </div>
            {filteredModules.map((mod) => (
              <div
                key={mod.name}
                onClick={() => {
                  if (setActive) setActive(mod.name);
                  setSearchQuery("");
                  setSearchFocused(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "var(--transition)",
                  background: active === mod.name ? "rgba(0, 168, 255, 0.15)" : "transparent"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-hover)")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    active === mod.name ? "rgba(0, 168, 255, 0.15)" : "transparent")
                }
              >
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#FFFFFF" }}>
                    {mod.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>
                    {mod.desc}
                  </div>
                </div>
                <span className="sidebar-badge blue">{mod.category}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Area: System Status, Customer View, Notification, Profile */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* System Online Status Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 12px",
            borderRadius: "var(--radius-full)",
            background: "rgba(0, 229, 153, 0.1)",
            border: "1px solid rgba(0, 229, 153, 0.25)",
            fontSize: "12px",
            color: "#00E599",
            fontWeight: "600"
          }}
          title="Backend API Connected at http://localhost:5000"
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#00E599",
              boxShadow: "0 0 8px #00E599"
            }}
          />
          <span style={{ display: "inline-block" }}>Port 5000 Live</span>
        </div>

        {/* Customer Portal View Shortcut */}
        <Link
          to="/app"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            color: "var(--cyan-highlight)",
            background: "rgba(0, 168, 255, 0.1)",
            border: "1px solid rgba(0, 168, 255, 0.25)",
            padding: "6px 12px",
            borderRadius: "var(--radius-full)",
            textDecoration: "none",
            fontWeight: "600",
            transition: "var(--transition)"
          }}
          title="Switch to Customer Application"
        >
          <span>Customer View</span>
          <ExternalLink size={13} />
        </Link>

        {/* Notifications Icon Button */}
        <button
          className="notification"
          onClick={() => setActive && setActive("Notifications")}
          title="System Notifications"
          aria-label="Notifications"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "var(--radius-md)",
            background: "#0B1B32",
            border: "1px solid var(--border-color)",
            color: "var(--secondary-text)",
            display: "grid",
            placeItems: "center",
            position: "relative",
            cursor: "pointer"
          }}
        >
          <Bell size={17} />
          <span
            style={{
              position: "absolute",
              top: "-3px",
              right: "-3px",
              width: "18px",
              height: "18px",
              background: "#FF4D4D",
              color: "#FFFFFF",
              borderRadius: "50%",
              fontSize: "10px",
              fontWeight: "700",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 0 8px rgba(255, 77, 77, 0.7)"
            }}
          >
            3
          </span>
        </button>

        {/* Admin Profile Pill */}
        <div
          className="header-user-pill"
          onClick={() => {
            if (onProfileClick) onProfileClick();
            else if (setActive) setActive("Admin Roles");
          }}
          title="Admin Profile & Roles"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "4px 12px 4px 6px",
            background: "#0B1B32",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-full)",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #087BFF 0%, #00D5FF 100%)",
              color: "#FFFFFF",
              fontWeight: "700",
              fontSize: "12px",
              display: "grid",
              placeItems: "center",
              flexShrink: 0
            }}
          >
            {getInitials(adminName)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", textAlign: "left", lineHeight: 1.15 }}>
            <span style={{ fontSize: "12.5px", fontWeight: "700", color: "#FFFFFF" }}>
              {adminName}
            </span>
            <span style={{ fontSize: "10.5px", color: "var(--secondary-text)", fontWeight: "500" }}>
              Super Admin
            </span>
          </div>
          <ChevronDown size={14} style={{ color: "#A9BDD7", marginLeft: "2px" }} />
        </div>

        {/* Refresh Console Button */}
        <button
          onClick={() => window.location.reload()}
          title="Refresh Console"
          className="auth-button secondary"
          style={{
            width: "38px",
            height: "38px",
            padding: 0,
            margin: 0,
            display: "grid",
            placeItems: "center",
            borderRadius: "10px",
            background: "#0B1B32",
            border: "1px solid var(--border-color)",
            color: "var(--secondary-text)",
            cursor: "pointer"
          }}
          aria-label="Refresh Console"
        >
          <RefreshCw size={15} />
        </button>
      </div>
    </header>
  );
}
