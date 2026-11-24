import React, { useState, useEffect } from "react";
import {
  History,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Search,
  Gauge
} from "lucide-react";
import wealthService from "../../services/wealthService";

export default function ScoreHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await wealthService.getCreditScoreHistory();
      if (res?.success) {
        setHistory(res.history || []);
      } else {
        setError(res?.message || "Failed to load score history");
      }
    } catch (err) {
      setError(err?.message || "Error connecting to credit history service");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(h =>
    h.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    h.credit_bureau?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-content">
      {/* Page Heading */}
      <div className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "-0.5px" }}>
            Credit Score History & Tracking
          </h1>
          <p style={{ color: "var(--secondary-text)", fontSize: "13.5px", marginTop: "4px" }}>
            Longitudinal credit score tracking across cycles, bureau score deltas, and repayment trajectory monitoring.
          </p>
        </div>
        <button
          type="button"
          className="refresh-btn"
          onClick={fetchHistory}
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
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh History
        </button>
      </div>

      {error && (
        <div style={{ background: "rgba(255, 77, 77, 0.12)", border: "1px solid rgba(255, 77, 77, 0.3)", padding: "14px 18px", borderRadius: "10px", color: "#FF6B6B", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {/* Search Input */}
      <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "14px", marginBottom: "20px", maxWidth: "400px" }}>
        <div style={{ position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted-text)" }} />
          <input
            type="text"
            placeholder="Search by Customer Name or Bureau..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              background: "#071426",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              padding: "8px 12px 8px 36px",
              color: "#FFFFFF",
              fontSize: "13px",
              outline: "none"
            }}
          />
        </div>
      </div>

      {/* History Table Card */}
      <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#071426", borderBottom: "1px solid var(--border-color)", color: "var(--secondary-text)" }}>
                <th style={{ padding: "12px 16px" }}>Record #</th>
                <th style={{ padding: "12px 16px" }}>Borrower Name</th>
                <th style={{ padding: "12px 16px" }}>Credit Bureau</th>
                <th style={{ padding: "12px 16px" }}>Previous Score</th>
                <th style={{ padding: "12px 16px" }}>Current Score</th>
                <th style={{ padding: "12px 16px" }}>Score Delta</th>
                <th style={{ padding: "12px 16px" }}>Report Date</th>
                <th style={{ padding: "12px 16px" }}>Trajectory</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "var(--secondary-text)" }}>
                    <RefreshCw size={20} className="spin" style={{ margin: "0 auto 10px" }} />
                    Loading historical score entries...
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "var(--secondary-text)" }}>
                    No historical score records found.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((h) => (
                  <tr key={h.id} style={{ borderBottom: "1px solid rgba(23, 56, 93, 0.5)" }}>
                    <td style={{ padding: "14px 16px", color: "var(--cyan-highlight)", fontWeight: "700" }}>
                      #HST-{h.id}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: "700", color: "#FFFFFF" }}>
                      {h.customer_name}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: "11px", background: "rgba(8, 123, 255, 0.12)", color: "#00D5FF", padding: "3px 8px", borderRadius: "4px" }}>
                        {h.credit_bureau}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--secondary-text)", fontWeight: "600" }}>
                      {h.previous_score}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: "800", color: "#FFFFFF", fontSize: "15px" }}>
                      {h.current_score}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "700",
                          color: h.score_change > 0 ? "#00E599" : h.score_change < 0 ? "#FF6B6B" : "#A9BDD7",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        {h.score_change > 0 ? <ArrowUpRight size={14} /> : h.score_change < 0 ? <ArrowDownRight size={14} /> : null}
                        {h.score_change > 0 ? `+${h.score_change} pts` : `${h.score_change} pts`}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--secondary-text)" }}>
                      {h.report_date}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background: h.score_change >= 0 ? "rgba(0, 229, 153, 0.15)" : "rgba(255, 77, 77, 0.15)",
                          color: h.score_change >= 0 ? "#00E599" : "#FF6B6B"
                        }}
                      >
                        {h.score_change > 0 ? "Improving" : h.score_change < 0 ? "Declining" : "Stable"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
