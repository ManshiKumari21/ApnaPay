
import React, { useState } from "react";
import { Lock, KeyRound, Shield, CheckCircle, AlertTriangle, LogOut, UserCheck } from "lucide-react";
import api from "../services/api";

export default function AdminAuth() {
  const [email, setEmail] = useState("admin@apnapay.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [session, setSession] = useState({
    loggedIn: true,
    name: "Super Administrator",
    email: "admin@apnapay.com",
    role: "superadmin",
    token: "admin_tok_live_active_session"
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post("/admin/auth/login", { email, password });
      if (res.data.success) {
        setSession({
          loggedIn: true,
          name: res.data.admin.name,
          email: res.data.admin.email,
          role: res.data.admin.role,
          token: res.data.token
        });
        setMessage({ type: "success", text: "Admin authenticated successfully!" });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Invalid credentials." });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/admin/auth/logout");
      setSession(null);
      setMessage({ type: "success", text: "Logged out from admin panel." });
    } catch (err) {
      setSession(null);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="page-heading">
        <div>
          <h1>Module 2: Admin Authentication</h1>
          <p>Manage administrator credentials, active session tokens, and security policies.</p>
        </div>
      </div>

      {message && (
        <div style={{
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "18px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: message.type === "success" ? "#0b3d20" : "#3d1010",
          border: `1px solid ${message.type === "success" ? "#1b8744" : "#a82424"}`,
          color: message.type === "success" ? "#75f0a0" : "#ff9e9e"
        }}>
          {message.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card blue">
          <div className="stat-top">
            <span className="stat-title">Current Status</span>
            <div className="stat-icon"><Shield size={20} /></div>
          </div>
          <h2>{session?.loggedIn ? "AUTHENTICATED" : "LOCKED"}</h2>
          <small>{session ? `Logged in as ${session.role}` : "Session expired"}</small>
        </div>

        <div className="stat-card green">
          <div className="stat-top">
            <span className="stat-title">Active Role</span>
            <div className="stat-icon"><UserCheck size={20} /></div>
          </div>
          <h2>{session ? session.role.toUpperCase() : "NONE"}</h2>
          <small>Role Based Access Control Enabled</small>
        </div>

        <div className="stat-card purple">
          <div className="stat-top">
            <span className="stat-title">Multi-Factor Auth</span>
            <div className="stat-icon"><KeyRound size={20} /></div>
          </div>
          <h2>2FA ENFORCED</h2>
          <small>SMS & Hardware Key OTP Policy</small>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Session Card */}
        <div className="table-card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Shield size={18} color="#087cff" /> Active Admin Session
          </h3>

          {session ? (
            <div>
              <div style={{ background: "#061224", padding: "16px", borderRadius: "8px", border: "1px solid #172d4d", marginBottom: "16px" }}>
                <p style={{ fontSize: "12px", color: "#7a90b3" }}>ADMIN NAME</p>
                <p style={{ fontSize: "15px", fontWeight: "600", color: "#e3edff" }}>{session.name}</p>
                
                <p style={{ fontSize: "12px", color: "#7a90b3", marginTop: "12px" }}>EMAIL ADDRESS</p>
                <p style={{ fontSize: "15px", fontWeight: "600", color: "#e3edff" }}>{session.email}</p>

                <p style={{ fontSize: "12px", color: "#7a90b3", marginTop: "12px" }}>SESSION TOKEN</p>
                <code style={{ fontSize: "12px", color: "#38bdf8", wordBreak: "break-all" }}>{session.token}</code>
              </div>

              <button
                onClick={handleLogout}
                style={{
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "6px",
                  fontWeight: "600",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer"
                }}
              >
                <LogOut size={16} /> End Session (Logout)
              </button>
            </div>
          ) : (
            <p style={{ color: "#94a3b8" }}>No active session. Please log in using the form.</p>
          )}
        </div>

        {/* Login / Switch Form */}
        <div className="table-card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Lock size={18} color="#087cff" /> Admin Authentication Form
          </h3>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="form-group">
              <label>Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@apnapay.com"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#60a5fa", cursor: "pointer" }} onClick={() => alert("Forgot Password link sent to administrator email!")}>
                Forgot Password?
              </span>
              <button type="submit" disabled={loading} className="btn-save" style={{ padding: "10px 20px" }}>
                {loading ? "Authenticating..." : "Login / Verify Session"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
