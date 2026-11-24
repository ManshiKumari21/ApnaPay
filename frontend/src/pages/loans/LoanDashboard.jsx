import React, { useState, useEffect } from "react";
import {
  Landmark,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Building2,
  Layers,
  ChevronRight,
  ArrowUpRight
} from "lucide-react";
import wealthService from "../../services/wealthService";

export default function LoanDashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await wealthService.getLoanDashboard();
      if (res?.success) {
        setData(res);
      } else {
        setError(res?.message || "Failed to load Loan Dashboard");
      }
    } catch (err) {
      setError(err?.message || "Error connecting to loan service");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const recentApps = data?.recentApplications || [];

  return (
    <div className="dashboard-content">
      {/* Page Heading */}
      <div className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", color: "var(--cyan-highlight)", background: "rgba(0, 213, 255, 0.12)", padding: "3px 8px", borderRadius: "4px" }}>
              Credit & Lending Console
            </span>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "-0.5px" }}>
            Loan Management Dashboard
          </h1>
          <p style={{ color: "var(--secondary-text)", fontSize: "13.5px", marginTop: "4px" }}>
            Overview of digital loan applications, underwriting pipelines, bank/NBFC partner approvals, and loan disbursements.
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
            cursor: "pointer"
          }}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: "rgba(255, 77, 77, 0.12)", border: "1px solid rgba(255, 77, 77, 0.3)", padding: "14px 18px", borderRadius: "10px", color: "#FF6B6B", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {/* 8 KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Total Applications</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", marginTop: "4px" }}>{stats.totalApplications || 8}</div>
          <span style={{ fontSize: "11px", color: "var(--cyan-highlight)" }}>Submitted across retail loans</span>
        </div>

        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Pending Action</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#F59E0B", marginTop: "4px" }}>{stats.pendingApplications || 2}</div>
          <span style={{ fontSize: "11px", color: "#F59E0B" }}>Applied & Documents Required</span>
        </div>

        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Under Review</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#00D5FF", marginTop: "4px" }}>{stats.underReview || 1}</div>
          <span style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Credit assessment queue</span>
        </div>

        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Approved Loans</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#00E599", marginTop: "4px" }}>{stats.approvedLoans || 1}</div>
          <span style={{ fontSize: "11px", color: "#00E599" }}>Ready for disbursement</span>
        </div>

        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Rejected Loans</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#FF4D4D", marginTop: "4px" }}>{stats.rejectedLoans || 0}</div>
          <span style={{ fontSize: "11px", color: "var(--secondary-text)" }}>CIBIL or eligibility mismatch</span>
        </div>

        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Disbursed Loans</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#00E599", marginTop: "4px" }}>{stats.disbursedLoans || 3}</div>
          <span style={{ fontSize: "11px", color: "#00E599" }}>Active loan agreements</span>
        </div>

        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Total Disbursed Volume</span>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#00D5FF", marginTop: "4px" }}>
            ₹{((stats.totalDisbursedAmount || 2300000) / 100000).toFixed(1)} Lakhs
          </div>
          <span style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Cumulative capital released</span>
        </div>

        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Outstanding Principal</span>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#FFFFFF", marginTop: "4px" }}>
            ₹{((stats.outstandingLoanAmount || 1892400) / 100000).toFixed(1)} Lakhs
          </div>
          <span style={{ fontSize: "11px", color: "#F59E0B" }}>Active EMI loan book</span>
        </div>
      </div>

      {/* Breakdown by Loan Type Chart */}
      <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "20px", marginBottom: "28px" }}>
        <h3 style={{ fontSize: "16px", color: "#FFFFFF", fontWeight: "700", marginBottom: "4px" }}>Loan Application & Disbursement Breakdown</h3>
        <p style={{ fontSize: "12px", color: "var(--secondary-text)", marginBottom: "16px" }}>Distribution across Personal, Business, Home, Vehicle, Gold & Education loans</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          {(charts.byType || []).map((t, idx) => (
            <div key={idx} style={{ background: "#071426", padding: "14px", borderRadius: "10px", border: "1px solid rgba(23, 56, 93, 0.5)" }}>
              <div style={{ fontSize: "12px", color: "var(--secondary-text)", fontWeight: "600" }}>{t.type}</div>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#FFFFFF", marginTop: "4px" }}>{t.count} Apps</div>
              <div style={{ fontSize: "12px", color: "#00D5FF", marginTop: "2px" }}>₹{(t.disbursed / 100000).toFixed(1)}L Disbursed</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Applications List */}
      <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "16px", color: "#FFFFFF", fontWeight: "700" }}>Recent Loan Applications</h3>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate("Loan Applications")}
            style={{ background: "transparent", border: "none", color: "var(--cyan-highlight)", fontSize: "12.5px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
          >
            Open All Applications <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {recentApps.map((a) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "#071426",
                border: "1px solid var(--border-color)",
                borderRadius: "10px"
              }}
            >
              <div>
                <span style={{ fontSize: "11px", color: "var(--cyan-highlight)", fontWeight: "700" }}>{a.application_reference}</span>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#FFFFFF" }}>{a.applicant_name}</div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>{a.loan_type} • Lender: {a.lender_name} • {a.tenure_months} Mo</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "15px", fontWeight: "800", color: "#00D5FF" }}>₹{Number(a.requested_amount).toLocaleString("en-IN")}</div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    display: "inline-block",
                    marginTop: "4px",
                    background: a.application_status === "Disbursed" ? "rgba(0, 229, 153, 0.15)" : a.application_status === "Approved" ? "rgba(8, 123, 255, 0.15)" : "rgba(245, 158, 11, 0.15)",
                    color: a.application_status === "Disbursed" ? "#00E599" : a.application_status === "Approved" ? "#00D5FF" : "#F59E0B"
                  }}
                >
                  {a.application_status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
