import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Send,
  User,
  Phone,
  Mail,
  Landmark,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Ban,
  ArrowRight,
  Calendar,
  CreditCard,
  Hash,
  ExternalLink,
  Receipt
} from "lucide-react";
import api from "../../services/api";

export default function TransferDetailsDrawer({
  transfer,
  isOpen,
  onClose,
  onStatusUpdated
}) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [notification, setNotification] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const transferId = transfer?.id || transfer?.transfer_id;

  const fetchTransferDetails = async () => {
    if (!transferId) return;
    setLoading(true);
    setNotification(null);
    try {
      const res = await api.get(`/payment/transfers/${transferId}`);
      if (res.data?.success && res.data?.transfer) {
        setDetails(res.data.transfer);
      }
    } catch (err) {
      console.error("Fetch individual transfer error:", err);
      // Fallback to passed transfer prop
      setDetails(transfer);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && transferId) {
      fetchTransferDetails();
    }
  }, [isOpen, transferId]);

  if (!isOpen) return null;

  const t = details || transfer || {};

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCancelTransfer = async () => {
    if (!transferId) return;
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel Pending Transfer #${transferId}? This will reverse holds and update the transaction status.`
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
        await fetchTransferDetails();
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (err) {
      setNotification({
        type: "error",
        message:
          err.response?.data?.message ||
          "Failed to cancel transfer. Only pending transfers can be cancelled."
      });
    } finally {
      setCancelling(false);
    }
  };

  const formatINR = (val) => {
    const num = Number(val) || 0;
    return (
      "₹" +
      num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    );
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

  const maskAccount = (last4, upiId) => {
    if (upiId) {
      const parts = String(upiId).split("@");
      if (parts.length === 2) {
        const namePart = parts[0];
        const masked =
          namePart.length > 3
            ? namePart.slice(0, 3) + "***"
            : namePart + "***";
        return `${masked}@${parts[1]}`;
      }
      return upiId;
    }
    if (last4) {
      return `•••• •••• •••• ${String(last4).slice(-4)}`;
    }
    return "•••• •••• •••• 4521";
  };

  const currentStatus = String(t.status || "initiated").toLowerCase();
  const isPending = ["pending", "initiated", "processing"].includes(currentStatus);
  const isSuccess = ["success", "successful", "completed", "succeeded"].includes(currentStatus);
  const isFailed = ["failed", "cancelled"].includes(currentStatus);
  const isReversed = currentStatus === "reversed";

  const getStatusColor = () => {
    if (isSuccess) return { text: "#00E599", bg: "rgba(0, 229, 153, 0.15)", border: "rgba(0, 229, 153, 0.3)" };
    if (isFailed) return { text: "#FF4D4D", bg: "rgba(255, 77, 77, 0.15)", border: "rgba(255, 77, 77, 0.3)" };
    if (isReversed) return { text: "#A855F7", bg: "rgba(168, 85, 247, 0.15)", border: "rgba(168, 85, 247, 0.3)" };
    if (currentStatus === "processing") return { text: "#FFB020", bg: "rgba(255, 176, 32, 0.15)", border: "rgba(255, 176, 32, 0.3)" };
    return { text: "#F59E0B", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.3)" };
  };

  const stColor = getStatusColor();

  const drawerContent = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        display: "flex",
        justifyContent: "flex-end",
        backgroundColor: "rgba(2, 6, 17, 0.8)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        transition: "opacity 0.25s ease"
      }}
      onClick={onClose}
    >
      {/* Drawer Container */}
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          height: "100%",
          backgroundColor: "#071426",
          borderLeft: "1px solid #16365C",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-10px 0 35px rgba(0, 0, 0, 0.6)",
          overflowY: "auto",
          position: "relative"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #16365C",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#0B1D35",
            position: "sticky",
            top: 0,
            zIndex: 10
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "rgba(8, 123, 255, 0.15)",
                border: "1px solid rgba(8, 123, 255, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Send size={18} color="#00D5FF" />
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#FFFFFF" }}>
                Transfer #{t.transfer_id || t.id}
              </div>
              <div style={{ fontSize: "12px", color: "#8BA2C1" }}>
                Outward Remittance Details & Audit Log
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={fetchTransferDetails}
              disabled={loading}
              style={{
                background: "#071426",
                border: "1px solid #16365C",
                color: "#8BA2C1",
                padding: "6px",
                borderRadius: "6px",
                cursor: "pointer"
              }}
              title="Refresh transfer details"
            >
              <RefreshCw size={14} className={loading ? "spin" : ""} color="#00D5FF" />
            </button>

            <button
              onClick={onClose}
              style={{
                background: "#071426",
                border: "1px solid #16365C",
                color: "#8BA2C1",
                padding: "6px",
                borderRadius: "6px",
                cursor: "pointer"
              }}
              title="Close drawer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 2. Notification Alert */}
        {notification && (
          <div
            style={{
              margin: "16px 24px 0 24px",
              padding: "12px 16px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13px",
              fontWeight: "500",
              background:
                notification.type === "success"
                  ? "rgba(0, 229, 153, 0.15)"
                  : "rgba(255, 77, 77, 0.15)",
              color: notification.type === "success" ? "#00E599" : "#FF6B6B",
              border: `1px solid ${
                notification.type === "success"
                  ? "rgba(0, 229, 153, 0.3)"
                  : "rgba(255, 77, 77, 0.3)"
              }`
            }}
          >
            {notification.type === "success" ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* 3. Main Drawer Body */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Hero Amount Card */}
          <div
            style={{
              background: "linear-gradient(135deg, #0B1D35 0%, #071426 100%)",
              border: "1px solid #16365C",
              borderRadius: "14px",
              padding: "20px",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "#8BA2C1", fontWeight: "600", textTransform: "uppercase" }}>
                  Remittance Amount
                </span>
                <div style={{ fontSize: "28px", fontWeight: "800", color: "#FFFFFF", marginTop: "4px" }}>
                  {formatINR(t.amount)}
                </div>
              </div>

              {/* Status Badge */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: stColor.text,
                  background: stColor.bg,
                  border: `1px solid ${stColor.border}`
                }}
              >
                {isSuccess && <CheckCircle2 size={13} />}
                {isFailed && <XCircle size={13} />}
                {isPending && <Clock size={13} />}
                {isReversed && <RefreshCw size={13} />}
                {currentStatus.toUpperCase()}
              </span>
            </div>

            {/* Fee & Mode pills */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", paddingTop: "12px", borderTop: "1px solid #16365C" }}>
              <div style={{ fontSize: "12px", color: "#8BA2C1" }}>
                Transfer Fee:{" "}
                <span style={{ color: "#00D5FF", fontWeight: "700" }}>
                  {Number(t.fee || 0) > 0 ? formatINR(t.fee) : "₹0.00 (Free)"}
                </span>
              </div>
              <div style={{ color: "#16365C" }}>•</div>
              <div style={{ fontSize: "12px", color: "#8BA2C1" }}>
                Mode:{" "}
                <span style={{ color: "#FFFFFF", fontWeight: "700" }}>
                  {String(t.transfer_mode || "UPI").toUpperCase()}
                </span>
              </div>
              <div style={{ color: "#16365C" }}>•</div>
              <div style={{ fontSize: "12px", color: "#8BA2C1" }}>
                Currency: <span style={{ color: "#FFFFFF", fontWeight: "600" }}>{t.currency || "INR"}</span>
              </div>
            </div>
          </div>

          {/* Sender & Beneficiary 2-Column Section */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {/* Sender Details */}
            <div
              style={{
                background: "#0B1D35",
                border: "1px solid #16365C",
                borderRadius: "10px",
                padding: "16px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                <User size={14} color="#087BFF" />
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#087BFF", textTransform: "uppercase" }}>
                  Sender Details
                </span>
              </div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#FFFFFF", marginBottom: "4px" }}>
                {t.sender_name || "ApnaPay Customer"}
              </div>
              <div style={{ fontSize: "11.5px", color: "#8BA2C1", marginBottom: "3px" }}>
                User ID: #{t.sender_user_id || "1"}
              </div>
              {t.sender_email && (
                <div style={{ fontSize: "11.5px", color: "#8BA2C1", marginBottom: "3px" }}>
                  {t.sender_email}
                </div>
              )}
              {t.sender_phone && (
                <div style={{ fontSize: "11.5px", color: "#8BA2C1" }}>
                  {t.sender_phone}
                </div>
              )}
            </div>

            {/* Beneficiary Details */}
            <div
              style={{
                background: "#0B1D35",
                border: "1px solid #16365C",
                borderRadius: "10px",
                padding: "16px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                <Landmark size={14} color="#00D5FF" />
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#00D5FF", textTransform: "uppercase" }}>
                  Beneficiary Details
                </span>
              </div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#FFFFFF", marginBottom: "4px" }}>
                {t.beneficiary_name || "Beneficiary"}
              </div>
              <div style={{ fontSize: "11.5px", color: "#8BA2C1", marginBottom: "3px" }}>
                Account: {maskAccount(t.receiver_account_last4, t.receiver_upi_id)}
              </div>
              <div style={{ fontSize: "11.5px", color: "#8BA2C1", marginBottom: "3px" }}>
                IFSC: <span style={{ fontFamily: "monospace", color: "#00D5FF" }}>{t.ifsc_code || "HDFC0001234"}</span>
              </div>
              {t.receiver_upi_id && (
                <div style={{ fontSize: "11.5px", color: "#8BA2C1" }}>
                  UPI: {t.receiver_upi_id}
                </div>
              )}
            </div>
          </div>

          {/* Transaction Technical Metadata */}
          <div
            style={{
              background: "#0B1D35",
              border: "1px solid #16365C",
              borderRadius: "10px",
              padding: "16px"
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#FFFFFF", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Transaction References & IDs
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Reference ID */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                <span style={{ color: "#8BA2C1" }}>Transaction Reference:</span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontFamily: "monospace", color: "#00D5FF", fontWeight: "600" }}>
                    {t.reference_id || t.provider_reference || `TRF_${t.id}`}
                  </span>
                  <button
                    onClick={() => handleCopy(t.reference_id || t.provider_reference, "ref")}
                    style={{ background: "transparent", border: "none", color: copiedKey === "ref" ? "#00E599" : "#627B9B", cursor: "pointer" }}
                    title="Copy reference"
                  >
                    {copiedKey === "ref" ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              {/* Provider Reference */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                <span style={{ color: "#8BA2C1" }}>Provider Ref ID:</span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontFamily: "monospace", color: "#FFFFFF" }}>
                    {t.provider_reference || t.payment_provider_reference || "SWITCH_OK_8821"}
                  </span>
                  <button
                    onClick={() => handleCopy(t.provider_reference || t.payment_provider_reference, "prov")}
                    style={{ background: "transparent", border: "none", color: copiedKey === "prov" ? "#00E599" : "#627B9B", cursor: "pointer" }}
                    title="Copy provider ref"
                  >
                    {copiedKey === "prov" ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              {/* Initiated Date */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                <span style={{ color: "#8BA2C1" }}>Initiated Date:</span>
                <span style={{ color: "#FFFFFF" }}>{formatDate(t.created_at)}</span>
              </div>

              {/* Completed Date */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                <span style={{ color: "#8BA2C1" }}>Completed / Settled Date:</span>
                <span style={{ color: t.completed_at ? "#00E599" : "#8BA2C1" }}>
                  {t.completed_at ? formatDate(t.completed_at) : "In-flight / Not settled"}
                </span>
              </div>

              {/* Failure Reason */}
              {t.failure_reason && (
                <div
                  style={{
                    marginTop: "6px",
                    padding: "10px 12px",
                    background: "rgba(255, 77, 77, 0.1)",
                    border: "1px solid rgba(255, 77, 77, 0.3)",
                    borderRadius: "6px",
                    fontSize: "12px"
                  }}
                >
                  <div style={{ color: "#FF6B6B", fontWeight: "700", marginBottom: "2px" }}>
                    Failure Reason:
                  </div>
                  <div style={{ color: "#FF8E8E" }}>{t.failure_reason}</div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Transaction Timeline */}
          <div
            style={{
              background: "#0B1D35",
              border: "1px solid #16365C",
              borderRadius: "10px",
              padding: "18px"
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#FFFFFF", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Transaction Lifecycle Timeline
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "relative" }}>
              {/* Vertical connecting line */}
              <div
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "10px",
                  bottom: "10px",
                  width: "2px",
                  background: "#16365C",
                  zIndex: 0
                }}
              />

              {(t.timeline || [
                {
                  step: 1,
                  title: "Transfer Initiated",
                  description: `Initiated ${t.transfer_mode || "UPI"} transfer of ₹${Number(t.amount || 0).toLocaleString("en-IN")}`,
                  status: "completed",
                  timestamp: t.created_at
                },
                {
                  step: 2,
                  title: "Switch Routing",
                  description: `Routed via ApnaPay Gateway / NPCI Switch (${t.provider_reference || "REF_SWITCH"})`,
                  status: isPending ? "in_progress" : "completed",
                  timestamp: t.created_at
                },
                {
                  step: 3,
                  title: isSuccess
                    ? "Beneficiary Settlement Confirmed"
                    : isFailed
                    ? "Transfer Failed / Cancelled"
                    : isReversed
                    ? "Amount Reversed to Sender"
                    : "Awaiting Beneficiary Bank Response",
                  description: t.failure_reason || `Settlement status: ${currentStatus.toUpperCase()}`,
                  status: isSuccess ? "completed" : isFailed ? "failed" : isReversed ? "reversed" : "in_progress",
                  timestamp: t.completed_at || null
                }
              ]).map((step, idx) => {
                const isStepCompleted = step.status === "completed";
                const isStepFailed = step.status === "failed";
                const isStepReversed = step.status === "reversed";

                return (
                  <div key={idx} style={{ display: "flex", gap: "14px", position: "relative", zIndex: 1 }}>
                    <div
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        background: isStepCompleted
                          ? "#00E599"
                          : isStepFailed
                          ? "#FF4D4D"
                          : isStepReversed
                          ? "#A855F7"
                          : "#087BFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 0 10px rgba(0,0,0,0.5)",
                        flexShrink: 0
                      }}
                    >
                      {isStepCompleted && <CheckCircle2 size={16} color="#050D1B" />}
                      {isStepFailed && <XCircle size={16} color="#FFFFFF" />}
                      {isStepReversed && <RefreshCw size={14} color="#FFFFFF" />}
                      {!isStepCompleted && !isStepFailed && !isStepReversed && (
                        <Clock size={15} color="#FFFFFF" />
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#FFFFFF" }}>
                          {step.title}
                        </div>
                        {step.timestamp && (
                          <div style={{ fontSize: "11px", color: "#8BA2C1" }}>
                            {formatDate(step.timestamp)}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: "12px", color: "#8BA2C1", marginTop: "3px" }}>
                        {step.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Admin Cancel Action (for pending transfers only) */}
          {isPending && (
            <div
              style={{
                background: "rgba(255, 77, 77, 0.08)",
                border: "1px solid rgba(255, 77, 77, 0.25)",
                borderRadius: "10px",
                padding: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px"
              }}
            >
              <div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#FF6B6B" }}>
                  Authorized Admin Actions
                </div>
                <div style={{ fontSize: "11.5px", color: "#8BA2C1", marginTop: "2px" }}>
                  This transfer is currently pending. Cancel to release funds immediately.
                </div>
              </div>

              <button
                onClick={handleCancelTransfer}
                disabled={cancelling}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: "#FF4D4D",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: cancelling ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(255, 77, 77, 0.4)"
                }}
              >
                {cancelling ? <RefreshCw size={13} className="spin" /> : <Ban size={13} />}
                {cancelling ? "Cancelling..." : "Cancel Transfer"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
