import React, { useEffect, useState } from "react";
import { Percent, Edit2, CheckCircle2, RefreshCw, Sliders, DollarSign } from "lucide-react";
import api from "../services/api";

export default function CommissionManagement() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/commission");
      setRules(res.data.rules || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingRule) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await api.put(`/admin/commission/${editingRule.id}`, {
        commission_value: Number(editVal)
      });
      if (res.data.success) {
        setFeedback({ type: "success", text: `Commission rule for ${editingRule.service_name} updated!` });
        setEditingRule(null);
        fetchRules();
      }
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.message || "Failed to update commission." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="page-heading">
        <div>
          <h1>Module 14: Commission & Charges Management</h1>
          <p>Configure platform revenue margins, operator surcharges, and interchange fees across all payment services.</p>
        </div>
        <button className="refresh-btn" onClick={fetchRules}>
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Rules
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
            <span className="stat-title">Configured Rules</span>
            <div className="stat-icon"><Sliders size={20} /></div>
          </div>
          <h2>{rules.length} Services</h2>
          <small>Dynamic margin calculation engine</small>
        </div>

        <div className="stat-card green">
          <div className="stat-top">
            <span className="stat-title">Telecom Margin</span>
            <div className="stat-icon"><Percent size={20} /></div>
          </div>
          <h2>2.50%</h2>
          <small>Highest operator revenue tier</small>
        </div>

        <div className="stat-card purple">
          <div className="stat-top">
            <span className="stat-title">Payout Charge</span>
            <div className="stat-icon"><DollarSign size={20} /></div>
          </div>
          <h2>1.50% IMPS</h2>
          <small>Instant Bank Settlement Fee</small>
        </div>
      </div>

      {/* Commission Rules Table */}
      <div className="table-card">
        <div className="table-toolbar">
          <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Service Commission & Surcharge Master Rules</h3>
        </div>

        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Service Code</th>
                <th>Charge Type</th>
                <th>Commission Rate</th>
                <th>Slab Range</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.service_name}</strong></td>
                  <td><code>{r.service_code}</code></td>
                  <td style={{ textTransform: "capitalize" }}>{r.commission_type}</td>
                  <td>
                    <strong style={{ color: "#34d399", fontSize: "15px" }}>
                      {r.commission_type === "percentage" ? `${Number(r.commission_value).toFixed(2)}%` : `₹${Number(r.commission_value).toFixed(2)}`}
                    </strong>
                  </td>
                  <td><small style={{ color: "#94a3b8" }}>₹{r.min_amount} - ₹{r.max_amount}</small></td>
                  <td>
                    <span className="badge-pill active">ACTIVE</span>
                  </td>
                  <td>
                    <button
                      onClick={() => { setEditingRule(r); setEditVal(r.commission_value); }}
                      style={{
                        background: "#0c2340",
                        color: "#60a5fa",
                        border: "1px solid #1c3d69",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Commission Modal */}
      {editingRule && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "grid", placeItems: "center", zIndex: 999
        }}>
          <div className="table-card" style={{ width: "450px", padding: "24px", background: "#0b1528", border: "1px solid #1f3557" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Percent size={20} color="#087cff" /> Edit Commission Rate
            </h3>

            <div style={{ background: "#050e1c", padding: "14px", borderRadius: "8px", border: "1px solid #142847", marginBottom: "16px", fontSize: "13px" }}>
              <p>Service: <strong>{editingRule.service_name}</strong></p>
              <p style={{ marginTop: "4px" }}>Type: <strong style={{ textTransform: "capitalize" }}>{editingRule.commission_type}</strong></p>
            </div>

            <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="form-group">
                <label>
                  {editingRule.commission_type === "percentage" ? "Commission Percentage (%)" : "Flat Fee (INR)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button type="button" className="btn-cancel" onClick={() => setEditingRule(null)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? "Saving..." : "Update Rate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
