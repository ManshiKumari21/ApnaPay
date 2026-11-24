import React, { useEffect, useState } from "react";
import { ArrowLeftRight, CheckCircle2, Clock, XCircle, Search, Filter, RefreshCw, Eye } from "lucide-react";
import api from "../services/api";

export default function TransactionManagement() {
  const [transactions, setTransactions] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTxn, setSelectedTxn] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/transactions?status=${statusFilter}&search=${encodeURIComponent(search)}`);
      setTransactions(res.data.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

  const totalVolume = transactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const successCount = transactions.filter(t => t.status === "SUCCESS").length;

  return (
    <div className="dashboard-content">
      <div className="page-heading">
        <div>
          <h1>Module 7: Transaction Management</h1>
          <p>Real-time audit log of all financial movements, UPI transfers, utility payments, and wallet ledger updates.</p>
        </div>
        <button className="refresh-btn" onClick={fetchTransactions}>
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Records
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card blue">
          <div className="stat-top">
            <span className="stat-title">Visible Volume</span>
            <div className="stat-icon"><ArrowLeftRight size={20} /></div>
          </div>
          <h2>₹{totalVolume.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
          <small>{transactions.length} transactions processed</small>
        </div>

        <div className="stat-card green">
          <div className="stat-top">
            <span className="stat-title">Success Rate</span>
            <div className="stat-icon"><CheckCircle2 size={20} /></div>
          </div>
          <h2>{transactions.length > 0 ? ((successCount / transactions.length) * 100).toFixed(1) : 0}%</h2>
          <small>NPCI / Banking gateway SLA compliant</small>
        </div>

        <div className="stat-card purple">
          <div className="stat-top">
            <span className="stat-title">Avg Ticket Size</span>
            <div className="stat-icon"><Clock size={20} /></div>
          </div>
          <h2>₹{transactions.length > 0 ? (totalVolume / transactions.length).toFixed(2) : "0.00"}</h2>
          <small>Across P2P, Recharge, and Bills</small>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="table-card">
        <div className="table-toolbar">
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px", flex: 1, maxWidth: "450px" }}>
            <div className="search-box" style={{ flex: 1 }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search Txn ID, User, Purpose..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="refresh-btn" style={{ padding: "0 16px" }}>Search</button>
          </form>

          <div style={{ display: "flex", gap: "8px" }}>
            {["all", "SUCCESS", "PENDING", "FAILED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st ? "#087cff" : "#0d1b33",
                  color: statusFilter === st ? "#fff" : "#94a3b8",
                  border: "1px solid #1a2f52",
                  padding: "8px 14px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  cursor: "pointer"
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Txn ID</th>
                <th>User</th>
                <th>Purpose / Description</th>
                <th>Amount</th>
                <th>Reference ID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td><strong>#TXN-{t.id}</strong></td>
                  <td>
                    <strong>{t.user_name || `User #${t.user_id}`}</strong>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>User #{t.user_id}</div>
                  </td>
                  <td>{t.purpose || "Payment"}</td>
                  <td>
                    <strong style={{ fontSize: "14px", color: "#e2ecff" }}>
                      ₹{Number(t.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </strong>
                  </td>
                  <td>
                    <code style={{ fontSize: "12px", color: "#38bdf8" }}>{t.provider_transaction_id || "N/A"}</code>
                  </td>
                  <td>
                    <span className={`badge-pill ${t.status === "SUCCESS" ? "verified" : t.status === "PENDING" ? "pending" : "rejected"}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedTxn(t)}
                      style={{
                        background: "#0c2340",
                        color: "#60a5fa",
                        border: "1px solid #1c3d69",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        cursor: "pointer"
                      }}
                    >
                      <Eye size={13} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Drawer */}
      {selectedTxn && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "grid", placeItems: "center", zIndex: 999
        }}>
          <div className="table-card" style={{ width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto", padding: "24px", background: "#0b1528", border: "1px solid #1f3557", margin: "16px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <ArrowLeftRight size={20} color="#087cff" /> Transaction Receipt Details
            </h3>

            <div style={{ background: "#050e1c", padding: "16px", borderRadius: "8px", border: "1px solid #142847", display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#7a90b3" }}>Transaction ID:</span>
                <strong>#TXN-{selectedTxn.id}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#7a90b3" }}>User:</span>
                <strong>{selectedTxn.user_name || `#${selectedTxn.user_id}`}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#7a90b3" }}>Purpose:</span>
                <span>{selectedTxn.purpose}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#7a90b3" }}>Amount:</span>
                <strong style={{ color: "#38bdf8", fontSize: "16px" }}>₹{Number(selectedTxn.amount).toFixed(2)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#7a90b3" }}>Status:</span>
                <span className={`badge-pill ${selectedTxn.status === "SUCCESS" ? "verified" : selectedTxn.status === "PENDING" ? "pending" : "rejected"}`}>
                  {selectedTxn.status}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#7a90b3" }}>Provider Ref ID:</span>
                <code style={{ color: "#38bdf8" }}>{selectedTxn.provider_transaction_id || "N/A"}</code>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#7a90b3" }}>Created Timestamp:</span>
                <span>{new Date(selectedTxn.created_at || Date.now()).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "18px" }}>
              <button className="btn-save" onClick={() => setSelectedTxn(null)}>Close Window</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
