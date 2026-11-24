import React, { useEffect, useState } from "react";
import { Bell, Send, CheckCircle2, Users, User, RefreshCw, MessageSquare } from "lucide-react";
import api from "../services/api";

export default function NotificationsManagement() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", notification_type: "broadcast", user_id: "" });
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/notifications");
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setFeedback(null);
    try {
      const res = await api.post("/admin/notifications/broadcast", form);
      if (res.data.success) {
        setFeedback({ type: "success", text: "Notification dispatched successfully!" });
        setShowModal(false);
        setForm({ title: "", message: "", notification_type: "broadcast", user_id: "" });
        fetchNotifications();
      }
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.message || "Failed to dispatch notification." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="page-heading">
        <div>
          <h1>Module 16: Notifications & Broadcast Center</h1>
          <p>Send in-app notifications, marketing announcements, and urgent security alerts to all users or specific accounts.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="refresh-btn" onClick={fetchNotifications}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
          <button className="btn-save" onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Send size={15} /> Compose Notification
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

      {/* KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card blue">
          <div className="stat-top">
            <span className="stat-title">Dispatched Alerts</span>
            <div className="stat-icon"><Bell size={20} /></div>
          </div>
          <h2>{notifications.length} Sent</h2>
          <small>Push notifications delivered</small>
        </div>

        <div className="stat-card green">
          <div className="stat-top">
            <span className="stat-title">Broadcast Audience</span>
            <div className="stat-icon"><Users size={20} /></div>
          </div>
          <h2>ALL USERS</h2>
          <small>Instant device notification service</small>
        </div>

        <div className="stat-card purple">
          <div className="stat-top">
            <span className="stat-title">Open Rate</span>
            <div className="stat-icon"><MessageSquare size={20} /></div>
          </div>
          <h2>76.8%</h2>
          <small>Engaged customer interactions</small>
        </div>
      </div>

      {/* Sent Notifications List */}
      <div className="table-card">
        <div className="table-toolbar">
          <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Notification Broadcast History</h3>
        </div>

        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Message Content</th>
                <th>Target</th>
                <th>Channel</th>
                <th>Sent Date</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr key={n.id}>
                  <td><strong>#{n.id}</strong></td>
                  <td><strong>{n.title}</strong></td>
                  <td style={{ maxWidth: "340px", fontSize: "13px", color: "#cbd5e1" }}>{n.message}</td>
                  <td>
                    <span style={{ fontSize: "11px", background: "#132847", padding: "4px 8px", borderRadius: "4px", color: "#60a5fa" }}>
                      {n.user_id ? `User #${n.user_id}` : "ALL USERS"}
                    </span>
                  </td>
                  <td>
                    <span className="badge-pill active">
                      {n.notification_type ? n.notification_type.toUpperCase() : "PUSH"}
                    </span>
                  </td>
                  <td><small style={{ color: "#94a3b8" }}>{new Date(n.created_at || Date.now()).toLocaleDateString()}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compose Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "grid", placeItems: "center", zIndex: 999
        }}>
          <div className="table-card" style={{ width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto", padding: "24px", background: "#0b1528", border: "1px solid #1f3557", margin: "16px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Send size={20} color="#087cff" /> Compose In-App Broadcast
            </h3>

            <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="form-group">
                <label>Target Audience</label>
                <select
                  value={form.notification_type}
                  onChange={(e) => setForm({ ...form, notification_type: e.target.value })}
                  style={{
                    background: "#08152b",
                    border: "1px solid #1c3257",
                    color: "#e2ecff",
                    padding: "10px 14px",
                    borderRadius: "7px",
                    fontSize: "13px"
                  }}
                >
                  <option value="broadcast">Broadcast to All Users</option>
                  <option value="user_specific">Target Specific User ID</option>
                </select>
              </div>

              {form.notification_type === "user_specific" && (
                <div className="form-group">
                  <label>Target User ID</label>
                  <input
                    type="number"
                    value={form.user_id}
                    onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                    required
                    placeholder="e.g. 101"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Notification Headline / Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="e.g. ₹50 Instant Cashback on UPI Bill Payment"
                />
              </div>

              <div className="form-group">
                <label>Notification Message Body</label>
                <textarea
                  rows="3"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  placeholder="Enter alert text sent to customer smartphones..."
                  style={{
                    width: "100%",
                    background: "#08152b",
                    border: "1px solid #1c3257",
                    color: "#e2ecff",
                    padding: "10px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontFamily: "inherit"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={sending}>
                  {sending ? "Sending..." : "Dispatch Broadcast"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
