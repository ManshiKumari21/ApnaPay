import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  QrCode,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import api from "../../services/api";

export default function CreateQrModal({
  isOpen,
  initialType = "static",
  onClose,
  onQrCreated
}) {
  const [qrType, setQrType] = useState(initialType);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [createdQr, setCreatedQr] = useState(null);
  const [copied, setCopied] = useState(false);

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

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (qrType === "dynamic" && (!amount || Number(amount) <= 0)) {
      setError("Please specify a valid fixed amount greater than 0 for dynamic QR.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        qr_type: qrType,
        title: title.trim() || (qrType === "static" ? "Merchant Store Counter QR" : "Dynamic Invoice QR"),
        amount: qrType === "dynamic" ? Number(amount) : null
      };

      const res = await api.post("/qr/create", payload);
      if (res.data?.success) {
        setCreatedQr(res.data.data);
        if (onQrCreated) onQrCreated();
      } else {
        setError(res.data?.message || "Failed to create QR code");
      }
    } catch (err) {
      console.error("Create QR error:", err);
      setError(err.response?.data?.message || "Unable to create QR code. Check server connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = () => {
    if (!createdQr?.qr_image) return;
    const a = document.createElement("a");
    a.href = createdQr.qr_image;
    a.download = `ApnaPay-QR-${createdQr.id || "code"}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = () => {
    if (!createdQr?.payment_url) return;
    navigator.clipboard.writeText(createdQr.payment_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          maxWidth: "480px",
          backgroundColor: "#071426",
          border: "1px solid #16365C",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.6)",
          position: "relative"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "16px",
            borderBottom: "1px solid #16365C",
            marginBottom: "18px"
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
              <QrCode size={18} color="#00D5FF" />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>
                {createdQr ? "QR Code Created!" : "Generate New QR Code"}
              </h3>
              <p style={{ fontSize: "12px", color: "#8BA2C1", margin: "2px 0 0 0" }}>
                {createdQr ? "Scan or download your ready-to-use QR code" : "Create static merchant or dynamic invoice QRs"}
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
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Error alert */}
        {error && (
          <div
            style={{
              marginBottom: "16px",
              padding: "10px 14px",
              background: "rgba(255, 77, 77, 0.12)",
              border: "1px solid rgba(255, 77, 77, 0.3)",
              borderRadius: "8px",
              color: "#FF6B6B",
              fontSize: "12.5px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* View Mode: Success with Download */}
        {createdQr ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div
              style={{
                background: "#FFFFFF",
                padding: "16px",
                borderRadius: "12px",
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.5)",
                marginBottom: "16px"
              }}
            >
              <img
                src={createdQr.qr_image}
                alt="Generated QR"
                style={{ width: "200px", height: "200px", display: "block" }}
              />
            </div>

            <div style={{ color: "#FFFFFF", fontSize: "16px", fontWeight: "700" }}>
              {createdQr.qr_type.toUpperCase()} QR CODE
            </div>
            <div style={{ color: "#00D5FF", fontSize: "13px", fontWeight: "600", marginTop: "2px" }}>
              {createdQr.amount ? `Fixed Amount: ₹${createdQr.amount}` : "Open Amount Counter QR"}
            </div>

            {/* Direct Link */}
            <div
              style={{
                width: "100%",
                background: "#0B1D35",
                border: "1px solid #16365C",
                borderRadius: "8px",
                padding: "8px 12px",
                marginTop: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <span style={{ fontSize: "11.5px", color: "#8BA2C1", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "340px" }}>
                {createdQr.payment_url}
              </span>
              <button
                onClick={handleCopyLink}
                style={{ background: "transparent", border: "none", color: copied ? "#00E599" : "#00D5FF", cursor: "pointer" }}
                title="Copy payment link"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px", width: "100%", marginTop: "18px" }}>
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
                  cursor: "pointer"
                }}
              >
                <Download size={15} /> Download PNG
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  background: "#0B1D35",
                  border: "1px solid #16365C",
                  color: "#8BA2C1",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form Mode: Create QR */
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* QR Type Switch */}
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#8BA2C1", marginBottom: "6px", fontWeight: "600" }}>
                Select QR Architecture:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setQrType("static")}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    background: qrType === "static" ? "rgba(8, 123, 255, 0.15)" : "#0B1D35",
                    border: qrType === "static" ? "1px solid #00D5FF" : "1px solid #16365C",
                    color: qrType === "static" ? "#00D5FF" : "#8BA2C1",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  <div style={{ fontWeight: "700", fontSize: "13px" }}>Static Counter QR</div>
                  <div style={{ fontSize: "11px", color: "#8BA2C1", marginTop: "2px" }}>
                    Customer inputs custom payment amount
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setQrType("dynamic")}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    background: qrType === "dynamic" ? "rgba(0, 213, 255, 0.15)" : "#0B1D35",
                    border: qrType === "dynamic" ? "1px solid #00D5FF" : "1px solid #16365C",
                    color: qrType === "dynamic" ? "#00D5FF" : "#8BA2C1",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  <div style={{ fontWeight: "700", fontSize: "13px" }}>Dynamic Invoice QR</div>
                  <div style={{ fontSize: "11px", color: "#8BA2C1", marginTop: "2px" }}>
                    Fixed amount auto-locked for invoice/order
                  </div>
                </button>
              </div>
            </div>

            {/* Purpose / Title */}
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#8BA2C1", marginBottom: "6px", fontWeight: "600" }}>
                Purpose / Merchant Store Name:
              </label>
              <input
                type="text"
                placeholder={qrType === "static" ? "e.g. Counter QR at Main Desk" : "e.g. Order #5521 Invoice"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "#0B1D35",
                  border: "1px solid #16365C",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  fontSize: "13px"
                }}
              />
            </div>

            {/* Amount (for dynamic QR) */}
            {qrType === "dynamic" && (
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#8BA2C1", marginBottom: "6px", fontWeight: "600" }}>
                  Fixed Payment Amount (₹): <span style={{ color: "#FF6B6B" }}>*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 499.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#0B1D35",
                    border: "1px solid #16365C",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "13px"
                  }}
                />
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button
                type="button"
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
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 22px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #087BFF 0%, #00D5FF 100%)",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: submitting ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 10px rgba(0, 213, 255, 0.3)"
                }}
              >
                {submitting ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} />}
                <span>{submitting ? "Generating..." : "Generate QR"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
