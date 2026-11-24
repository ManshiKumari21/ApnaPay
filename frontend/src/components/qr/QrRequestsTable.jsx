import React, { useState } from "react";
import {
  Smartphone,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Info,
  CreditCard,
  Ban,
  Eye
} from "lucide-react";

export default function QrRequestsTable({
  paymentRequests = [],
  loading = false,
  onPayRequest,
  onCancelRequest,
  onViewRequest
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [copiedId, setCopiedId] = useState(null);
  const [processingId, setProcessingId] = useState(null);

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

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderStatusBadge = (status) => {
    const s = String(status || "pending").toLowerCase();

    if (s === "paid") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: "700",
            color: "#00E599",
            background: "rgba(0, 229, 153, 0.12)",
            border: "1px solid rgba(0, 229, 153, 0.3)"
          }}
        >
          <CheckCircle2 size={11} /> PAID
        </span>
      );
    }

    if (s === "pending") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: "700",
            color: "#FFB020",
            background: "rgba(255, 176, 32, 0.12)",
            border: "1px solid rgba(255, 176, 32, 0.3)"
          }}
        >
          <Clock size={11} /> PENDING
        </span>
      );
    }

    if (s === "cancelled") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: "700",
            color: "#8BA2C1",
            background: "rgba(139, 162, 193, 0.12)",
            border: "1px solid rgba(139, 162, 193, 0.3)"
          }}
        >
          <Ban size={11} /> CANCELLED
        </span>
      );
    }

    if (s === "expired") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: "700",
            color: "#A855F7",
            background: "rgba(168, 85, 247, 0.12)",
            border: "1px solid rgba(168, 85, 247, 0.3)"
          }}
        >
          <Clock size={11} /> EXPIRED
        </span>
      );
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "2px 8px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: "700",
          color: "#FF4D4D",
          background: "rgba(255, 77, 77, 0.12)",
          border: "1px solid rgba(255, 77, 77, 0.3)"
        }}
      >
        <XCircle size={11} /> FAILED
      </span>
    );
  };

  const total = paymentRequests.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginatedRequests = paymentRequests.slice((page - 1) * pageSize, page * pageSize);

  const handlePay = async (req) => {
    if (!onPayRequest) return;
    setProcessingId(req.id);
    try {
      await onPayRequest(req);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (req) => {
    if (!onCancelRequest) return;
    setProcessingId(req.id);
    try {
      await onCancelRequest(req);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div
      style={{
        background: "#071426",
        border: "1px solid #16365C",
        borderRadius: "14px",
        overflow: "hidden",
        boxShadow: "0 6px 24px rgba(0, 0, 0, 0.35)",
        marginBottom: "24px"
      }}
    >
      {/* Table Header Bar */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #16365C",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          background: "#0B1D35"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Smartphone size={18} color="#00D5FF" />
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>
            Recent QR Scan & Payment Requests
          </h3>
          <span
            style={{
              fontSize: "11px",
              color: "#8BA2C1",
              background: "#071426",
              padding: "2px 8px",
              borderRadius: "12px",
              border: "1px solid #16365C"
            }}
          >
            {total} Total Requests
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "#8BA2C1" }}>Show:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            style={{
              background: "#071426",
              border: "1px solid #16365C",
              borderRadius: "6px",
              color: "#FFFFFF",
              fontSize: "12px",
              padding: "4px 8px",
              cursor: "pointer",
              outline: "none"
            }}
          >
            <option value={10}>10 records</option>
            <option value={25}>25 records</option>
            <option value={50}>50 records</option>
          </select>
        </div>
      </div>

      {/* Table Wrapper */}
      <div style={{ overflowX: "auto", width: "100%" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12.5px",
            textAlign: "left"
          }}
        >
          <thead>
            <tr
              style={{
                background: "#050D1B",
                borderBottom: "1px solid #16365C",
                color: "#8BA2C1",
                textTransform: "uppercase",
                fontSize: "11px",
                letterSpacing: "0.5px"
              }}
            >
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Request ID</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>QR Reference</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Merchant Name</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Customer / Payer</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Amount</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Payment Method</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Transaction ID</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Payment Status</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Date & Time</th>
              <th style={{ padding: "12px 14px", fontWeight: "700", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #0F2542" }}>
                  <td colSpan={10} style={{ padding: "16px 20px" }}>
                    <div
                      style={{
                        height: "18px",
                        background: "linear-gradient(90deg, #0B1D35 25%, #16365C 50%, #0B1D35 75%)",
                        backgroundSize: "200% 100%",
                        borderRadius: "4px"
                      }}
                      className="skeleton-pulse"
                    />
                  </td>
                </tr>
              ))
            ) : paginatedRequests.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: "35px 20px", textAlign: "center", color: "#8BA2C1" }}>
                  <Info size={24} color="#087BFF" style={{ marginBottom: "6px" }} />
                  <div style={{ color: "#FFFFFF", fontWeight: "600", fontSize: "14px" }}>
                    No QR scan requests found
                  </div>
                  <div style={{ fontSize: "12px", marginTop: "2px" }}>
                    Scan requests initiated by customers will appear here in real-time.
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRequests.map((r) => {
                const isPending = String(r.status || "").toLowerCase() === "pending";
                const isPaid = String(r.status || "").toLowerCase() === "paid";
                const qrRefDisplay = r.qr_reference ? String(r.qr_reference).substring(0, 10) + "..." : `#QR-${r.qr_id}`;

                return (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: "1px solid #0F2542",
                      transition: "background-color 0.15s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0B1D35")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {/* 1. Request ID */}
                    <td style={{ padding: "12px 14px", fontWeight: "700" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onViewRequest) onViewRequest(r);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#00D5FF",
                          padding: 0,
                          margin: 0,
                          font: "inherit",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          textDecoration: "underline",
                          textUnderlineOffset: "3px"
                        }}
                        title="Click to view payment request details"
                      >
                        #REQ-{r.id}
                      </button>
                    </td>

                    {/* 2. QR Reference */}
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontFamily: "monospace", color: "#8BA2C1", fontSize: "11px" }}>
                          {qrRefDisplay}
                        </span>
                        {r.qr_reference && (
                          <button
                            onClick={() => handleCopy(r.qr_reference, `qr_${r.id}`)}
                            style={{ background: "transparent", border: "none", color: copiedId === `qr_${r.id}` ? "#00E599" : "#627B9B", cursor: "pointer" }}
                            title="Copy full QR reference"
                          >
                            {copiedId === `qr_${r.id}` ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 3. Merchant Name */}
                    <td style={{ padding: "12px 14px", color: "#FFFFFF", fontWeight: "600" }}>
                      {r.merchant_name || "Merchant Store"}
                    </td>

                    {/* 4. Customer / Payer */}
                    <td style={{ padding: "12px 14px", color: "#8BA2C1" }}>
                      {r.payer_name || "Customer Payer"}
                    </td>

                    {/* 5. Amount */}
                    <td style={{ padding: "12px 14px", color: "#FFFFFF", fontWeight: "700", fontSize: "13px" }}>
                      {formatINR(r.amount)}
                    </td>

                    {/* 6. Payment Method */}
                    <td style={{ padding: "12px 14px", color: "#8BA2C1", fontSize: "11.5px" }}>
                      {r.payment_method || "UPI Scan & Pay"}
                    </td>

                    {/* 7. Transaction ID */}
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontFamily: "monospace", color: isPaid ? "#00E599" : "#8BA2C1", fontSize: "11px" }}>
                          {r.transaction_reference || "—"}
                        </span>
                        {r.transaction_reference && (
                          <button
                            onClick={() => handleCopy(r.transaction_reference, `txn_${r.id}`)}
                            style={{ background: "transparent", border: "none", color: copiedId === `txn_${r.id}` ? "#00E599" : "#627B9B", cursor: "pointer" }}
                            title="Copy transaction ID"
                          >
                            {copiedId === `txn_${r.id}` ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 8. Payment Status */}
                    <td style={{ padding: "12px 14px" }}>
                      {renderStatusBadge(r.status)}
                    </td>

                    {/* 9. Date & Time */}
                    <td style={{ padding: "12px 14px", color: "#8BA2C1", fontSize: "11.5px", whiteSpace: "nowrap" }}>
                      {formatDate(r.created_at)}
                    </td>

                    {/* 10. Actions */}
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        {/* If Pending, allow Pay via Gateway / Cancel */}
                        {isPending && (
                          <>
                            <button
                              onClick={() => handlePay(r)}
                              disabled={processingId === r.id}
                              style={{
                                background: "rgba(0, 229, 153, 0.15)",
                                border: "1px solid rgba(0, 229, 153, 0.35)",
                                color: "#00E599",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "11px",
                                fontWeight: "700"
                              }}
                              title="Authorize & Pay via Gateway"
                            >
                              Pay Now
                            </button>

                            <button
                              onClick={() => handleCancel(r)}
                              disabled={processingId === r.id}
                              style={{
                                background: "rgba(255, 77, 77, 0.12)",
                                border: "1px solid rgba(255, 77, 77, 0.3)",
                                color: "#FF6B6B",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "11px"
                              }}
                              title="Cancel pending scan request"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onViewRequest) onViewRequest(r);
                          }}
                          style={{
                            background: "rgba(8, 123, 255, 0.16)",
                            border: "1px solid rgba(0, 213, 255, 0.5)",
                            color: "#00D5FF",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontWeight: "700",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                          title="View Request Details & Timeline"
                        >
                          <Eye size={12} />
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div
        style={{
          padding: "12px 20px",
          borderTop: "1px solid #16365C",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          background: "#0B1D35"
        }}
      >
        <div style={{ fontSize: "12px", color: "#8BA2C1" }}>
          Showing page <span style={{ color: "#FFFFFF", fontWeight: "700" }}>{page}</span> of{" "}
          <span style={{ color: "#FFFFFF", fontWeight: "700" }}>{totalPages}</span> ({total} requests)
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "5px 10px",
              borderRadius: "6px",
              background: page <= 1 ? "#071426" : "#0B1D35",
              border: "1px solid #16365C",
              color: page <= 1 ? "#627B9B" : "#FFFFFF",
              fontSize: "12px",
              cursor: page <= 1 ? "not-allowed" : "pointer"
            }}
          >
            <ChevronLeft size={13} /> Prev
          </button>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "5px 10px",
              borderRadius: "6px",
              background: page >= totalPages ? "#071426" : "#0B1D35",
              border: "1px solid #16365C",
              color: page >= totalPages ? "#627B9B" : "#FFFFFF",
              fontSize: "12px",
              cursor: page >= totalPages ? "not-allowed" : "pointer"
            }}
          >
            Next <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
