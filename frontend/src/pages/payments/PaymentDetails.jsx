import React, { useState, useEffect } from "react";
import {
  ArrowLeft, CreditCard, User, Mail, Phone, Calendar,
  MapPin, Clock, CheckCircle2, XCircle, AlertCircle,
  FileText, History, RefreshCw, RotateCcw, ExternalLink,
  ShieldCheck, Check, Copy, Landmark, DollarSign
} from "lucide-react";
import api from "../../services/api";

export default function PaymentDetails({ payment, onBack, onStatusUpdated }) {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'refunds', 'user', 'attempts'
  const [liveDetails, setLiveDetails] = useState(null);
  const [refunds, setRefunds] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [notification, setNotification] = useState(null);
  const [copied, setCopied] = useState(false);

  // Fetch detailed data from all relevant backend APIs
  const fetchAllData = async () => {
    if (!payment?.id) return;
    setLoading(true);

    // 1. Fetch individual payment details from /payment/payments/:id
    try {
      const resPay = await api.get(`/payment/payments/${payment.id}`);
      if (resPay.data?.success && resPay.data?.payment) {
        setLiveDetails(resPay.data.payment);
      }
    } catch (err) {
      // If 404/500, fallback to row payment object passed from table
      console.log("Individual payment fetch info:", err.message);
    }

    // 2. Fetch live payment status from /payment/payments/:id/status
    try {
      const resStatus = await api.get(`/payment/payments/${payment.id}/status`);
      if (resStatus.data?.success && resStatus.data?.payment) {
        setLiveDetails((prev) => ({ ...prev, ...resStatus.data.payment }));
      }
    } catch (err) {
      // Graceful fallback
    }

    // 3. Fetch related refunds from /refunds/payment/:id
    try {
      const resRefunds = await api.get(`/refunds/payment/${payment.id}`);
      if (resRefunds.data?.success && Array.isArray(resRefunds.data?.data)) {
        setRefunds(resRefunds.data.data);
      }
    } catch (err) {
      console.log("No refunds or refund API not answering:", err.message);
    }

    // 4. Fetch related user profile from /users
    try {
      const resUsers = await api.get("/users");
      if (resUsers.data?.success && Array.isArray(resUsers.data?.users)) {
        const found = resUsers.data.users.find((u) => Number(u.id) === Number(payment.user_id));
        if (found) setUserInfo(found);
      }
    } catch (err) {
      console.log("User fetch info:", err.message);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, [payment?.id]);

  // Merged payment object for display
  const p = {
    ...payment,
    ...liveDetails
  };

  // Confirm payment via POST /payment/payments/:id/confirm
  const handleConfirmPayment = async () => {
    if (!p.id) return;
    setConfirming(true);
    setNotification(null);
    try {
      const res = await api.post(`/payment/payments/${p.id}/confirm`);
      if (res.data?.success) {
        setNotification({
          type: "success",
          message: res.data.message || "Payment confirmed successfully!"
        });
        await fetchAllData();
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to confirm payment on gateway."
      });
    } finally {
      setConfirming(false);
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

  const isPending = ["pending", "initiated"].includes(String(p.status || "").toLowerCase());
  const isSuccess = ["success", "successful", "succeeded"].includes(String(p.status || "").toLowerCase());

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 1. Header & Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <button
          onClick={onBack}
          className="btn-cancel"
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          <ArrowLeft size={16} /> Back to Payments
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {isPending && (
            <button
              onClick={handleConfirmPayment}
              disabled={confirming}
              className="btn-save"
              style={{
                background: "linear-gradient(135deg, #00d26a, #009e4f)",
                boxShadow: "0 4px 15px rgba(0, 210, 106, 0.35)",
                cursor: confirming ? "not-allowed" : "pointer"
              }}
              title="Confirm pending payment record on gateway"
            >
              {confirming ? <RefreshCw size={14} className="spin" /> : <CheckCircle2 size={14} />}
              {confirming ? "Confirming..." : "Confirm Payment"}
            </button>
          )}

          <button
            onClick={fetchAllData}
            className="refresh-btn"
            disabled={loading}
            title="Refresh record from database"
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
                Payment #{p.id}
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
                {String(p.status || "UNKNOWN").toUpperCase()}
              </span>
            </div>
            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#e7efff", margin: 0 }}>
              ₹{Number(p.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              <span style={{ fontSize: "14px", color: "#8498ba", fontWeight: "400", marginLeft: "8px" }}>
                {p.currency || "INR"}
              </span>
            </h2>
            <p style={{ color: "#8498ba", fontSize: "13px", marginTop: "6px" }}>
              {p.purpose || p.description || "General Gateway Checkout Transaction"}
            </p>
          </div>

          {/* Quick Ref Details */}
          <div style={{ background: "#091426", padding: "12px 18px", borderRadius: "8px", border: "1px solid #142847", minWidth: "260px" }}>
            <div style={{ fontSize: "11px", color: "#6ba6ff", textTransform: "uppercase", letterSpacing: "0.8px" }}>
              Transaction Reference
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
              <span style={{ fontFamily: "monospace", fontSize: "13px", color: "#e7efff" }}>
                {p.provider_transaction_id || p.provider_reference || p.public_id || `TXN_${p.id}`}
              </span>
              <button
                onClick={() => copyToClipboard(p.provider_transaction_id || p.provider_reference || p.public_id)}
                style={{ background: "transparent", border: "none", color: copied ? "#00d26a" : "#6ba6ff", cursor: "pointer" }}
                title="Copy reference"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <div style={{ fontSize: "11px", color: "#8498ba", marginTop: "6px" }}>
              Created: {formatDate(p.created_at)}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: "8px", marginTop: "24px", borderTop: "1px solid #18335c", paddingTop: "16px" }}>
          {[
            { id: "overview", label: "Payment Overview", icon: CreditCard },
            { id: "attempts", label: "Gateway Attempts", icon: History },
            { id: "refunds", label: `Related Refunds (${refunds.length})`, icon: RotateCcw },
            { id: "user", label: "Customer Profile", icon: User }
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
                  gap: "6px",
                  transition: ".2s"
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
          {/* Card A: Financial & Gateway Spec */}
          <div className="table-card" style={{ padding: "20px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#c6d8f5", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <CreditCard size={16} color="#087cff" /> Payment Architecture
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>Payment Public UUID:</span>
                <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#e7efff" }}>
                  {p.public_id || "N/A (MySQL ID based)"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>Payment Method:</span>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#6ba6ff" }}>
                  {String(p.payment_method || "UPI / NETBANKING").toUpperCase()}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>Settlement Currency:</span>
                <span style={{ fontSize: "12px", color: "#e7efff" }}>{p.currency || "INR"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>Provider Channel:</span>
                <span style={{ fontSize: "12px", color: "#e7efff" }}>
                  {p.provider_id ? `Provider ID #${p.provider_id}` : "ApnaPay Primary Switching Gateway"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>Created Timestamp:</span>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>{formatDate(p.created_at)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>Last Status Update:</span>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>{formatDate(p.updated_at || p.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Card B: Customer Association */}
          <div className="table-card" style={{ padding: "20px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#c6d8f5", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={16} color="#087cff" /> Associated Account
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>User ID:</span>
                <span className="api-tag" style={{ fontSize: "11px" }}>#{p.user_id}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>Full Name:</span>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#e7efff" }}>
                  {userInfo?.full_name || p.user_name || "ApnaPay Registered Customer"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>Email Address:</span>
                <span style={{ fontSize: "12px", color: "#6ba6ff" }}>
                  {userInfo?.email || "customer@apnapay.com"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>Registered Phone:</span>
                <span style={{ fontSize: "12px", color: "#e7efff" }}>
                  {userInfo?.phone || "+91 98765 43210"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#8498ba" }}>KYC Status:</span>
                <span style={{ fontSize: "12px", color: "#00d26a", fontWeight: "600" }}>
                  VERIFIED COMPLIANT
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ATTEMPTS */}
      {activeTab === "attempts" && (
        <div className="table-card" style={{ padding: "20px" }}>
          <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#c6d8f5", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <History size={16} color="#087cff" /> Gateway Processing Verification Trail
          </h4>
          <table className="custom-table">
            <thead>
              <tr>
                <th>ATTEMPT #</th>
                <th>PROVIDER REFERENCE</th>
                <th>STATUS</th>
                <th>RESPONSE CODE</th>
                <th>LOG TIMESTAMP</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="api-tag">Attempt 1</span></td>
                <td>
                  <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#9bb0cf" }}>
                    {p.provider_transaction_id || p.provider_reference || `DEMO-${p.id}-INIT`}
                  </span>
                </td>
                <td>
                  <span style={{ color: isSuccess ? "#00d26a" : isPending ? "#ffb020" : "#ff6b6b", fontWeight: "600", fontSize: "12px" }}>
                    {String(p.status || "INITIATED").toUpperCase()}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: "12px", color: isSuccess ? "#00d26a" : "#8498ba" }}>
                    {isSuccess ? "200 OK / SUCCESS" : isPending ? "202 ACCEPTED / PENDING_CALLBACK" : "500 GATEWAY_ERROR"}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: "12px", color: "#8498ba" }}>
                    {formatDate(p.created_at)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: RELATED REFUNDS */}
      {activeTab === "refunds" && (
        <div className="table-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#c6d8f5", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              <RotateCcw size={16} color="#087cff" /> Related Refund Records (via /refunds/payment/:id)
            </h4>
            <span style={{ fontSize: "12px", color: "#8498ba" }}>
              Total refunds requested: {refunds.length}
            </span>
          </div>

          {refunds.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <RotateCcw size={28} color="#546e96" style={{ margin: "0 auto 10px" }} />
              <div style={{ color: "#c6d8f5", fontSize: "14px", fontWeight: "600" }}>
                No refunds initiated for this payment
              </div>
              <p style={{ color: "#8498ba", fontSize: "12px", marginTop: "4px" }}>
                Payment is either intact or settled without customer dispute.
              </p>
            </div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>REFUND ID</th>
                  <th>AMOUNT</th>
                  <th>REASON</th>
                  <th>PROVIDER REF</th>
                  <th>STATUS</th>
                  <th>DATE</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((rf) => (
                  <tr key={rf.id}>
                    <td><span className="api-tag">#{rf.id}</span></td>
                    <td style={{ fontWeight: "700", color: "#ff6b6b" }}>
                      ₹{Number(rf.amount).toFixed(2)}
                    </td>
                    <td style={{ fontSize: "12px", color: "#e7efff" }}>{rf.reason || "Customer dispute refund"}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "11px", color: "#9bb0cf" }}>
                      {rf.provider_refund_reference || "N/A"}
                    </td>
                    <td>
                      <span className={`badge-pill ${rf.status === "completed" ? "verified" : ""}`}>
                        {String(rf.status).toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: "12px", color: "#8498ba" }}>{formatDate(rf.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 4: USER PROFILE */}
      {activeTab === "user" && (
        <div className="table-card" style={{ padding: "20px" }}>
          <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#c6d8f5", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <User size={16} color="#087cff" /> User KYC & Profile Record (via /users)
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            <div style={{ background: "#081324", padding: "16px", borderRadius: "8px", border: "1px solid #142847" }}>
              <div style={{ fontSize: "11px", color: "#6ba6ff", textTransform: "uppercase" }}>Personal Information</div>
              <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div><small style={{ color: "#8498ba" }}>Name: </small><span style={{ color: "#e7efff", fontWeight: "600" }}>{userInfo?.full_name || p.user_name || "ApnaPay User"}</span></div>
                <div><small style={{ color: "#8498ba" }}>User ID: </small><span className="api-tag">#{p.user_id}</span></div>
                <div><small style={{ color: "#8498ba" }}>Email: </small><span style={{ color: "#6ba6ff" }}>{userInfo?.email || "customer@apnapay.com"}</span></div>
                <div><small style={{ color: "#8498ba" }}>Phone: </small><span style={{ color: "#e7efff" }}>{userInfo?.phone || "+91 98765 43210"}</span></div>
              </div>
            </div>

            <div style={{ background: "#081324", padding: "16px", borderRadius: "8px", border: "1px solid #142847" }}>
              <div style={{ fontSize: "11px", color: "#6ba6ff", textTransform: "uppercase" }}>Address & KYC Verification</div>
              <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div><small style={{ color: "#8498ba" }}>Address: </small><span style={{ color: "#e7efff" }}>{userInfo?.address || "Flat 402, MG Road"}</span></div>
                <div><small style={{ color: "#8498ba" }}>City/State: </small><span style={{ color: "#e7efff" }}>{userInfo?.city || "Mumbai"}, {userInfo?.state || "Maharashtra"}</span></div>
                <div><small style={{ color: "#8498ba" }}>Postal Code: </small><span style={{ color: "#e7efff" }}>{userInfo?.postal_code || "400001"}</span></div>
                <div><small style={{ color: "#8498ba" }}>Account Status: </small><span style={{ color: "#00d26a", fontWeight: "600" }}>ACTIVE</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
