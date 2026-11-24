import React, { useState } from "react";
import {
  QrCode,
  Eye,
  Download,
  ListFilter,
  CheckCircle2,
  XCircle,
  Clock,
  Power,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Store,
  Info
} from "lucide-react";

export default function QrCodesTable({
  qrCodes = [],
  loading = false,
  onViewQr,
  onDownloadQr,
  onViewTransactions,
  onToggleStatus
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [actionInProgress, setActionInProgress] = useState(null);

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
      year: "numeric"
    });
  };

  const total = qrCodes.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginatedQrs = qrCodes.slice((page - 1) * pageSize, page * pageSize);

  const handleToggle = async (qr) => {
    if (!onToggleStatus) return;
    setActionInProgress(qr.id);
    try {
      await onToggleStatus(qr);
    } finally {
      setActionInProgress(null);
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
          <QrCode size={18} color="#087BFF" />
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>
            Registered Merchant & Dynamic QRs
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
            {total} QRs Registered
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
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>QR ID</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Merchant / Store</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>QR Type</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Preview</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Amount / Open</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Scan Count</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Total Collection</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Status</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Created Date</th>
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
            ) : paginatedQrs.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: "35px 20px", textAlign: "center", color: "#8BA2C1" }}>
                  <Info size={24} color="#087BFF" style={{ marginBottom: "6px" }} />
                  <div style={{ color: "#FFFFFF", fontWeight: "600", fontSize: "14px" }}>
                    No QR codes found matching criteria
                  </div>
                  <div style={{ fontSize: "12px", marginTop: "2px" }}>
                    Try clearing or adjusting search and filter options.
                  </div>
                </td>
              </tr>
            ) : (
              paginatedQrs.map((q) => {
                const isActive = String(q.status || "active").toLowerCase() === "active";
                const isDynamic = String(q.qr_type || "static").toLowerCase() === "dynamic";

                return (
                  <tr
                    key={q.id}
                    style={{
                      borderBottom: "1px solid #0F2542",
                      transition: "background-color 0.15s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0B1D35")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {/* 1. QR ID */}
                    <td style={{ padding: "12px 14px", fontWeight: "700" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewQr(q);
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
                        title="Click to view QR details"
                      >
                        #QR-{q.id}
                      </button>
                    </td>

                    {/* 2. Merchant Name */}
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ color: "#FFFFFF", fontWeight: "600" }}>
                        {q.merchant_name || `Merchant #${q.user_id}`}
                      </div>
                      <div style={{ color: "#8BA2C1", fontSize: "11px" }}>
                        {q.purpose || "Payment Collection"}
                      </div>
                    </td>

                    {/* 3. QR Type */}
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          color: isDynamic ? "#00D5FF" : "#087BFF",
                          background: isDynamic ? "rgba(0, 213, 255, 0.12)" : "rgba(8, 123, 255, 0.12)",
                          border: `1px solid ${isDynamic ? "rgba(0, 213, 255, 0.3)" : "rgba(8, 123, 255, 0.3)"}`
                        }}
                      >
                        {isDynamic ? "DYNAMIC" : "STATIC"}
                      </span>
                    </td>

                    {/* 4. QR Preview */}
                    <td style={{ padding: "12px 14px" }}>
                      {q.qr_image ? (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewQr(q);
                          }}
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "6px",
                            background: "#FFFFFF",
                            padding: "2px",
                            cursor: "pointer",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                          title="Click to view QR details"
                        >
                          <img
                            src={q.qr_image}
                            alt="QR Thumbnail"
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                          />
                        </div>
                      ) : (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewQr(q);
                          }}
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "6px",
                            background: "#0B1D35",
                            border: "1px solid #16365C",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer"
                          }}
                          title="Click to view QR details"
                        >
                          <QrCode size={18} color="#00D5FF" />
                        </div>
                      )}
                    </td>

                    {/* 5. Amount / Open */}
                    <td style={{ padding: "12px 14px", fontWeight: "600" }}>
                      {q.fixed_amount !== null && Number(q.fixed_amount) > 0 ? (
                        <span style={{ color: "#FFFFFF" }}>{formatINR(q.fixed_amount)}</span>
                      ) : (
                        <span style={{ color: "#00E599", fontSize: "11.5px" }}>Open Amount</span>
                      )}
                    </td>

                    {/* 6. Scan Count */}
                    <td style={{ padding: "12px 14px", color: "#8BA2C1", fontWeight: "600" }}>
                      {q.scan_count || 0} scans
                    </td>

                    {/* 7. Total Collection */}
                    <td style={{ padding: "12px 14px", color: "#00D5FF", fontWeight: "700" }}>
                      {formatINR(q.total_collection)}
                    </td>

                    {/* 8. Status */}
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "2px 8px",
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
                    </td>

                    {/* 9. Created Date */}
                    <td style={{ padding: "12px 14px", color: "#8BA2C1", fontSize: "11.5px" }}>
                      {formatDate(q.created_at)}
                    </td>

                    {/* 10. Actions */}
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        {/* View Details */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewQr(q);
                          }}
                          style={{
                            background: "rgba(8, 123, 255, 0.16)",
                            border: "1px solid rgba(0, 213, 255, 0.5)",
                            color: "#00D5FF",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "11px",
                            fontWeight: "700"
                          }}
                          title="View QR Details & Scan URL"
                        >
                          <Eye size={12} />
                          Details
                        </button>

                        {/* Download QR */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownloadQr(q);
                          }}
                          style={{
                            background: "rgba(0, 229, 153, 0.12)",
                            border: "1px solid rgba(0, 229, 153, 0.3)",
                            color: "#00E599",
                            padding: "5px 8px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                            fontSize: "11px"
                          }}
                          title="Download high-resolution QR PNG"
                        >
                          <Download size={12} />
                          Save
                        </button>

                        {/* View Transactions */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewTransactions(q);
                          }}
                          style={{
                            background: "#0B1D35",
                            border: "1px solid #16365C",
                            color: "#8BA2C1",
                            padding: "5px 8px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                            fontSize: "11px"
                          }}
                          title="Filter requests table for this QR"
                        >
                          <ListFilter size={12} />
                          Txns
                        </button>

                        {/* Toggle Status */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggle(q);
                          }}
                          disabled={actionInProgress === q.id}
                          style={{
                            background: isActive ? "rgba(255, 77, 77, 0.12)" : "rgba(0, 229, 153, 0.12)",
                            border: `1px solid ${isActive ? "rgba(255, 77, 77, 0.3)" : "rgba(0, 229, 153, 0.3)"}`,
                            color: isActive ? "#FF6B6B" : "#00E599",
                            padding: "5px 8px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                            fontSize: "11px"
                          }}
                          title={isActive ? "Deactivate this QR code" : "Activate this QR code"}
                        >
                          <Power size={12} />
                          {isActive ? "Disable" : "Activate"}
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
          <span style={{ color: "#FFFFFF", fontWeight: "700" }}>{totalPages}</span> ({total} QRs)
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
