import React, { useEffect, useState } from "react";
import { UserCog, Plus, Trash2, Shield, Check, RefreshCw, KeyRound, AlertCircle } from "lucide-react";
import api from "../services/api";

export default function AdminUsers() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "", role_name: "manager" });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/admins");
      setAdmins(res.data.admins || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await api.post("/admin/admins", newAdmin);
      if (res.data.success) {
        setFeedback({ type: "success", text: "New admin user added successfully!" });
        setShowModal(false);
        setNewAdmin({ name: "", email: "", password: "", role_name: "manager" });
        fetchAdmins();
      }
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.message || "Failed to create admin." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this admin?")) return;
    try {
      const res = await api.delete(`/admin/admins/${id}`);
      if (res.data.success) {
        setFeedback({ type: "success", text: "Admin removed successfully." });
        fetchAdmins();
      }
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.message || "Failed to remove admin." });
    }
  };

  return (
    <div className="dashboard-content">
      <div className="page-heading">
        <div>
          <h1>Module 3: Admin Users & Roles</h1>
          <p>Create administrators, manage role-based access control (RBAC), and assign granular system permissions.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="refresh-btn" onClick={fetchAdmins}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
          <button className="btn-save" onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Plus size={16} /> Add Admin User
          </button>
        </div>
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

      {/* Role Permission Summary */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card blue">
          <div className="stat-top">
            <span className="stat-title">Superadmin</span>
            <div className="stat-icon"><Shield size={20} /></div>
          </div>
          <h2>Full Access</h2>
          <small>System config, ledger adjustment, user delete</small>
        </div>

        <div className="stat-card green">
          <div className="stat-top">
            <span className="stat-title">Manager</span>
            <div className="stat-icon"><UserCog size={20} /></div>
          </div>
          <h2>Ops Control</h2>
          <small>Approve KYC, resolve disputes, commissions</small>
        </div>

        <div className="stat-card purple">
          <div className="stat-top">
            <span className="stat-title">Compliance</span>
            <div className="stat-icon"><KeyRound size={20} /></div>
          </div>
          <h2>Auditor</h2>
          <small>KYC review queue, dispute audit logs</small>
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-toolbar" style={{ justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700" }}>System Administrators ({admins.length})</h3>
        </div>

        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((adm) => (
                <tr key={adm.id}>
                  <td><strong>#{adm.id}</strong></td>
                  <td>{adm.name}</td>
                  <td>{adm.email}</td>
                  <td>
                    <span className={`status-badge ${adm.role_name === "superadmin" ? "active" : ""}`} style={{ textTransform: "uppercase" }}>
                      {adm.role_name}
                    </span>
                  </td>
                  <td>
                    <span className="badge-pill active">
                      <Check size={12} /> {adm.status || "active"}
                    </span>
                  </td>
                  <td>
                    {adm.id === 1 ? (
                      <span style={{ fontSize: "12px", color: "#64748b" }}>Root Admin</span>
                    ) : (
                      <button
                        onClick={() => handleDelete(adm.id)}
                        style={{ background: "#7f1d1d", color: "#fca5a5", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "grid", placeItems: "center", zIndex: 999
        }}>
          <div className="table-card" style={{ width: "450px", padding: "24px", background: "#0b1528", border: "1px solid #1f3557" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px" }}>Create New Administrator</h3>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  required
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>

              <div className="form-group">
                <label>Admin Email</label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  required
                  placeholder="ramesh@apnapay.com"
                />
              </div>

              <div className="form-group">
                <label>Temporary Password</label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  required
                  placeholder="••••••••"
                />
              </div>

              <div className="form-group">
                <label>Assigned Role</label>
                <select
                  value={newAdmin.role_name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role_name: e.target.value })}
                  style={{
                    background: "#08152b",
                    border: "1px solid #1c3257",
                    color: "#e2ecff",
                    padding: "10px 14px",
                    borderRadius: "7px",
                    fontSize: "13px"
                  }}
                >
                  <option value="manager">Manager (Operations & KYC)</option>
                  <option value="compliance">Compliance Officer (Audit & Verification)</option>
                  <option value="support">Support Specialist (Disputes & View Only)</option>
                  <option value="superadmin">Super Administrator (Full System Access)</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting ? "Saving..." : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
