import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Gauge,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Building2,
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import wealthService from "../../services/wealthService";

export default function WealthDashboard({ onNavigate, isCustomer = false }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await wealthService.getWealthDashboard();
      if (res?.success) {
        setData(res);
      } else {
        setError(res?.message || "Failed to load Wealth Dashboard metrics.");
      }
    } catch (err) {
      setError(err?.message || "Error connecting to wealth management service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const recentTransactions = data?.recentTransactions || [];
  const recentSips = data?.recentSips || [];
  const recentLoans = data?.recentLoans || [];
  const recentCreditRequests = data?.recentCreditRequests || [];

  return (
    <div className="dashboard-content">
      {/* Page Heading */}
      <div className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", color: "var(--cyan-highlight)", background: "rgba(0, 213, 255, 0.12)", padding: "3px 8px", borderRadius: "4px" }}>
              {isCustomer ? "INVESTMENT & WEALTH" : "Enterprise Wealth Console"}
            </span>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "-0.5px" }}>
            {isCustomer ? "Wealth & Portfolio Overview" : "Wealth & Financial Management Dashboard"}
          </h1>
          <p style={{ color: "var(--secondary-text)", fontSize: "13.5px", marginTop: "4px" }}>
            {isCustomer
              ? "Track real-time mutual fund portfolios, SIP collections, asset allocation, and investment growth."
              : "Real-time tracking of Mutual Funds AUM, SIP subscriptions, retail loan disbursements, and credit bureau scores."}
          </p>
        </div>
        <button
          type="button"
          className="refresh-btn"
          onClick={fetchData}
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(8, 123, 255, 0.15)",
            border: "1px solid var(--border-color)",
            color: "var(--cyan-highlight)",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          {loading ? "Syncing..." : "Refresh Metrics"}
        </button>
      </div>

      {error && (
        <div style={{ background: "rgba(255, 77, 77, 0.12)", border: "1px solid rgba(255, 77, 77, 0.3)", padding: "14px 18px", borderRadius: "10px", color: "#FF6B6B", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* 9 KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px",
          marginBottom: "28px"
        }}
      >
        {/* 1. Total Investments */}
        <div className="stat-card" style={{ background: "linear-gradient(180deg, #0B1E38 0%, #071426 100%)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--secondary-text)", letterSpacing: "0.5px" }}>Total Investments</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(8, 123, 255, 0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00D5FF" }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: "800", color: "#FFFFFF", lineHeight: 1.1 }}>
            {loading ? "..." : (stats.totalInvestments || 68).toLocaleString()}
          </div>
          <div style={{ fontSize: "11.5px", color: "#00E599", marginTop: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
            <ArrowUpRight size={14} /> +14.2% volume vs last month
          </div>
        </div>

        {/* 2. Total AUM */}
        <div className="stat-card" style={{ background: "linear-gradient(180deg, #0B1E38 0%, #071426 100%)", border: "1px solid rgba(0, 213, 255, 0.3)", borderRadius: "14px", padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--cyan-highlight)", letterSpacing: "0.5px" }}>Total AUM Book</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(0, 213, 255, 0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00D5FF" }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: "800", color: "#FFFFFF", lineHeight: 1.1 }}>
            {loading ? "..." : `₹${(Number(stats.totalAum || 202000000) / 10000000).toFixed(2)} Cr`}
          </div>
          <div style={{ fontSize: "11.5px", color: "#A9BDD7", marginTop: "8px" }}>
            ₹{(stats.totalAum || 202000000).toLocaleString("en-IN")} total market value
          </div>
        </div>

        {/* 3. Active SIP Subscriptions */}
        <div className="stat-card" style={{ background: "linear-gradient(180deg, #0B1E38 0%, #071426 100%)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--secondary-text)", letterSpacing: "0.5px" }}>Active SIP Subscriptions</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(0, 229, 153, 0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00E599" }}>
              <Calendar size={18} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: "800", color: "#FFFFFF", lineHeight: 1.1 }}>
            {loading ? "..." : (stats.activeSips || 5).toLocaleString()}
          </div>
          <div style={{ fontSize: "11.5px", color: "#00E599", marginTop: "8px" }}>
            100% automated e-NACH / UPI AutoPay
          </div>
        </div>

        {/* 4. Monthly SIP Collection */}
        <div className="stat-card" style={{ background: "linear-gradient(180deg, #0B1E38 0%, #071426 100%)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--secondary-text)", letterSpacing: "0.5px" }}>Monthly SIP Book</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(8, 123, 255, 0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#008CFF" }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: "800", color: "#FFFFFF", lineHeight: 1.1 }}>
            {loading ? "..." : `₹${Number(stats.monthlySipCollection || 22500).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          </div>
          <div style={{ fontSize: "11.5px", color: "#A9BDD7", marginTop: "8px" }}>
            Recurring auto-debit run rate
          </div>
        </div>

        {/* 5. Mutual Fund Schemes */}
        <div className="stat-card" style={{ background: "linear-gradient(180deg, #0B1E38 0%, #071426 100%)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--secondary-text)", letterSpacing: "0.5px" }}>Mutual Fund Schemes</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#F59E0B" }}>
              <Layers size={18} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: "800", color: "#FFFFFF", lineHeight: 1.1 }}>
            {loading ? "..." : (stats.mutualFundSchemes || 6)}
          </div>
          <div style={{ fontSize: "11.5px", color: "#A9BDD7", marginTop: "8px" }}>
            Approved Equity, Debt & Hybrid catalogs
          </div>
        </div>

        {/* 6. Pending SIP Transactions */}
        <div className="stat-card" style={{ background: "linear-gradient(180deg, #0B1E38 0%, #071426 100%)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--secondary-text)", letterSpacing: "0.5px" }}>Pending SIP Orders</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#F59E0B" }}>
              <AlertCircle size={18} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: "800", color: "#FFFFFF", lineHeight: 1.1 }}>
            {loading ? "..." : (stats.pendingSipTransactions || 1)}
          </div>
          <div style={{ fontSize: "11.5px", color: "#F59E0B", marginTop: "8px" }}>
            Awaiting AMC settlement sync
          </div>
        </div>

        {/* 7. Total Loan Applications */}
        <div className="stat-card" style={{ background: "linear-gradient(180deg, #0B1E38 0%, #071426 100%)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--secondary-text)", letterSpacing: "0.5px" }}>Total Loan Apps</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(8, 123, 255, 0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00D5FF" }}>
              <FileText size={18} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: "800", color: "#FFFFFF", lineHeight: 1.1 }}>
            {loading ? "..." : (stats.totalLoanApplications || 8)}
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--secondary-text)", marginTop: "8px" }}>
            Personal, Business, Home & Auto loans
          </div>
        </div>

        {/* 8. Approved Loans */}
        <div className="stat-card" style={{ background: "linear-gradient(180deg, #0B1E38 0%, #071426 100%)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--secondary-text)", letterSpacing: "0.5px" }}>Approved & Disbursed</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(0, 229, 153, 0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00E599" }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: "800", color: "#FFFFFF", lineHeight: 1.1 }}>
            {loading ? "..." : (stats.approvedLoans || 5)}
          </div>
          <div style={{ fontSize: "11.5px", color: "#00E599", marginTop: "8px" }}>
            62.5% overall approval rate
          </div>
        </div>

        {/* 9. Credit Score Requests */}
        <div className="stat-card" style={{ background: "linear-gradient(180deg, #0B1E38 0%, #071426 100%)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--secondary-text)", letterSpacing: "0.5px" }}>Credit Score Checks</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(0, 213, 255, 0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00D5FF" }}>
              <Gauge size={18} />
            </div>
          </div>
          <div style={{ fontSize: "26px", fontWeight: "800", color: "#FFFFFF", lineHeight: 1.1 }}>
            {loading ? "..." : (stats.creditScoreRequests || 8)}
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--cyan-highlight)", marginTop: "8px" }}>
            CIBIL, Experian, CRIF & Equifax
          </div>
        </div>
      </div>

      {/* Visual Analytics & Breakdown Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "20px", marginBottom: "32px" }}>
        {/* AUM Growth Chart */}
        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#FFFFFF" }}>Monthly Investment Growth (AUM)</h3>
              <p style={{ fontSize: "12px", color: "var(--secondary-text)" }}>Trailing 6 months portfolio growth trajectory</p>
            </div>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#00E599", background: "rgba(0, 229, 153, 0.12)", padding: "4px 8px", borderRadius: "6px" }}>+42.2% H2</span>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: "14px", height: "180px", paddingTop: "20px", borderBottom: "1px solid rgba(23, 56, 93, 0.6)", paddingBottom: "10px" }}>
            {(charts.monthlyGrowth || []).map((m, idx) => {
              const maxAum = 220000000;
              const heightPct = Math.round((m.aum / maxAum) * 100);
              return (
                <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", height: "100%", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "10px", color: "#00D5FF", fontWeight: "600" }}>₹{(m.aum / 10000000).toFixed(1)}Cr</span>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "34px",
                      height: `${heightPct}%`,
                      background: "linear-gradient(180deg, #00D5FF 0%, #087BFF 100%)",
                      borderRadius: "6px 6px 0 0",
                      transition: "height 0.4s ease"
                    }}
                  />
                  <span style={{ fontSize: "10.5px", color: "var(--secondary-text)", whiteSpace: "nowrap" }}>{m.month.split(" ")[0]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mutual Fund Category Distribution */}
        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#FFFFFF" }}>Portfolio Category Distribution</h3>
              <p style={{ fontSize: "12px", color: "var(--secondary-text)" }}>Mutual fund assets allocation across sectors</p>
            </div>
            <span style={{ fontSize: "11px", color: "var(--cyan-highlight)", background: "rgba(0, 213, 255, 0.12)", padding: "4px 8px", borderRadius: "6px" }}>BSE StAR MF</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
            {(charts.mfCategoryDistribution || []).map((cat, idx) => {
              const colors = ["#00D5FF", "#087BFF", "#00E599", "#F59E0B", "#A855F7"];
              const color = colors[idx % colors.length];
              return (
                <div key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: "4px" }}>
                    <span style={{ color: "#FFFFFF", fontWeight: "600" }}>{cat.category}</span>
                    <span style={{ color: color, fontWeight: "700" }}>{cat.percentage}%</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "rgba(23, 56, 93, 0.6)", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ width: `${cat.percentage}%`, height: "100%", background: color, borderRadius: "999px" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Navigation Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "32px" }}>
        <button
          type="button"
          onClick={() => onNavigate && onNavigate("Mutual Fund Management")}
          style={{ background: "#0B1B32", border: "1px solid var(--border-color)", padding: "14px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", color: "#FFFFFF", textAlign: "left" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <TrendingUp size={18} style={{ color: "#00D5FF" }} />
            <span style={{ fontSize: "13px", fontWeight: "700" }}>Mutual Funds</span>
          </div>
          <ChevronRight size={16} color="#A9BDD7" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate("SIP Management")}
          style={{ background: "#0B1B32", border: "1px solid var(--border-color)", padding: "14px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", color: "#FFFFFF", textAlign: "left" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Calendar size={18} style={{ color: "#00E599" }} />
            <span style={{ fontSize: "13px", fontWeight: "700" }}>SIP Management</span>
          </div>
          <ChevronRight size={16} color="#A9BDD7" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate("Loan Applications")}
          style={{ background: "#0B1B32", border: "1px solid var(--border-color)", padding: "14px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", color: "#FFFFFF", textAlign: "left" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FileText size={18} style={{ color: "#F59E0B" }} />
            <span style={{ fontSize: "13px", fontWeight: "700" }}>Loan Applications</span>
          </div>
          <ChevronRight size={16} color="#A9BDD7" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate("Credit Score Requests")}
          style={{ background: "#0B1B32", border: "1px solid var(--border-color)", padding: "14px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", color: "#FFFFFF", textAlign: "left" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Gauge size={18} style={{ color: "#00D5FF" }} />
            <span style={{ fontSize: "13px", fontWeight: "700" }}>Credit Bureau Reports</span>
          </div>
          <ChevronRight size={16} color="#A9BDD7" />
        </button>
      </div>

      {/* Recent Sections Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))", gap: "20px" }}>
        {/* Recent Investment Transactions */}
        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#FFFFFF" }}>Recent Investment Transactions</h3>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate("Investment Transactions")}
              style={{ background: "transparent", border: "none", color: "var(--cyan-highlight)", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
            >
              View All <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: "#071426",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px"
                }}
              >
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#FFFFFF" }}>{tx.user_name}</div>
                  <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>{tx.scheme_name} • {tx.transaction_type}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#00D5FF" }}>₹{Number(tx.amount).toFixed(2)}</div>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      color: tx.status === "Successful" ? "#00E599" : tx.status === "Failed" ? "#FF4D4D" : "#F59E0B"
                    }}
                  >
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Loan Applications */}
        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#FFFFFF" }}>Recent Loan Applications</h3>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate("Loan Applications")}
              style={{ background: "transparent", border: "none", color: "var(--cyan-highlight)", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
            >
              View All <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recentLoans.map((l) => (
              <div
                key={l.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: "#071426",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px"
                }}
              >
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#FFFFFF" }}>{l.applicant_name}</div>
                  <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>{l.loan_type} • {l.lender_name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#FFFFFF" }}>₹{Number(l.requested_amount).toLocaleString("en-IN")}</div>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: l.application_status === "Disbursed" ? "rgba(0, 229, 153, 0.15)" : l.application_status === "Approved" ? "rgba(8, 123, 255, 0.15)" : "rgba(245, 158, 11, 0.15)",
                      color: l.application_status === "Disbursed" ? "#00E599" : l.application_status === "Approved" ? "#00D5FF" : "#F59E0B"
                    }}
                  >
                    {l.application_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
