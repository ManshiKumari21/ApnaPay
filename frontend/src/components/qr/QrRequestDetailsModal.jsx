import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  CreditCard,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  User,
  Store,
  Calendar,
  IndianRupee,
  Smartphone,
  ShieldCheck,
  Hash,
  ArrowRight,
  ExternalLink
} from "lucide-react";

export default function QrRequestDetailsModal({
  request,
  isOpen,
  onClose,
  onPay,
  onCancel
}) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !request) return null;

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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
      minute: "2-digit"
    });
  };

  const status = String(request.status || "pending").toLowerCase();

  const renderStatusBadge = () => {
    if (status === "paid" || status === "completed") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 12px",
            borderRadius: "14px",
            fontSize: "12px",
            fontWeight: "700",
            color: "#00E599",
            background: "rgba(0, 229, 153, 0.12)",
            border: "1px solid rgba(0, 229, 153, 0.3)"
          }}
        >
          <CheckCircle2 size={13} /> PAID & SETTLED
        </span>
      );
    }
    if (status === "pending") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 12px",
            borderRadius: "14px",
            fontSize: "12px",
            fontWeight: "700",
            color: "#FFB020",
            background: "rgba(255, 176, 32, 0.12)",
            border: "1px solid rgba(255, 176, 32, 0.3)"
          }}
        >
          <Clock size={13} /> PENDING AUTHORIZATION
        </span>
      );
    }
    if (status === "cancelled") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 12px",
            borderRadius: "14px",
            fontSize: "12px",
            fontWeight: "700",
            color: "#8BA2C1",
            background: "rgba(139, 162, 193, 0.12)",
            border: "1px solid rgba(139, 162, 193, 0.3)"
          }}
        >
          <Ban size={13} /> CANCELLED
        </span>
      );
    }
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "4px 12px",
          borderRadius: "14px",
          fontSize: "12px",
          fontWeight: "700",
          color: "#FF6B6B",
          background: "rgba(255, 77, 77, 0.12)",
          border: "1px solid rgba(255, 77, 77, 0.3)"
        }}
      >
        <XCircle size={13} /> FAILED
      </span>
    );
  };

  const handlePayClick = async () => {
    if (!onPay) return;
    setActionLoading(true);
    try {
      await onPay(request);
      onClose();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelClick = async () => {
    if (!onCancel) return;
    setActionLoading(true);
    try {
      await onCancel(request);
      onClose();
    } finally {
      setActionLoading(false);
    }
  };

  const modalContent = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(2, 6, 17, 0.85)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        padding: "16px",
        overflowY: "auto"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          backgroundColor: "#071426",
          border: "1px solid #16365C",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(8, 123, 255, 0.15)",
          position: "relative",
          margin: "auto",
          animation: "modalZoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "14px",
            borderBottom: "1px solid #16365C",
            marginBottom: "16px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "rgba(8, 123, 255, 0.15)",
                border: "1px solid rgba(8, 123, 255, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 12px rgba(0, 213, 255, 0.2)"
              }}
            >
              <CreditCard size={20} color="#00D5FF" />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>
                QR Payment Request #{request.id}
              </h3>
              <p style={{ fontSize: "12px", color: "#8BA2C1", margin: "2px 0 0 0" }}>
                Scan-to-Pay Transaction Details
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "#0B1D35",
              border: "1px solid #16365C",
              color: "#8BA2C1",
              padding: "6px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease"
            }}
            title="Close (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Amount & Status Hero Card */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(8, 123, 255, 0.12) 0%, rgba(0, 213, 255, 0.06) 100%)",
            border: "1px solid rgba(0, 213, 255, 0.25)",
            borderRadius: "12px",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px"
          }}
        >
          <div>
            <div style={{ fontSize: "11px", color: "#8BA2C1", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Total Request Amount
            </div>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", marginTop: "2px" }}>
              {formatINR(request.amount)}
            </div>
            <div style={{ fontSize: "11.5px", color: "#00D5FF", marginTop: "2px" }}>
              {request.payment_method || "UPI Scan & Pay"}
            </div>
          </div>
          <div>{renderStatusBadge()}</div>
        </div>

        {/* Request Details Grid */}
        <div
          style={{
            background: "#0B1D35",
            border: "1px solid #16365C",
            borderRadius: "10px",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            fontSize: "12.5px",
            marginBottom: "16px"
          }}
        >
          {/* Merchant */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#8BA2C1", display: "flex", alignItems: "center", gap: "5px" }}>
              <Store size={13} color="#087BFF" /> Beneficiary Merchant:
            </span>
            <span style={{ color: "#FFFFFF", fontWeight: "700" }}>
              {request.merchant_name || "Merchant Store"}
            </span>
          </div>

          {/* Customer / Payer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#8BA2C1", display: "flex", alignItems: "center", gap: "5px" }}>
              <User size={13} color="#00E599" /> Customer / Payer:
            </span>
            <span style={{ color: "#FFFFFF", fontWeight: "700" }}>
              {request.payer_name || "Guest Customer"}
            </span>
          </div>

          {/* QR ID */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#8BA2C1" }}>Associated QR Code:</span>
            <span style={{ color: "#00D5FF", fontWeight: "700" }}>
              {request.qr_id ? `#QR-${request.qr_id}` : "Dynamic Session"}
            </span>
          </div>

          {/* Transaction ID */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#8BA2C1" }}>Transaction ID:</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "#FFFFFF", fontFamily: "monospace", fontSize: "11.5px" }}>
                {request.transaction_reference || `TXN-QR-${request.id}`}
              </span>
              <button
                onClick={() => handleCopy(request.transaction_reference || `TXN-QR-${request.id}`, "txn")}
                style={{ background: "transparent", border: "none", color: copiedKey === "txn" ? "#00E599" : "#8BA2C1", cursor: "pointer", padding: "2px" }}
                title="Copy Transaction ID"
              >
                {copiedKey === "txn" ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>

          {/* Reference ID */}
          {request.reference_id && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#8BA2C1" }}>Request Reference:</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#8BA2C1", fontFamily: "monospace", fontSize: "11px" }}>
                  {request.reference_id}
                </span>
                <button
                  onClick={() => handleCopy(request.reference_id, "ref")}
                  style={{ background: "transparent", border: "none", color: copiedKey === "ref" ? "#00E599" : "#8BA2C1", cursor: "pointer", padding: "2px" }}
                  title="Copy Reference"
                >
                  {copiedKey === "ref" ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          )}

          {/* Date & Time */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#8BA2C1", display: "flex", alignItems: "center", gap: "5px" }}>
              <Calendar size={13} color="#8BA2C1" /> Created Date & Time:
            </span>
            <span style={{ color: "#FFFFFF" }}>{formatDate(request.created_at)}</span>
          </div>
        </div>

        {/* Action Controls for Pending Requests */}
        {status === "pending" && (
          <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
            <button
              onClick={handlePayClick}
              disabled={actionLoading}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "10px",
                borderRadius: "8px",
                background: "linear-gradient(13deg, #00E599 0%, #00C880 100%)",
                border: "none",
                color: "#050D1B",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(0, 229, 153, 0.3)"
              }}
            >
              <CheckCircle2 size={15} /> Authorize & Pay
            </button>

            <button
              onClick={handleCancelClick}
              disabled={actionLoading}
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                background: "rgba(255, 77, 77, 0.12)",
                border: "1px solid rgba(255, 77, 77, 0.3)",
                color: "#FF6B6B",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              Cancel Request
            </button>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            background: "#0B1D35",
            border: "1px solid #16365C",
            color: "#8BA2C1",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          Close
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
