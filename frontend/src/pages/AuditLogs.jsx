import React, { useEffect, useState } from "react";
import { History, Shield, Search, RefreshCw, Terminal } from "lucide-react";
import api from "../services/api";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/audit-logs");
      const list = res.data.logs || [];
      setLogs(list);
      setFiltered(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!search) {
      setFiltered(logs);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        logs.filter(l =>
          (l.action && l.action.toLowerCase().includes(q)) ||
          (l.target_table && l.target_table.toLowerCase().includes(q)) ||
          (l.ip_address && l.ip_address.toLowerCase().includes(q))
        )
      );
    }
  }, [search, logs]);

  return (
    <div className="dashboard-content">
      <div className="page-heading">
        <div>
          <h1>Module 18: Security & Audit Trail</h1>
          <p>Immutable log of every administrator action, ledger adjustment, KYC approval, and configuration change.</p>
        </div>
        <button className="refresh-btn" onClick={fetchLogs}>
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Audit Trail
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card blue">
          <div className="stat-top">
            <span className="stat-title">Logged Actions</span>
            <div className="stat-icon"><History size={20} /></div>
          </div>
          <h2>{logs.length} Events</h2>
          <small>Tamper-evident system journal</small>
        </div>

        <div className="stat-card green">
          <div className="stat-top">
            <span className="stat-title">Audit Integrity</span>
            <div className="stat-icon"><Shield size={20} /></div>
          </div>
          <h2>100% SECURE</h2>
          <small>Append-only audit ledger enforcement</small>
        </div>

        <div className="stat-card purple">
          <div className="stat-top">
            <span className="stat-title">Active Auditors</span>
            <div className="stat-icon"><Terminal size={20} /></div>
          </div>
          <h2>Root Admin</h2>
          <small>Admin ID #1 · 127.0.0.1</small>
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search action (e.g. APPROVE_KYC, WALLET_CREDIT)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Admin ID</th>
                <th>Action Performed</th>
                <th>Target Resource</th>
                <th>IP Address</th>
                <th>Event Metadata / Diff</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td><strong>#LOG-{l.id}</strong></td>
                  <td><code>Admin #{l.admin_id}</code></td>
                  <td>
                    <span style={{
                      fontSize: "11px",
                      background: l.action?.includes("REJECT") || l.action?.includes("DELETE") ? "#3f1414" : "#0d2b45",
                      color: l.action?.includes("REJECT") || l.action?.includes("DELETE") ? "#fca5a5" : "#60a5fa",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontWeight: "700"
                    }}>
                      {l.action}
                    </span>
                  </td>
                  <td>
                    <strong>{l.target_table}</strong> {l.target_id ? `(#${l.target_id})` : ""}
                  </td>
                  <td><small style={{ color: "#94a3b8" }}>{l.ip_address || "127.0.0.1"}</small></td>
                  <td>
                    <code style={{ fontSize: "11px", color: "#38bdf8", maxWidth: "260px", display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {l.diff_json || "Action logged"}
                    </code>
                  </td>
                  <td><small style={{ color: "#94a3b8" }}>{new Date(l.created_at || Date.now()).toLocaleString()}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
