import React, { useState, useEffect } from "react";
import {
  Building2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck
} from "lucide-react";
import wealthService from "../../services/wealthService";

export default function LenderPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPartners = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await wealthService.getLenderPartners();
      if (res?.success) {
        setPartners(res.partners || []);
      } else {
        setError(res?.message || "Failed to load lender partners");
      }
    } catch (err) {
      setError(err?.message || "Error connecting to partner services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  return (
    <div className="dashboard-content">
      {/* Page Heading */}
      <div className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "-0.5px" }}>
            Lender Partner Management
          </h1>
          <p style={{ color: "var(--secondary-text)", fontSize: "13.5px", marginTop: "4px" }}>
            Manage commercial bank syndications, NBFC institutional lines, API connectivity, and loan disbursement performance.
          </p>
        </div>
        <button
          type="button"
          className="refresh-btn"
          onClick={fetchPartners}
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

      {/* Partners Table Card */}
      <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#071426", borderBottom: "1px solid var(--border-color)", color: "var(--secondary-text)" }}>
                <th style={{ padding: "12px 16px" }}>Partner ID</th>
                <th style={{ padding: "12px 16px" }}>Lender Institution Name</th>
                <th style={{ padding: "12px 16px" }}>Regulatory Type</th>
                <th style={{ padding: "12px 16px" }}>API Switch Status</th>
                <th style={{ padding: "12px 16px" }}>Integration Protocol</th>
                <th style={{ padding: "12px 16px" }}>Active Schemes</th>
                <th style={{ padding: "12px 16px" }}>Disbursement Success Rate</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "var(--secondary-text)" }}>
                    <RefreshCw size={20} className="spin" style={{ margin: "0 auto 10px" }} />
                    Loading lender partners...
                  </td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "var(--secondary-text)" }}>
                    No lender partners configured.
                  </td>
                </tr>
              ) : (
                partners.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid rgba(23, 56, 93, 0.5)" }}>
                    <td style={{ padding: "14px 16px", color: "var(--cyan-highlight)", fontWeight: "700" }}>
                      {p.partner_id}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: "700", color: "#FFFFFF" }}>{p.lender_name}</div>
                      <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Last Ping: {p.last_sync_at?.slice(0, 16) || "Active"}</div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--secondary-text)" }}>
                      {p.partner_type}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background: p.api_status === "Online" ? "rgba(0, 229, 153, 0.15)" : "rgba(245, 158, 11, 0.15)",
                          color: p.api_status === "Online" ? "#00E599" : "#F59E0B"
                        }}
                      >
                        ● {p.api_status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#FFFFFF", fontSize: "12px" }}>
                      {p.integration_type}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: "700", color: "#00D5FF" }}>
                      {p.active_products_count} Products
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: "700", color: "#00E599" }}>
                      {p.success_rate}%
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "3px 8px",
                          borderRadius: "999px",
                          background: p.status === "active" ? "rgba(0, 229, 153, 0.15)" : "rgba(107, 135, 168, 0.15)",
                          color: p.status === "active" ? "#00E599" : "#6B87A8",
                          textTransform: "uppercase"
                        }}
                      >
                        {p.status}
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
