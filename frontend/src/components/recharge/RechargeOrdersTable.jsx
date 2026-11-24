import React, { useState } from "react";
import {
  Smartphone,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Info,
  RotateCcw,
  User,
  Zap,
  Percent
} from "lucide-react";

export default function RechargeOrdersTable({
  orders = [],
  loading = false,
  onViewOrder
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [copiedKey, setCopiedKey] = useState(null);

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

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const renderStatusBadge = (status) => {
    const s = String(status || "pending").toLowerCase();

    if (s === "success" || s === "successful") {
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
          <CheckCircle2 size={11} /> SUCCESSFUL
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

    if (s === "processing") {
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
            color: "#00D5FF",
            background: "rgba(0, 213, 255, 0.12)",
            border: "1px solid rgba(0, 213, 255, 0.3)"
          }}
        >
          <Clock size={11} /> PROCESSING
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
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: "700",
            color: "#A855F7",
            background: "rgba(168, 85, 247, 0.12)",
            border: "1px solid rgba(168, 85, 247, 0.3)"
          }}
        >
          <RotateCcw size={11} /> REVERSED
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
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: "700",
            color: "#8BA2C1",
            background: "rgba(139, 162, 193, 0.12)",
            border: "1px solid rgba(139, 162, 193, 0.3)"
          }}
        >
          INITIATED
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

  const total = orders.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginatedOrders = orders.slice((page - 1) * pageSize, page * pageSize);

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
          <Smartphone size={18} color="#087BFF" />
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>
            Recharge Orders Management
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
            {total} Orders Found
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
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Order ID</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Customer Name</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>User ID</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Mobile Number</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Operator</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Service</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Amount</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Commission</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Transaction ID</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Status</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Date & Time</th>
              <th style={{ padding: "12px 14px", fontWeight: "700", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
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
            ) : paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ padding: "35px 20px", textAlign: "center", color: "#8BA2C1" }}>
                  <Info size={24} color="#087BFF" style={{ marginBottom: "6px" }} />
                  <div style={{ color: "#FFFFFF", fontWeight: "600", fontSize: "14px" }}>
                    No recharge orders found matching criteria
                  </div>
                  <div style={{ fontSize: "12px", marginTop: "2px" }}>
                    Try clearing search query or adjusting operator/status filters.
                  </div>
                </td>
              </tr>
            ) : (
              paginatedOrders.map((ord) => {
                const isDth = String(ord.service_type || "").toLowerCase() === "dth";

                return (
                  <tr
                    key={ord.id}
                    style={{
                      borderBottom: "1px solid #0F2542",
                      transition: "background-color 0.15s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0B1D35")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {/* 1. Order ID */}
                    <td style={{ padding: "12px 14px", fontWeight: "700" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onViewOrder) onViewOrder(ord);
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
                        title="Click to view full order details"
                      >
                        #REC-{ord.id}
                      </button>
                    </td>

                    {/* 2. Customer Name */}
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ color: "#FFFFFF", fontWeight: "600" }}>
                        {ord.user_name || `Customer #${ord.user_id}`}
                      </div>
                      <div style={{ color: "#8BA2C1", fontSize: "11px" }}>
                        {ord.user_email || "customer@apnapay.com"}
                      </div>
                    </td>

                    {/* 3. User ID */}
                    <td style={{ padding: "12px 14px", color: "#8BA2C1", fontFamily: "monospace", fontSize: "11.5px" }}>
                      #USR-{ord.user_id}
                    </td>

                    {/* 4. Masked Mobile */}
                    <td style={{ padding: "12px 14px" }}>
                      <code
                        style={{
                          background: "#050D1B",
                          color: "#FFFFFF",
                          padding: "3px 6px",
                          borderRadius: "4px",
                          fontSize: "11.5px",
                          border: "1px solid #16365C"
                        }}
                      >
                        {ord.masked_mobile || ord.mobile_number}
                      </code>
                    </td>

                    {/* 5. Operator */}
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ color: "#FFFFFF", fontWeight: "600" }}>
                        {ord.operator_name}
                      </div>
                      <div style={{ color: "#8BA2C1", fontSize: "11px" }}>
                        {ord.plan_name || "Talktime / Topup"}
                      </div>
                    </td>

                    {/* 6. Service Type */}
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 7px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "700",
                          color: isDth ? "#A855F7" : "#087BFF",
                          background: isDth ? "rgba(168, 85, 247, 0.12)" : "rgba(8, 123, 255, 0.12)",
                          border: `1px solid ${isDth ? "rgba(168, 85, 247, 0.3)" : "rgba(8, 123, 255, 0.3)"}`
                        }}
                      >
                        {ord.service_type || "Prepaid"}
                      </span>
                    </td>

                    {/* 7. Amount */}
                    <td style={{ padding: "12px 14px", fontWeight: "700", color: "#00D5FF" }}>
                      {formatINR(ord.amount)}
                    </td>

                    {/* 8. Commission */}
                    <td style={{ padding: "12px 14px", color: "#00E599", fontWeight: "600" }}>
                      {formatINR(ord.commission)}
                    </td>

                    {/* 9. Transaction ID */}
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontFamily: "monospace", color: "#8BA2C1", fontSize: "11px" }}>
                          {ord.transaction_id ? String(ord.transaction_id).slice(0, 14) + "..." : "N/A"}
                        </span>
                        {ord.transaction_id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(ord.transaction_id, `txn_${ord.id}`);
                            }}
                            style={{ background: "transparent", border: "none", color: copiedKey === `txn_${ord.id}` ? "#00E599" : "#627B9B", cursor: "pointer", padding: "2px" }}
                            title="Copy Transaction ID"
                          >
                            {copiedKey === `txn_${ord.id}` ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 10. Status */}
                    <td style={{ padding: "12px 14px" }}>
                      {renderStatusBadge(ord.status)}
                    </td>

                    {/* 11. Date & Time */}
                    <td style={{ padding: "12px 14px", color: "#8BA2C1", fontSize: "11.5px" }}>
                      {formatDate(ord.created_at)}
                    </td>

                    {/* 12. Actions */}
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onViewOrder) onViewOrder(ord);
                        }}
                        style={{
                          background: "rgba(8, 123, 255, 0.16)",
                          border: "1px solid rgba(0, 213, 255, 0.5)",
                          color: "#00D5FF",
                          padding: "5px 10px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "11px",
                          fontWeight: "700",
                          transition: "all 0.15s ease"
                        }}
                        title="View Full Order Details & Timeline"
                      >
                        <Eye size={12} />
                        Details
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
          <span style={{ color: "#FFFFFF", fontWeight: "700" }}>{totalPages}</span> ({total} orders)
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
