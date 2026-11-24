import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  QrCode,
  Download,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Store,
  Calendar,
  IndianRupee,
  Smartphone,
  ShieldCheck,
  Hash,
  Clock
} from "lucide-react";

export default function QrDetailsModal({ qr, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  // Lock body scroll and handle Escape key while modal is open
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

  if (!isOpen || !qr) return null;

  const paymentUrl =
    qr.payment_url ||
    `${window.location.origin}/pay/${qr.qr_reference || qr.public_id || qr.id}`;

  const handleCopyLink = () => {
    if (!paymentUrl) return;
    navigator.clipboard.writeText(paymentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (qr.qr_image) {
      const a = document.createElement("a");
      a.href = qr.qr_image;
      a.download = `ApnaPay-QR-${qr.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Fallback: create canvas on the fly
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, 320, 320);
    ctx.fillStyle = "#0B1D35";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ApnaPay QR #" + qr.id, 160, 160);
    const link = document.createElement("a");
    link.download = `ApnaPay-QR-${qr.id}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
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

  const isActive = String(qr.status || "active").toLowerCase() === "active";
  const isDynamic = String(qr.qr_type || "static").toLowerCase() === "dynamic";

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
          maxWidth: "480px",
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
              <QrCode size={20} color="#00D5FF" />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>
                QR Code Details (#{qr.id})
              </h3>
              <p style={{ fontSize: "12px", color: "#8BA2C1", margin: "2px 0 0 0" }}>
                {isDynamic ? "Dynamic Invoice QR Code" : "Merchant Store Counter QR"}
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

        {/* QR Preview Card */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "16px" }}>
          <div
            style={{
              background: "#FFFFFF",
              padding: "14px",
              borderRadius: "14px",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 213, 255, 0.15)",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {qr.qr_image ? (
              <img
                src={qr.qr_image}
                alt={`QR Code #${qr.id}`}
                style={{ width: "190px", height: "190px", display: "block", objectFit: "contain" }}
              />
            ) : (
              <div
                style={{
                  width: "190px",
                  height: "190px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#071426",
                  borderRadius: "8px",
                  gap: "8px"
                }}
              >
                <QrCode size={48} color="#00D5FF" />
                <span style={{ fontSize: "11px", color: "#8BA2C1" }}>Generating Preview...</span>
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                display: "inline-block",
                padding: "3px 10px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: "700",
                color: isDynamic ? "#00D5FF" : "#087BFF",
                background: isDynamic ? "rgba(0, 213, 255, 0.12)" : "rgba(8, 123, 255, 0.12)",
                border: `1px solid ${isDynamic ? "rgba(0, 213, 255, 0.3)" : "rgba(8, 123, 255, 0.3)"}`
              }}
            >
              {isDynamic ? "DYNAMIC QR" : "STATIC QR"}
            </span>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px 10px",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: "700",
                color: isActive ? "#00E599" : "#8BA2C1",
                background: isActive ? "rgba(0, 229, 153, 0.12)" : "rgba(139, 162, 193, 0.12)",
                border: `1px solid ${isActive ? "rgba(0, 229, 153, 0.3)" : "rgba(139, 162, 193, 0.3)"}`
              }}
            >
              {isActive ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
              {isActive ? "ACTIVE" : "INACTIVE"}
            </span>
          </div>
        </div>

        {/* Metadata Grid */}
        <div
          style={{
            background: "#0B1D35",
            border: "1px solid #16365C",
            borderRadius: "10px",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "9px",
            fontSize: "12.5px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#8BA2C1", display: "flex", alignItems: "center", gap: "5px" }}>
              <Store size={13} color="#087BFF" /> Merchant / Store:
            </span>
            <span style={{ color: "#FFFFFF", fontWeight: "700" }}>
              {qr.merchant_name || `Merchant #${qr.user_id}`}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#8BA2C1" }}>Purpose / Note:</span>
            <span style={{ color: "#FFFFFF" }}>{qr.purpose || "Payment Collection"}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#8BA2C1", display: "flex", alignItems: "center", gap: "5px" }}>
              <IndianRupee size={13} color="#00E599" /> Fixed Amount:
            </span>
            <span style={{ color: "#00D5FF", fontWeight: "700" }}>
              {qr.fixed_amount !== null && Number(qr.fixed_amount) > 0
                ? formatINR(qr.fixed_amount)
                : "Open Amount (Customer Enters)"}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#8BA2C1", display: "flex", alignItems: "center", gap: "5px" }}>
              <Smartphone size={13} color="#087BFF" /> Total Scans:
            </span>
            <span style={{ color: "#FFFFFF", fontWeight: "600" }}>{qr.scan_count || 0} scans</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#8BA2C1" }}>Total Collected:</span>
            <span style={{ color: "#00E599", fontWeight: "700" }}>
              {formatINR(qr.total_collection)}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#8BA2C1", display: "flex", alignItems: "center", gap: "5px" }}>
              <Clock size={13} color="#8BA2C1" /> Created Date:
            </span>
            <span style={{ color: "#FFFFFF" }}>{formatDate(qr.created_at)}</span>
          </div>

          {qr.qr_reference && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#8BA2C1" }}>Reference:</span>
              <span style={{ color: "#8BA2C1", fontFamily: "monospace", fontSize: "11px" }}>
                {qr.qr_reference}
              </span>
            </div>
          )}
        </div>

        {/* Scan & Pay URL Strip */}
        <div
          style={{
            background: "#0B1D35",
            border: "1px solid #16365C",
            borderRadius: "8px",
            padding: "8px 12px",
            marginTop: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <span
            style={{
              fontSize: "11.5px",
              color: "#8BA2C1",
              fontFamily: "monospace",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {paymentUrl}
          </span>
          <button
            onClick={handleCopyLink}
            style={{
              background: copied ? "rgba(0, 229, 153, 0.15)" : "transparent",
              border: "none",
              color: copied ? "#00E599" : "#00D5FF",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              gap: "3px",
              fontSize: "11px",
              fontWeight: "600"
            }}
            title="Copy payment link"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
          <button
            onClick={handleDownload}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "10px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #087BFF 0%, #00D5FF 100%)",
              border: "none",
              color: "#FFFFFF",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(0, 213, 255, 0.3)"
            }}
          >
            <Download size={15} /> Download High-Res PNG
          </button>

          <button
            onClick={onClose}
            style={{
              padding: "10px 18px",
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
    </div>
  );

  return createPortal(modalContent, document.body);
}
