import React, { useState } from "react";
import {
  Eye,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeftRight,
  Landmark,
  ShieldAlert,
  Info
} from "lucide-react";

export default function TransfersTable({
  transfers = [],
  loading = false,
  error = null,
  pagination = { page: 1, limit: 10, total: 0, totalPages: 1 },
  onPageChange,
  onLimitChange,
  onViewDetails
}) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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

  // Safe Masking function
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
      return `•••• ${String(last4).slice(-4)}`;
    }
    return "•••• 4521";
  };

  // Mode badge renderer
  const renderModeBadge = (mode) => {
    const m = String(mode || "UPI").toUpperCase();
    const modeStyles = {
      UPI: { color: "#00D5FF", bg: "rgba(0, 213, 255, 0.12)", border: "rgba(0, 213, 255, 0.3)" },
      IMPS: { color: "#087BFF", bg: "rgba(8, 123, 255, 0.12)", border: "rgba(8, 123, 255, 0.3)" },
      NEFT: { color: "#F59E0B", bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.3)" },
      RTGS: { color: "#A855F7", bg: "rgba(168, 85, 247, 0.12)", border: "rgba(168, 85, 247, 0.3)" }
    };
    const s = modeStyles[m] || modeStyles.UPI;

    return (
      <span
        style={{
          display: "inline-block",
          padding: "2px 8px",
          borderRadius: "6px",
          fontSize: "11px",
          fontWeight: "700",
          color: s.color,
          background: s.bg,
          border: `1px solid ${s.border}`
        }}
      >
        {m}
      </span>
    );
  };

  // Status badge renderer
  const renderStatusBadge = (status) => {
    const s = String(status || "initiated").toLowerCase();

    if (["successful", "success", "completed"].includes(s)) {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "3px 9px",
            borderRadius: "20px",
            fontSize: "11px",
            fontWeight: "700",
            color: "#00E599",
            background: "rgba(0, 229, 153, 0.12)",
            border: "1px solid rgba(0, 229, 153, 0.3)"
          }}
        >
          <CheckCircle2 size={11} /> SUCCESSFUL
        </span>
      );
    }

    if (s === "processing") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "3px 9px",
            borderRadius: "20px",
            fontSize: "11px",
            fontWeight: "700",
            color: "#FFB020",
            background: "rgba(255, 176, 32, 0.12)",
            border: "1px solid rgba(255, 176, 32, 0.3)"
          }}
        >
          <Clock size={11} /> PROCESSING
        </span>
      );
    }

    if (s === "initiated") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "3px 9px",
            borderRadius: "20px",
            fontSize: "11px",
            fontWeight: "700",
            color: "#00D5FF",
            background: "rgba(0, 213, 255, 0.12)",
            border: "1px solid rgba(0, 213, 255, 0.3)"
          }}
        >
          <Send size={11} /> INITIATED
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
            padding: "3px 9px",
            borderRadius: "20px",
            fontSize: "11px",
            fontWeight: "700",
            color: "#F59E0B",
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.3)"
          }}
        >
          <Clock size={11} /> PENDING
        </span>
      );
    }

    if (s === "reversed") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "3px 9px",
            borderRadius: "20px",
            fontSize: "11px",
            fontWeight: "700",
            color: "#A855F7",
            background: "rgba(168, 85, 247, 0.12)",
            border: "1px solid rgba(168, 85, 247, 0.3)"
          }}
        >
          <ArrowLeftRight size={11} /> REVERSED
        </span>
      );
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "3px 9px",
          borderRadius: "20px",
          fontSize: "11px",
          fontWeight: "700",
          color: "#FF4D4D",
          background: "rgba(255, 77, 77, 0.12)",
          border: "1px solid rgba(255, 77, 77, 0.3)"
        }}
      >
        <XCircle size={11} /> {s.toUpperCase()}
      </span>
    );
  };

  const { page = 1, limit = 10, total = 0, totalPages = 1 } = pagination;

  return (
    <div
      style={{
        background: "#071426",
        border: "1px solid #16365C",
        borderRadius: "14px",
        overflow: "hidden",
        boxShadow: "0 6px 24px rgba(0, 0, 0, 0.35)"
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
          <Send size={16} color="#00D5FF" />
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>
            Money Transfer Records
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
            {total} Total
          </span>
        </div>

        {/* Records Per Page Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "#8BA2C1" }}>Show:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
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
            <option value={100}>100 records</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            padding: "16px 20px",
            background: "rgba(255, 77, 77, 0.1)",
            borderBottom: "1px solid rgba(255, 77, 77, 0.2)",
            color: "#FF6B6B",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Responsive Table Wrapper */}
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
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Transfer ID</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Sender Name</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Beneficiary Name</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Account / UPI ID</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>IFSC Code</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Amount</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Fee</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Mode</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Reference ID</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Status</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Date & Time</th>
              <th style={{ padding: "12px 14px", fontWeight: "700", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              // Skeleton loading rows
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #0F2542" }}>
                  <td colSpan={12} style={{ padding: "16px 20px" }}>
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
            ) : transfers.length === 0 ? (
              // Empty State
              <tr>
                <td
                  colSpan={12}
                  style={{
                    padding: "40px 20px",
                    textAlign: "center",
                    color: "#8BA2C1"
                  }}
                >
                  <Info size={28} color="#087BFF" style={{ marginBottom: "8px" }} />
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#FFFFFF" }}>
                    No money transfer records found
                  </div>
                  <div style={{ fontSize: "12px", marginTop: "4px" }}>
                    Try adjusting your filters, search query, or date range.
                  </div>
                </td>
              </tr>
            ) : (
              transfers.map((item) => {
                const trfId = item.transfer_id || item.id;
                const ref = item.reference_id || item.provider_reference || `TRF_${trfId}`;

                return (
                  <tr
                    key={trfId}
                    style={{
                      borderBottom: "1px solid #0F2542",
                      transition: "background-color 0.15s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0B1D35")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {/* 1. Transfer ID */}
                    <td style={{ padding: "12px 14px", fontWeight: "700", color: "#00D5FF" }}>
                      TRF#{trfId}
                    </td>

                    {/* 2. Sender Name */}
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ color: "#FFFFFF", fontWeight: "600" }}>
                        {item.sender_name || "ApnaPay Customer"}
                      </div>
                      <div style={{ color: "#627B9B", fontSize: "11px" }}>
                        ID #{item.sender_user_id || "1"}
                      </div>
                    </td>

                    {/* 3. Beneficiary Name */}
                    <td style={{ padding: "12px 14px", color: "#FFFFFF", fontWeight: "600" }}>
                      {item.beneficiary_name || "Beneficiary"}
                    </td>

                    {/* 4. Masked Account / UPI ID */}
                    <td style={{ padding: "12px 14px", color: "#8BA2C1", fontFamily: "monospace" }}>
                      {maskAccount(item.receiver_account_last4, item.receiver_upi_id)}
                    </td>

                    {/* 5. IFSC Code */}
                    <td style={{ padding: "12px 14px", color: "#00D5FF", fontFamily: "monospace", fontSize: "11.5px" }}>
                      {item.ifsc_code || "HDFC0001234"}
                    </td>

                    {/* 6. Amount */}
                    <td style={{ padding: "12px 14px", color: "#FFFFFF", fontWeight: "700", fontSize: "13px" }}>
                      {formatINR(item.amount)}
                    </td>

                    {/* 7. Transfer Fee */}
                    <td style={{ padding: "12px 14px", color: Number(item.fee || 0) > 0 ? "#FFB020" : "#627B9B" }}>
                      {Number(item.fee || 0) > 0 ? formatINR(item.fee) : "₹0.00"}
                    </td>

                    {/* 8. Mode */}
                    <td style={{ padding: "12px 14px" }}>
                      {renderModeBadge(item.transfer_mode)}
                    </td>

                    {/* 9. Reference ID */}
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontFamily: "monospace", color: "#8BA2C1", fontSize: "11px" }}>
                          {ref}
                        </span>
                        <button
                          onClick={() => handleCopy(ref, trfId)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: copiedId === trfId ? "#00E599" : "#627B9B",
                            cursor: "pointer",
                            padding: "2px"
                          }}
                          title="Copy reference ID"
                        >
                          {copiedId === trfId ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>

                    {/* 10. Status */}
                    <td style={{ padding: "12px 14px" }}>
                      {renderStatusBadge(item.status)}
                    </td>

                    {/* 11. Date & Time */}
                    <td style={{ padding: "12px 14px", color: "#8BA2C1", fontSize: "11.5px", whiteSpace: "nowrap" }}>
                      {formatDate(item.created_at)}
                    </td>

                    {/* 12. Actions */}
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <button
                        onClick={() => onViewDetails(item)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          background: "rgba(8, 123, 255, 0.15)",
                          border: "1px solid rgba(8, 123, 255, 0.35)",
                          color: "#00D5FF",
                          fontSize: "11.5px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#087BFF";
                          e.currentTarget.style.color = "#FFFFFF";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(8, 123, 255, 0.15)";
                          e.currentTarget.style.color = "#00D5FF";
                        }}
                        title="View transfer details and audit trail"
                      >
                        <Eye size={13} />
                        View Details
                      </button>
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
          padding: "14px 20px",
          borderTop: "1px solid #16365C",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          background: "#0B1D35"
        }}
      >
        <div style={{ fontSize: "12px", color: "#8BA2C1" }}>
          Showing page <span style={{ color: "#FFFFFF", fontWeight: "700" }}>{page}</span> of{" "}
          <span style={{ color: "#FFFFFF", fontWeight: "700" }}>{totalPages}</span> ({total} total transfers)
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 12px",
              borderRadius: "6px",
              background: page <= 1 ? "#071426" : "#0B1D35",
              border: "1px solid #16365C",
              color: page <= 1 ? "#627B9B" : "#FFFFFF",
              fontSize: "12px",
              cursor: page <= 1 ? "not-allowed" : "pointer"
            }}
          >
            <ChevronLeft size={14} /> Previous
          </button>

          {/* Page Indicators */}
          {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
            const pageNum = idx + 1;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                style={{
                  padding: "5px 10px",
                  borderRadius: "6px",
                  background: page === pageNum ? "#087BFF" : "#071426",
                  border: page === pageNum ? "1px solid #00D5FF" : "1px solid #16365C",
                  color: page === pageNum ? "#FFFFFF" : "#8BA2C1",
                  fontSize: "12px",
                  fontWeight: page === pageNum ? "700" : "500",
                  cursor: "pointer"
                }}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 12px",
              borderRadius: "6px",
              background: page >= totalPages ? "#071426" : "#0B1D35",
              border: "1px solid #16365C",
              color: page >= totalPages ? "#627B9B" : "#FFFFFF",
              fontSize: "12px",
              cursor: page >= totalPages ? "not-allowed" : "pointer"
            }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
