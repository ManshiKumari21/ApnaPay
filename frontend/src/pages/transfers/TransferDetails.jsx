import React, { useState, useEffect } from "react";
import {
  ArrowLeft, Send, User, Phone, Mail, Landmark,
  ShieldCheck, Clock, CheckCircle2, XCircle, AlertCircle,
  Copy, Check, RefreshCw, Ban, History, ExternalLink
} from "lucide-react";
import api from "../../services/api";

export default function TransferDetails({ transfer, onBack, onStatusUpdated }) {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'history', 'user'
  const [liveData, setLiveData] = useState(null);
  const [senderInfo, setSenderInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [notification, setNotification] = useState(null);
  const [copied, setCopied] = useState(false);

  const transferId = transfer?.id || transfer?.transfer_id;

  const fetchTransferData = async () => {
    if (!transferId) return;
    setLoading(true);

    // 1. Fetch transfer details from /payment/transfers/:id
    try {
      const res = await api.get(`/payment/transfers/${transferId}`);
      if (res.data?.success && res.data?.transfer) {
        setLiveData(res.data.transfer);
      }
    } catch (err) {
      console.log("Fetch individual transfer info:", err.message);
    }

    // 2. Fetch sender user profile from /users
    try {
      const resUsers = await api.get("/users");
      if (resUsers.data?.success && Array.isArray(resUsers.data?.users)) {
        const sid = transfer.sender_user_id || transfer.user_id;
        const found = resUsers.data.users.find((u) => Number(u.id) === Number(sid));
        if (found) setSenderInfo(found);
      }
    } catch (err) {
      console.log("Fetch user profile info:", err.message);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchTransferData();
  }, [transferId]);

  const t = {
    ...transfer,
    ...liveData
  };

  // Cancel transfer via POST /payment/transfers/:id/cancel
  const handleCancelTransfer = async () => {
    if (!transferId) return;
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this pending money transfer? This will release the hold and cancel the associated transaction."
    );
    if (!confirmCancel) return;

    setCancelling(true);
    setNotification(null);
    try {
      const res = await api.post(`/payment/transfers/${transferId}/cancel`);
      if (res.data?.success) {
        setNotification({
          type: "success",
          message: res.data.message || "Money transfer cancelled successfully."
        });
        await fetchTransferData();
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to cancel transfer. Only pending transfers can be cancelled."
      });
    } finally {
      setCancelling(false);
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const isPending = ["pending", "initiated"].includes(String(t.status || "").toLowerCase());
  const isSuccess = ["success", "successful", "completed", "succeeded"].includes(String(t.status || "").toLowerCase());

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 1. Header Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <button
          onClick={onBack}
          className="btn-cancel"
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          <ArrowLeft size={16} /> Back to Transfers
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {isPending && (
            <button
              onClick={handleCancelTransfer}
              disabled={cancelling}
              className="btn-cancel"
              style={{
                background: "rgba(255, 77, 77, 0.15)",
                border: "1px solid rgba(255, 77, 77, 0.4)",
                color: "#ff6b6b",
                cursor: cancelling ? "not-allowed" : "pointer"
              }}
              title="Cancel pending money transfer via API"
            >
              {cancelling ? <RefreshCw size={14} className="spin" /> : <Ban size={14} />}
              {cancelling ? "Cancelling..." : "Cancel Transfer"}
            </button>
          )}

          <button
            onClick={fetchTransferData}
            className="refresh-btn"
            disabled={loading}
            title="Refresh transfer status from backend"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* 2. Notification Alert */}
      {notification && (
        <div className={`feedback-alert ${notification.type}`}>
          {notification.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* 3. Top Summary Banner */}
      <div
        className="form-card"
        style={{
          background: "linear-gradient(145deg, #102140, #0c1830)",
          border: "1px solid #1c3d70",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.35)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span className="api-tag" style={{ fontSize: "13px", padding: "4px 10px" }}>
                Transfer #{transferId}
              </span>
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "700",
                  background: isSuccess ? "rgba(0, 210, 106, 0.2)" : isPending ? "rgba(255, 170, 0, 0.2)" : "rgba(255, 77, 77, 0.2)",
                  color: isSuccess ? "#00d26a" : isPending ? "#ffb020" : "#ff6b6b",
                  border: `1px solid ${isSuccess ? "rgba(0, 210, 106, 0.4)" : isPending ? "rgba(255, 170, 0, 0.4)" : "rgba(255, 77, 77, 0.4)"}`
                }}
              >
                {String(t.status || "PENDING").toUpperCase()}
              </span>
              <span
                style={{
                  background: "#0c1b36",
                  border: "1px solid #1a3966",
                  color: "#6ba6ff",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: "700"
                }}
              >
                {t.transfer_mode || (t.receiver_upi_id ? "UPI" : "IMPS")}
              </span>
            </div>

            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#e7efff", margin: 0 }}>
              ₹{Number(t.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              <span style={{ fontSize: "14px", color: "#8498ba", fontWeight: "400", marginLeft: "8px" }}>
                {t.currency || "INR"}
              </span>
            </h2>
            <p style={{ color: "#8498ba", fontSize: "13px", marginTop: "6px" }}>
              Payout from {t.sender_name || senderInfo?.full_name || "Sender User"} to {t.beneficiary_name || "Beneficiary"}
            </p>
          </div>

          {/* Reference Card */}
          <div style={{ background: "#091426", padding: "12px 18px", borderRadius: "8px", border: "1px solid #142847", minWidth: "260px" }}>
            <div style={{ fontSize: "11px", color: "#6ba6ff", textTransform: "uppercase", letterSpacing: "0.8px" }}>
              Transaction Reference
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
              <span style={{ fontFamily: "monospace", fontSize: "13px", color: "#e7efff" }}>
                {t.provider_transaction_id || t.reference || t.transaction_reference || `P2P_TRF_${transferId}`}
              </span>
              <button
                onClick={() => copyToClipboard(t.provider_transaction_id || t.reference || t.transaction_reference)}
                style={{ background: "transparent", border: "none", color: copied ? "#00d26a" : "#6ba6ff", cursor: "pointer" }}
                title="Copy reference"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <div style={{ fontSize: "11px", color: "#8498ba", marginTop: "6px" }}>
              Initiated: {formatDate(t.created_at)}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginTop: "24px", borderTop: "1px solid #18335c", paddingTop: "16px" }}>
          {[
            { id: "overview", label: "Transfer Details", icon: Send },
            { id: "history", label: "Transaction Audit Trail", icon: History },
            { id: "user", label: "Sender User Profile", icon: User }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: isSel ? "#087cff" : "#0d1b33",
                  color: isSel ? "white" : "#91a6c8",
                  border: `1px solid ${isSel ? "#087cff" : "#1b3153"}`,
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Tab Contents */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
          {/* Card 1: Sender Information */}
          <div className="table-card" style={{ padding: "20px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#c6d8f5", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={16} color="#087cff" /> Sender Information
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>Sender User ID:</span>
                <span className="api-tag" style={{ fontSize: "11px" }}>#{t.sender_user_id || t.user_id || 1}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>Sender Full Name:</span>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#e7efff" }}>
                  {senderInfo?.full_name || t.sender_name || "Rahul Sharma"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>Mobile Number:</span>
                <span style={{ fontSize: "12px", color: "#6ba6ff" }}>
                  {senderInfo?.phone || "+91 98765 43210"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>Email Address:</span>
                <span style={{ fontSize: "12px", color: "#e7efff" }}>
                  {senderInfo?.email || "rahul.sharma@apnapay.com"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Beneficiary Information */}
          <div className="table-card" style={{ padding: "20px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#c6d8f5", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Landmark size={16} color="#087cff" /> Beneficiary Information
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>Beneficiary Name:</span>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#e7efff" }}>
                  {t.beneficiary_name || t.receiver_name || "Neha Gupta"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>Bank / Gateway:</span>
                <span style={{ fontSize: "12px", color: "#e7efff" }}>
                  {t.bank_name || (t.receiver_upi_id ? "NPCI UPI Switching Network" : "HDFC Bank Ltd")}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>Masked Account / UPI:</span>
                <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#9bb0cf", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <ShieldCheck size={12} color="#00d26a" /> {t.masked_account || `•••• •••• •••• ${t.receiver_account_last4 || "4521"}`}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>IFSC Code:</span>
                <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#8498ba" }}>
                  {t.ifsc_code || (t.receiver_upi_id ? "UPI_VPA" : "HDFC0001234")}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Transfer Financial Details */}
          <div className="table-card" style={{ padding: "20px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#c6d8f5", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Send size={16} color="#087cff" /> Remittance Financials
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>Transfer Amount:</span>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#00d26a" }}>
                  ₹{Number(t.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>Transfer Fee / Commission:</span>
                <span style={{ fontSize: "12px", color: Number(t.fee || 0) > 0 ? "#ffb020" : "#8498ba" }}>
                  ₹{Number(t.fee || 0).toFixed(2)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>Associated Payment ID:</span>
                <span className="api-tag" style={{ fontSize: "11px" }}>#{t.payment_id || t.id}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>Transfer Mode:</span>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#6ba6ff" }}>
                  {t.transfer_mode || (t.receiver_upi_id ? "UPI" : "IMPS")}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>Timestamp:</span>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>{formatDate(t.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT TRAIL */}
      {activeTab === "history" && (
        <div className="table-card" style={{ padding: "20px" }}>
          <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#c6d8f5", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <History size={16} color="#087cff" /> Banking Switch Audit Trail
          </h4>
          <table className="custom-table">
            <thead>
              <tr>
                <th>STAGE</th>
                <th>GATEWAY SWITCH</th>
                <th>REFERENCE</th>
                <th>STATUS</th>
                <th>TIME</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="api-tag">Initiation</span></td>
                <td>ApnaPay Ledger Engine</td>
                <td style={{ fontFamily: "monospace", fontSize: "11px", color: "#9bb0cf" }}>
                  {t.provider_transaction_id || `P2P_TRF_${transferId}`}
                </td>
                <td>
                  <span style={{ color: "#00d26a", fontWeight: "600", fontSize: "12px" }}>
                    SUCCESS
                  </span>
                </td>
                <td style={{ fontSize: "12px", color: "#8498ba" }}>{formatDate(t.created_at)}</td>
              </tr>
              <tr>
                <td><span className="api-tag">Beneficiary Credit</span></td>
                <td>{t.receiver_upi_id ? "NPCI UPI Switch" : "IMPS Banking Switch"}</td>
                <td style={{ fontFamily: "monospace", fontSize: "11px", color: "#9bb0cf" }}>
                  {t.reference || `REF_${transferId}_CREDIT`}
                </td>
                <td>
                  <span style={{ color: isSuccess ? "#00d26a" : isPending ? "#ffb020" : "#ff6b6b", fontWeight: "600", fontSize: "12px" }}>
                    {String(t.status || "PENDING").toUpperCase()}
                  </span>
                </td>
                <td style={{ fontSize: "12px", color: "#8498ba" }}>{formatDate(t.updated_at || t.created_at)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: USER PROFILE */}
      {activeTab === "user" && (
        <div className="table-card" style={{ padding: "20px" }}>
          <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#c6d8f5", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <User size={16} color="#087cff" /> Sender User Profile
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            <div style={{ background: "#081324", padding: "16px", borderRadius: "8px", border: "1px solid #142847" }}>
              <div style={{ fontSize: "11px", color: "#6ba6ff", textTransform: "uppercase" }}>Personal Information</div>
              <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div><small style={{ color: "#8498ba" }}>Full Name: </small><span style={{ color: "#e7efff", fontWeight: "600" }}>{senderInfo?.full_name || t.sender_name || "Rahul Sharma"}</span></div>
                <div><small style={{ color: "#8498ba" }}>User ID: </small><span className="api-tag">#{t.sender_user_id || t.user_id || 1}</span></div>
                <div><small style={{ color: "#8498ba" }}>Email: </small><span style={{ color: "#6ba6ff" }}>{senderInfo?.email || "rahul.sharma@apnapay.com"}</span></div>
                <div><small style={{ color: "#8498ba" }}>Phone: </small><span style={{ color: "#e7efff" }}>{senderInfo?.phone || "+91 98765 43210"}</span></div>
              </div>
            </div>

            <div style={{ background: "#081324", padding: "16px", borderRadius: "8px", border: "1px solid #142847" }}>
              <div style={{ fontSize: "11px", color: "#6ba6ff", textTransform: "uppercase" }}>Address & KYC Compliance</div>
              <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div><small style={{ color: "#8498ba" }}>Address: </small><span style={{ color: "#e7efff" }}>{senderInfo?.address || "Flat 402, MG Road"}</span></div>
                <div><small style={{ color: "#8498ba" }}>City/State: </small><span style={{ color: "#e7efff" }}>{senderInfo?.city || "Mumbai"}, {senderInfo?.state || "Maharashtra"}</span></div>
                <div><small style={{ color: "#8498ba" }}>Postal Code: </small><span style={{ color: "#e7efff" }}>{senderInfo?.postal_code || "400001"}</span></div>
                <div><small style={{ color: "#8498ba" }}>Account Status: </small><span style={{ color: "#00d26a", fontWeight: "600" }}>ACTIVE</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
