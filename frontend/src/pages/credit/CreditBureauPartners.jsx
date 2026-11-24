import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Activity,
  Layers,
  ArrowUpRight
} from "lucide-react";
import wealthService from "../../services/wealthService";

export default function CreditBureauPartners() {
  const [bureaus, setBureaus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBureaus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await wealthService.getCreditBureauPartners();
      if (res?.success) {
        setBureaus(res.bureaus || []);
      } else {
        setError(res?.message || "Failed to load bureau partners");
      }
    } catch (err) {
      setError(err?.message || "Error connecting to bureau service");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBureaus();
  }, []);

  return (
    <div className="dashboard-content">
      {/* Page Heading */}
      <div className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "-0.5px" }}>
            Credit Bureau Partners
          </h1>
          <p style={{ color: "var(--secondary-text)", fontSize: "13.5px", marginTop: "4px" }}>
            Direct API connectivity with India's 4 authorized credit information companies (CIBIL, Experian, CRIF & Equifax).
          </p>
        </div>
        <button
          type="button"
          className="refresh-btn"
          onClick={fetchBureaus}
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

      {/* 4 Bureau Gateway Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {bureaus.map((b) => (
          <div key={b.id} style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--cyan-highlight)", background: "rgba(0, 213, 255, 0.12)", padding: "3px 6px", borderRadius: "4px" }}>
                  CIC LICENSED
                </span>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#FFFFFF", marginTop: "4px" }}>{b.bureau_name}</h3>
              </div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#00E599", background: "rgba(0, 229, 153, 0.15)", padding: "3px 8px", borderRadius: "4px" }}>
                ● {b.api_status}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "#071426", padding: "12px", borderRadius: "8px", marginTop: "14px" }}>
              <div>
                <div style={{ fontSize: "10.5px", color: "var(--secondary-text)" }}>Total Queries</div>
                <div style={{ fontSize: "14px", fontWeight: "800", color: "#FFFFFF" }}>{b.total_queries?.toLocaleString() || "3,000+"}</div>
              </div>
              <div>
                <div style={{ fontSize: "10.5px", color: "var(--secondary-text)" }}>Gateway SLA</div>
                <div style={{ fontSize: "14px", fontWeight: "800", color: "#00E599" }}>{b.success_rate}%</div>
              </div>
            </div>

            <div style={{ fontSize: "11px", color: "var(--secondary-text)", marginTop: "12px", display: "flex", justifyContent: "space-between" }}>
              <span>Code: <code>{b.bureau_code}</code></span>
              <span>Encrypted TLS 1.3</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
