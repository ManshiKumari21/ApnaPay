import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Smartphone,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Copy,
  Check,
  User,
  Zap,
  Percent,
  Calendar,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Hash,
  ExternalLink,
  Layers
} from "lucide-react";

export default function RechargeDetailsModal({ order, isOpen, onClose }) {
  const [copiedKey, setCopiedKey] = useState(null);

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

  if (!isOpen || !order) return null;

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
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const status = String(order.status || "pending").toLowerCase();
  const isSuccess = status === "success" || status === "successful";
  const isPending = status === "pending" || status === "initiated";
  const isProcessing = status === "processing";
  const isReversed = status === "reversed";
  const isFailed = status === "failed";

  const renderStatusBadge = () => {
    if (isSuccess) {
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
          <CheckCircle2 size={13} /> SUCCESSFUL & DELIVERED
        </span>
      );
    }
    if (isProcessing) {
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
            color: "#00D5FF",
            background: "rgba(0, 213, 255, 0.12)",
            border: "1px solid rgba(0, 213, 255, 0.3)"
          }}
        >
          <Clock size={13} /> PROCESSING AT OPERATOR
        </span>
      );
    }
    if (isPending) {
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
          <Clock size={13} /> PENDING GATEWAY CONFIRMATION
        </span>
      );
    }
    if (isReversed) {
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
            color: "#A855F7",
            background: "rgba(168, 85, 247, 0.12)",
            border: "1px solid rgba(168, 85, 247, 0.3)"
          }}
        >
          <RotateCcw size={13} /> REVERSED / REFUNDED
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
          color: "#FF4D4D",
          background: "rgba(255, 77, 77, 0.12)",
          border: "1px solid rgba(255, 77, 77, 0.3)"
        }}
      >
        <XCircle size={13} /> OPERATOR FAILED
      </span>
    );
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
          maxWidth: "560px",
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
              <Smartphone size={20} color="#00D5FF" />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>
                Recharge Order #{order.id}
              </h3>
              <p style={{ fontSize: "12px", color: "#8BA2C1", margin: "2px 0 0 0" }}>
                {order.operator_name} • {order.service_type || "Prepaid"}
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

        {/* Hero Amount & Status Card */}
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
              Recharge Amount
            </div>
            <div style={{ fontSize: "26px", fontWeight: "800", color: "#FFFFFF", marginTop: "2px" }}>
              {formatINR(order.amount)}
            </div>
            <div style={{ fontSize: "11.5px", color: "#00E599", marginTop: "2px", fontWeight: "600" }}>
              Platform Commission: {formatINR(order.commission)}
            </div>
          </div>
          <div>{renderStatusBadge()}</div>
        </div>

        {/* Details Grid */}
        <div
          style={{
            background: "#0B1D35",
            border: "1px solid #16365C",
            borderRadius: "10px",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "9px",
            fontSize: "12.5px",
            marginBottom: "16px"
          }}
        >
          {/* Customer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#8BA2C1", display: "flex", alignItems: "center", gap: "5px" }}>
              <User size={13} color="#087BFF" /> Customer:
            </span>
            <span style={{ color: "#FFFFFF", fontWeight: "700" }}>
              {order.user_name} (#USR-{order.user_id})
            </span>
          </div>

          {/* Masked Mobile */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#8BA2C1", display: "flex", alignItems: "center", gap: "5px" }}>
              <Smartphone size={13} color="#00D5FF" /> Target Number:
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "#FFFFFF", fontFamily: "monospace", fontWeight: "600" }}>
                {order.masked_mobile || order.mobile_number}
              </span>
              <button
                onClick={() => handleCopy(order.mobile_number, "mob")}
                style={{ background: "transparent", border: "none", color: copiedKey === "mob" ? "#00E599" : "#627B9B", cursor: "pointer", padding: "2px" }}
                title="Copy Mobile Number"
              >
                {copiedKey === "mob" ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>

          {/* Operator */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#8BA2C1", display: "flex", alignItems: "center", gap: "5px" }}>
              <Zap size={13} color="#FFB020" /> Operator / Circle:
            </span>
            <span style={{ color: "#FFFFFF", fontWeight: "600" }}>
              {order.operator_name} ({order.operator_code || "TELECOM"})
            </span>
          </div>

          {/* Plan Details */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#8BA2C1", display: "flex", alignItems: "center", gap: "5px" }}>
              <Layers size={13} color="#A855F7" /> Plan Applied:
            </span>
            <span style={{ color: "#00D5FF", fontWeight: "600" }}>
              {order.plan_name || "Custom Talktime / Data Top-up"}
            </span>
          </div>

          {/* Provider Ref */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#8BA2C1" }}>Provider Ref ID:</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "#8BA2C1", fontFamily: "monospace", fontSize: "11px" }}>
                {order.provider_reference}
              </span>
              <button
                onClick={() => handleCopy(order.provider_reference, "ref")}
                style={{ background: "transparent", border: "none", color: copiedKey === "ref" ? "#00E599" : "#627B9B", cursor: "pointer", padding: "2px" }}
                title="Copy Provider Reference"
              >
                {copiedKey === "ref" ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>

          {/* Request Time */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#8BA2C1", display: "flex", alignItems: "center", gap: "5px" }}>
              <Calendar size={13} color="#8BA2C1" /> Initiated At:
            </span>
            <span style={{ color: "#FFFFFF" }}>{formatDate(order.created_at)}</span>
          </div>

          {/* Completion Time */}
          {order.completion_time && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#8BA2C1" }}>Completed At:</span>
              <span style={{ color: "#00E599" }}>{formatDate(order.completion_time)}</span>
            </div>
          )}

          {/* Failure Reason */}
          {order.failure_reason && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#FF4D4D" }}>Failure Reason:</span>
              <span style={{ color: "#FF6B6B", fontWeight: "600" }}>{order.failure_reason}</span>
            </div>
          )}
        </div>

        {/* Transaction Timeline */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "12px", color: "#8BA2C1", fontWeight: "700", textTransform: "uppercase", marginBottom: "10px", letterSpacing: "0.5px" }}>
            Transaction Lifecycle Timeline
          </div>

          <div
            style={{
              background: "#050D1B",
              border: "1px solid #16365C",
              borderRadius: "10px",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}
          >
            {/* Step 1: Initiated */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "#00E599",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#050D1B",
                  fontSize: "11px",
                  fontWeight: "bold",
                  flexShrink: 0
                }}
              >
                ✓
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#FFFFFF" }}>
                  Order Initiated & Escrow Reserved
                </div>
                <div style={{ fontSize: "11px", color: "#8BA2C1" }}>
                  User wallet authorized for {formatINR(order.amount)} via ApnaPay Core.
                </div>
              </div>
            </div>

            {/* Step 2: Gateway Switched */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: isSuccess || isProcessing ? "#00E599" : isPending ? "#FFB020" : "#FF4D4D",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#050D1B",
                  fontSize: "11px",
                  fontWeight: "bold",
                  flexShrink: 0
                }}
              >
                {isSuccess || isProcessing ? "✓" : isPending ? "•" : "✕"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#FFFFFF" }}>
                  Operator Gateway Dispatch
                </div>
                <div style={{ fontSize: "11px", color: "#8BA2C1" }}>
                  Forwarded to BBPS / {order.operator_name} direct API bridge.
                </div>
              </div>
            </div>

            {/* Step 3: Final Settlement */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: isSuccess ? "#00E599" : isProcessing ? "#00D5FF" : isPending ? "#627B9B" : isReversed ? "#A855F7" : "#FF4D4D",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#050D1B",
                  fontSize: "11px",
                  fontWeight: "bold",
                  flexShrink: 0
                }}
              >
                {isSuccess ? "✓" : isProcessing ? "•" : isReversed ? "↺" : isFailed ? "✕" : "3"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#FFFFFF" }}>
                  {isSuccess ? "Recharge Confirmed & Succeeded" : isProcessing ? "Pending Operator SLA" : isReversed ? "Reversed to User Wallet" : isFailed ? "Operator Delivery Failed" : "Awaiting Final Settlement"}
                </div>
                <div style={{ fontSize: "11px", color: "#8BA2C1" }}>
                  {isSuccess ? `Operator confirmed delivery with reference ${order.provider_reference}` : isReversed ? "Refund processed back to source wallet" : isFailed ? "Recharge failed at operator network" : "Awaiting final confirmation response"}
                </div>
              </div>
            </div>
          </div>
        </div>

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
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          Close
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
