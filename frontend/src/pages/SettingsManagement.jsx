import React, { useEffect, useState } from "react";
import { Settings, Save, AlertTriangle, ShieldCheck, ToggleLeft, ToggleRight, RefreshCw } from "lucide-react";
import api from "../services/api";

export default function SettingsManagement() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [formVals, setFormVals] = useState({});
  const [feedback, setFeedback] = useState(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/settings");
      const list = res.data.settings || [];
      setSettings(list);
      const vals = {};
      list.forEach(s => { vals[s.setting_key] = s.setting_value; });
      setFormVals(vals);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (key, val) => {
    setSavingKey(key);
    setFeedback(null);
    try {
      const res = await api.put(`/admin/settings/${key}`, { value: val });
      if (res.data.success) {
        setFeedback({ type: "success", text: res.data.message });
        setFormVals(prev => ({ ...prev, [key]: val }));
        fetchSettings();
      }
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.message || "Failed to update setting." });
    } finally {
      setSavingKey(null);
    }
  };

  const isMaintenance = formVals["maintenance_mode"] === "true";

  return (
    <div className="dashboard-content">
      <div className="page-heading">
        <div>
          <h1>Module 17: App Settings & System Configuration</h1>
          <p>Global fintech switches, transaction limits, compliance thresholds, and platform maintenance control.</p>
        </div>
        <button className="refresh-btn" onClick={fetchSettings}>
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Config
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

      {/* Maintenance Mode Emergency Alert Card */}
      <div className="table-card" style={{
        padding: "20px",
        marginBottom: "24px",
        background: isMaintenance ? "#3d1010" : "#081b33",
        border: `1px solid ${isMaintenance ? "#b91c1c" : "#1a3a69"}`
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={20} color={isMaintenance ? "#f87171" : "#38bdf8"} />
              System Maintenance Switch: {isMaintenance ? "ACTIVE (App Offline)" : "NORMAL (Platform Live)"}
            </h3>
            <p style={{ fontSize: "12px", color: isMaintenance ? "#fca5a5" : "#94a3b8", marginTop: "4px" }}>
              When enabled, user app endpoints block outgoing transactions with a friendly maintenance notice.
            </p>
          </div>
          <button
            onClick={() => handleUpdate("maintenance_mode", isMaintenance ? "false" : "true")}
            disabled={savingKey === "maintenance_mode"}
            style={{
              background: isMaintenance ? "#15803d" : "#dc2626",
              color: "#fff",
              border: "none",
              padding: "10px 18px",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            {isMaintenance ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            {isMaintenance ? "Disable Maintenance (Go Live)" : "Enable Maintenance Mode"}
          </button>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="table-card" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "18px" }}>Financial Limits & Thresholds</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Min Transfer Amount */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "16px", borderBottom: "1px solid #142847" }}>
            <div>
              <strong style={{ fontSize: "14px" }}>Minimum Single Transfer Amount</strong>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Minimum allowed P2P or bank payout in INR</p>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="number"
                value={formVals["min_transfer_amount"] || "10.00"}
                onChange={(e) => setFormVals({ ...formVals, min_transfer_amount: e.target.value })}
                style={{
                  width: "120px",
                  background: "#08152b",
                  border: "1px solid #1c3257",
                  color: "#e2ecff",
                  padding: "8px 12px",
                  borderRadius: "6px"
                }}
              />
              <button
                className="btn-save"
                onClick={() => handleUpdate("min_transfer_amount", formVals["min_transfer_amount"])}
                disabled={savingKey === "min_transfer_amount"}
                style={{ padding: "8px 14px", fontSize: "12px" }}
              >
                Save
              </button>
            </div>
          </div>

          {/* Max Daily Transfer Limit */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "16px", borderBottom: "1px solid #142847" }}>
            <div>
              <strong style={{ fontSize: "14px" }}>Maximum Daily Transaction Volume</strong>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Upper daily cap per user across UPI & wallet</p>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="number"
                value={formVals["max_daily_transfer_limit"] || "100000.00"}
                onChange={(e) => setFormVals({ ...formVals, max_daily_transfer_limit: e.target.value })}
                style={{
                  width: "140px",
                  background: "#08152b",
                  border: "1px solid #1c3257",
                  color: "#e2ecff",
                  padding: "8px 12px",
                  borderRadius: "6px"
                }}
              />
              <button
                className="btn-save"
                onClick={() => handleUpdate("max_daily_transfer_limit", formVals["max_daily_transfer_limit"])}
                disabled={savingKey === "max_daily_transfer_limit"}
                style={{ padding: "8px 14px", fontSize: "12px" }}
              >
                Save
              </button>
            </div>
          </div>

          {/* KYC Mandatory Threshold */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "16px", borderBottom: "1px solid #142847" }}>
            <div>
              <strong style={{ fontSize: "14px" }}>Mandatory KYC Threshold</strong>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Threshold above which Aadhaar/PAN verification is enforced</p>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="number"
                value={formVals["kyc_mandatory_above"] || "10000.00"}
                onChange={(e) => setFormVals({ ...formVals, kyc_mandatory_above: e.target.value })}
                style={{
                  width: "120px",
                  background: "#08152b",
                  border: "1px solid #1c3257",
                  color: "#e2ecff",
                  padding: "8px 12px",
                  borderRadius: "6px"
                }}
              />
              <button
                className="btn-save"
                onClick={() => handleUpdate("kyc_mandatory_above", formVals["kyc_mandatory_above"])}
                disabled={savingKey === "kyc_mandatory_above"}
                style={{ padding: "8px 14px", fontSize: "12px" }}
              >
                Save
              </button>
            </div>
          </div>

          {/* Auto Refund Window */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ fontSize: "14px" }}>Auto-Refund Window (Hours)</strong>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Time allowed for merchant banking response before automatic reversal</p>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="number"
                value={formVals["auto_refund_window_hours"] || "48"}
                onChange={(e) => setFormVals({ ...formVals, auto_refund_window_hours: e.target.value })}
                style={{
                  width: "100px",
                  background: "#08152b",
                  border: "1px solid #1c3257",
                  color: "#e2ecff",
                  padding: "8px 12px",
                  borderRadius: "6px"
                }}
              />
              <button
                className="btn-save"
                onClick={() => handleUpdate("auto_refund_window_hours", formVals["auto_refund_window_hours"])}
                disabled={savingKey === "auto_refund_window_hours"}
                style={{ padding: "8px 14px", fontSize: "12px" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
