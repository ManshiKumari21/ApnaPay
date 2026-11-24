import React, { useState, useEffect } from "react";
import {
  Building2,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  Layers,
  ShieldCheck,
  TrendingUp,
  Landmark,
  Gauge
} from "lucide-react";
import wealthService from "../../services/wealthService";

export default function PartnerManagement({ onNavigate, isCustomer = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("All");

  const fetchPartners = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await wealthService.getUnifiedPartners();
      if (res?.success) {
        setData(res);
      } else {
        setError(res?.message || "Failed to load institutional partners");
      }
    } catch (err) {
      setError(err?.message || "Error connecting to partner gateway");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const stats = data?.stats || {};
  const partners = data?.partners || [];

  const filteredPartners = activeTab === "All"
    ? partners
    : partners.filter(p => p.type.toLowerCase().includes(activeTab.toLowerCase()));

  return (
    <div className="dashboard-content">
      {/* Page Heading */}
      <div className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "-0.5px" }}>
            {isCustomer ? "Authorized Fund Houses & Partners" : "Institutional Partner Management"}
          </h1>
          <p style={{ color: "var(--secondary-text)", fontSize: "13.5px", marginTop: "4px" }}>
            {isCustomer
              ? "SEBI-regulated Asset Management Companies (AMCs), Registrar & Transfer Agents (CAMS, KFintech), and Lending Partners."
              : "Unified directory of AMC mutual fund houses, RTAs (CAMS, KFin), Scheduled Commercial Banks, NBFCs, and Credit Bureaus."}
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
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Status
        </button>
      </div>

      {error && (
        <div style={{ background: "rgba(255, 77, 77, 0.12)", border: "1px solid rgba(255, 77, 77, 0.3)", padding: "14px 18px", borderRadius: "10px", color: "#FF6B6B", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {/* 4 Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Total Partners</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", marginTop: "4px" }}>{stats.totalPartners || partners.length}</div>
          <span style={{ fontSize: "11px", color: "var(--cyan-highlight)" }}>{stats.onlineCount || 16} currently online</span>
        </div>

        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>AMCs & RTAs</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#00D5FF", marginTop: "4px" }}>{(stats.amcCount || 5) + (stats.rtaCount || 2)}</div>
          <span style={{ fontSize: "11px", color: "var(--secondary-text)" }}>BSE StAR MF & CAMS connected</span>
        </div>

        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Lending Banks / NBFCs</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#00E599", marginTop: "4px" }}>{stats.lenderCount || 6}</div>
          <span style={{ fontSize: "11px", color: "#00E599" }}>Credit lines sanctioned</span>
        </div>

        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Credit Bureaus</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#F59E0B", marginTop: "4px" }}>{stats.bureauCount || 4}</div>
          <span style={{ fontSize: "11px", color: "var(--secondary-text)" }}>CIBIL, Experian, CRIF, Equifax</span>
        </div>
      </div>

      {/* Tabs Filter */}
      <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid var(--border-color)", marginBottom: "20px" }}>
        {[
          { key: "All", label: "All Institutional Partners" },
          { key: "AMC", label: "AMC Mutual Funds" },
          { key: "RTA", label: "RTA Platforms" },
          { key: "Bank", label: "Lending Banks" },
          { key: "Bureau", label: "Credit Bureaus" }
        ].map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: activeTab === t.key ? "3px solid #087BFF" : "3px solid transparent",
              color: activeTab === t.key ? "#FFFFFF" : "var(--secondary-text)",
              padding: "10px 16px",
              fontSize: "13.5px",
              fontWeight: activeTab === t.key ? "700" : "500",
              cursor: "pointer"
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Partners Table Card */}
      <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#071426", borderBottom: "1px solid var(--border-color)", color: "var(--secondary-text)" }}>
                <th style={{ padding: "12px 16px" }}>Partner ID</th>
                <th style={{ padding: "12px 16px" }}>Institution Name</th>
                <th style={{ padding: "12px 16px" }}>Category Type</th>
                <th style={{ padding: "12px 16px" }}>API Status</th>
                <th style={{ padding: "12px 16px" }}>Integration Route</th>
                <th style={{ padding: "12px 16px" }}>Last Successful Sync</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPartners.map((p, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid rgba(23, 56, 93, 0.5)" }}>
                  <td style={{ padding: "14px 16px", color: "var(--cyan-highlight)", fontWeight: "700" }}>{p.id}</td>
                  <td style={{ padding: "14px 16px", fontWeight: "700", color: "#FFFFFF" }}>{p.name}</td>
                  <td style={{ padding: "14px 16px", color: "var(--secondary-text)" }}>{p.type}</td>
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
                  <td style={{ padding: "14px 16px", color: "#FFFFFF", fontSize: "12px" }}>{p.integration_status}</td>
                  <td style={{ padding: "14px 16px", color: "var(--secondary-text)" }}>{p.last_sync?.slice(0, 16) || "Active"}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "999px", background: "rgba(0, 229, 153, 0.15)", color: "#00E599", textTransform: "uppercase" }}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
