import React, { useEffect, useState } from "react";
import { Wallet, ArrowUpRight, ArrowDownLeft, Search, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import api from "../services/api";

export default function WalletManagement() {
  const [wallets, setWallets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [adjustModal, setAdjustModal] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ type: "credit", amount: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/wallets");
      const list = res.data.wallets || [];
      setWallets(list);
      setFiltered(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  useEffect(() => {
    if (!search) {
      setFiltered(wallets);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        wallets.filter(w =>
          (w.full_name && w.full_name.toLowerCase().includes(q)) ||
          (w.email && w.email.toLowerCase().includes(q)) ||
          (w.phone && w.phone.toLowerCase().includes(q))
        )
      );
    }
  }, [search, wallets]);

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!adjustModal) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await api.post("/admin/wallets/adjust", {
        wallet_id: adjustModal.id,
        type: adjustForm.type,
        amount: Number(adjustForm.amount),
        description: adjustForm.description
      });
      if (res.data.success) {
        setFeedback({ type: "success", text: res.data.message });
        setAdjustModal(null);
        setAdjustForm({ type: "credit", amount: "", description: "" });
        fetchWallets();
      }
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.message || "Adjustment failed." });
    } finally {
      setSubmitting(false);
    }
  };

  const totalFloat = wallets.reduce((acc, w) => acc + Number(w.available_balance || 0), 0);

  return (
    <div className="dashboard-content">
      <div className="page-heading">
        <div>
          <h1>Module 6: Wallet Management</h1>
          <p>Monitor platform escrow float, inspect individual balances, and perform authorized manual credit/debit adjustments.</p>
        </div>
        <button className="refresh-btn" onClick={fetchWallets}>
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Wallets
        </button>
      </div>

      {feedback && (
        <div style={{
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "18px",
          background: feedback.type === "success" ? "#0b3d20" : "#3d1010",
          border: `1px solid ${feedback.type === "success" ? "#1b8744" : "#a82424"}`,
          color: feedback.type === "success" ? "#75f0a0" : "#ff9e9e"
        }}>
          {feedback.text}
        </div>
      )}

      {/* KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card blue">
          <div className="stat-top">
            <span className="stat-title">Total Escrow Float</span>
            <div className="stat-icon"><Wallet size={20} /></div>
          </div>
          <h2>₹{totalFloat.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
          <small>Backed by RBI Escrow Account</small>
        </div>

        <div className="stat-card green">
          <div className="stat-top">
            <span className="stat-title">Active Wallets</span>
            <div className="stat-icon"><CheckCircle size={20} /></div>
          </div>
          <h2>{wallets.length}</h2>
          <small>100% compliant with KYC thresholds</small>
        </div>

        <div className="stat-card purple">
          <div className="stat-top">
            <span className="stat-title">Max Allowed Float</span>
            <div className="stat-icon"><ArrowUpRight size={20} /></div>
          </div>
          <h2>₹1,00,000.00</h2>
          <small>Per full-KYC verified account</small>
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search user, phone or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Wallet ID</th>
                <th>Account Holder</th>
                <th>Contact</th>
                <th>Available Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => (
                <tr key={w.id}>
                  <td><strong>#WAL-{w.id}</strong></td>
                  <td>
                    <strong>{w.full_name || `User #${w.user_id}`}</strong>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>User ID: #{w.user_id}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: "12px" }}>{w.email}</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>{w.phone}</div>
                  </td>
                  <td>
                    <strong style={{ fontSize: "15px", color: "#38bdf8" }}>
                      ₹{Number(w.available_balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </strong>
                  </td>
                  <td>
                    <span className="badge-pill active">ACTIVE</span>
                  </td>
                  <td>
                    <button
                      onClick={() => setAdjustModal(w)}
                      style={{
                        background: "#087cff",
                        color: "#fff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      Credit / Debit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjustment Modal */}
      {adjustModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "grid", placeItems: "center", zIndex: 999
        }}>
          <div className="table-card" style={{ width: "480px", padding: "24px", background: "#0b1528", border: "1px solid #1f3557" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Wallet size={20} color="#087cff" /> Manual Wallet Adjustment
            </h3>

            <div style={{ background: "#050e1c", padding: "14px", borderRadius: "8px", border: "1px solid #142847", marginBottom: "16px" }}>
              <p style={{ fontSize: "13px" }}>Account: <strong>{adjustModal.full_name}</strong> (#{adjustModal.user_id})</p>
              <p style={{ fontSize: "13px", marginTop: "4px" }}>
                Current Balance: <strong style={{ color: "#38bdf8" }}>₹{Number(adjustModal.available_balance).toFixed(2)}</strong>
              </p>
            </div>

            <form onSubmit={handleAdjust} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="form-group">
                <label>Operation Type</label>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, type: "credit" })}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "6px",
                      border: "none",
                      background: adjustForm.type === "credit" ? "#15803d" : "#0d1f38",
                      color: "#fff",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <ArrowDownLeft size={16} /> Credit (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, type: "debit" })}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "6px",
                      border: "none",
                      background: adjustForm.type === "debit" ? "#b91c1c" : "#0d1f38",
                      color: "#fff",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <ArrowUpRight size={16} /> Debit (-)
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Adjustment Amount (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={adjustForm.amount}
                  onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                  required
                  placeholder="e.g. 500.00"
                />
              </div>

              <div className="form-group">
                <label>Reason / Audit Description</label>
                <input
                  type="text"
                  value={adjustForm.description}
                  onChange={(e) => setAdjustForm({ ...adjustForm, description: e.target.value })}
                  required
                  placeholder="e.g. Customer grievance cashback / Chargeback recovery"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button type="button" className="btn-cancel" onClick={() => setAdjustModal(null)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting ? "Processing..." : `Execute ${adjustForm.type.toUpperCase()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
