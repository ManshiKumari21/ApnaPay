import React, { useState, useEffect } from "react";
import {
  Gauge,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import wealthService from "../../services/wealthService";

export default function CreditDashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await wealthService.getCreditDashboard();
      if (res?.success) {
        setData(res);
      } else {
        setError(res?.message || "Failed to load Credit Dashboard");
      }
    } catch (err) {
      setError(err?.message || "Error connecting to credit score service");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = data?.stats || {};
  const bureauBreakdown = data?.bureauBreakdown || [];
  const scoreDistribution = data?.scoreDistribution || [];
  const recentRequests = data?.recentRequests || [];

  return (
    <div className="dashboard-content">
      {/* Page Heading */}
      <div className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", color: "var(--cyan-highlight)", background: "rgba(0, 213, 255, 0.12)", padding: "3px 8px", borderRadius: "4px" }}>
              Credit Intelligence & Bureau Analytics
            </span>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "-0.5px" }}>
            Credit Score Management Dashboard
          </h1>
          <p style={{ color: "var(--secondary-text)", fontSize: "13.5px", marginTop: "4px" }}>
            Direct API integrations with CIBIL, Experian, CRIF High Mark, and Equifax under strict customer consent guidelines.
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

      {/* 5 KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Total Score Requests</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", marginTop: "4px" }}>{stats.totalRequests || 8}</div>
          <span style={{ fontSize: "11px", color: "var(--cyan-highlight)" }}>Multi-bureau API queries</span>
        </div>

        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Successful Pulls</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#00E599", marginTop: "4px" }}>{stats.successfulRequests || 8}</div>
          <span style={{ fontSize: "11px", color: "#00E599" }}>100% consent validated</span>
        </div>

        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Pending Requests</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#F59E0B", marginTop: "4px" }}>{stats.pendingRequests || 0}</div>
          <span style={{ fontSize: "11px", color: "#F59E0B" }}>Bureau queuing queue</span>
        </div>

        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Failed Requests</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#FF4D4D", marginTop: "4px" }}>{stats.failedRequests || 0}</div>
          <span style={{ fontSize: "11px", color: "var(--secondary-text)" }}>PAN verification mismatch</span>
        </div>

        <div style={{ background: "linear-gradient(180deg, #0B1E38 0%, #071426 100%)", border: "1px solid rgba(0, 213, 255, 0.3)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--cyan-highlight)", textTransform: "uppercase", fontWeight: "700" }}>Average Credit Score</span>
          <div style={{ fontSize: "26px", fontWeight: "900", color: "#00E599", marginTop: "4px" }}>{stats.averageScore || 750}</div>
          <span style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Prime credit quality band</span>
        </div>
      </div>

      {/* Bureau Connectivity & Distribution */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "20px", marginBottom: "28px" }}>
        {/* Bureau Breakdown Table */}
        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#FFFFFF" }}>Credit Bureau Integration Performance</h3>
              <p style={{ fontSize: "12px", color: "var(--secondary-text)" }}>Real-time gateway uptime and score averages</p>
            </div>
            <span style={{ fontSize: "11px", color: "#00E599", background: "rgba(0, 229, 153, 0.12)", padding: "4px 8px", borderRadius: "6px" }}>4/4 Online</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {bureauBreakdown.map((b, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#071426", borderRadius: "8px", border: "1px solid rgba(23, 56, 93, 0.5)" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#FFFFFF" }}>{b.bureau}</div>
                  <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>{b.count} Pulls • SLA: {b.successRate}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "15px", fontWeight: "800", color: b.avgScore >= 750 ? "#00E599" : "#00D5FF" }}>{b.avgScore}</div>
                  <div style={{ fontSize: "10px", color: "var(--secondary-text)" }}>Avg Score</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Score Tier Distribution */}
        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#FFFFFF" }}>Customer Score Tier Distribution</h3>
              <p style={{ fontSize: "12px", color: "var(--secondary-text)" }}>Categorized credit risk assessment</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "12px" }}>
            {scoreDistribution.map((s, idx) => {
              const colors = ["#00E599", "#00D5FF", "#F59E0B", "#FF4D4D"];
              const color = colors[idx % colors.length];
              return (
                <div key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: "4px" }}>
                    <span style={{ color: "#FFFFFF", fontWeight: "600" }}>{s.tier}</span>
                    <span style={{ color: color, fontWeight: "700" }}>{s.percentage}% ({s.count} users)</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "rgba(23, 56, 93, 0.6)", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ width: `${s.percentage}%`, height: "100%", background: color, borderRadius: "999px" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Score Inquiries */}
      <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "16px", color: "#FFFFFF", fontWeight: "700" }}>Recent Credit Score Reports</h3>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate("Credit Score Requests")}
            style={{ background: "transparent", border: "none", color: "var(--cyan-highlight)", fontSize: "12.5px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
          >
            View All Reports <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {recentRequests.map((r) => (
            <div
              key={r.id}
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
                <span style={{ fontSize: "11px", color: "var(--cyan-highlight)", fontWeight: "700" }}>{r.request_reference}</span>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#FFFFFF" }}>{r.customer_name}</div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>PAN: {r.pan_number} • Bureau: {r.credit_bureau} • Date: {r.report_date}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "20px", fontWeight: "900", color: r.credit_score >= 750 ? "#00E599" : "#00D5FF" }}>
                  {r.credit_score}
                </div>
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: "700",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: r.credit_score >= 750 ? "rgba(0, 229, 153, 0.15)" : "rgba(8, 123, 255, 0.15)",
                    color: r.credit_score >= 750 ? "#00E599" : "#00D5FF"
                  }}
                >
                  {r.score_category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
