import React, { useState, useMemo } from "react";
import {
  Search, Filter, Calendar, ChevronLeft, ChevronRight,
  Eye, RefreshCw, XCircle, CreditCard, CheckCircle2,
  Clock, AlertCircle, ArrowUpDown, IndianRupee, Layers
} from "lucide-react";

export default function PaymentsTable({
  payments = [],
  loading = false,
  error = null,
  onRefresh,
  onViewDetails
}) {
  // Filters state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Clear all filters
  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setMethodFilter("all");
    setProviderFilter("all");
    setMinAmount("");
    setMaxAmount("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  // Extract unique payment methods & providers for dynamic filter dropdowns
  const availableMethods = useMemo(() => {
    const set = new Set();
    payments.forEach((p) => {
      const m = p.payment_method || (p.purpose?.toLowerCase().includes("upi") ? "UPI" : null);
      if (m) set.add(m.toUpperCase());
    });
    return Array.from(set);
  }, [payments]);

  // Client-side filtering across all fields
  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      // 1. Search Query: Payment ID, User ID, Transaction ID, User Name
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const idMatch = String(item.id || "").toLowerCase().includes(q);
        const userIdMatch = String(item.user_id || "").toLowerCase().includes(q);
        const txnIdMatch = String(item.provider_transaction_id || item.provider_reference || "").toLowerCase().includes(q);
        const nameMatch = String(item.user_name || "").toLowerCase().includes(q);
        const purposeMatch = String(item.purpose || "").toLowerCase().includes(q);

        if (!idMatch && !userIdMatch && !txnIdMatch && !nameMatch && !purposeMatch) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter !== "all") {
        const itemStatus = String(item.status || "").toLowerCase();
        const target = statusFilter.toLowerCase();
        if (target === "successful" && !["success", "successful", "succeeded"].includes(itemStatus)) {
          return false;
        }
        if (target === "pending" && !["pending", "initiated", "processing"].includes(itemStatus)) {
          return false;
        }
        if (target === "failed" && !["failed", "declined", "cancelled"].includes(itemStatus)) {
          return false;
        }
        if (target === "processing" && itemStatus !== "processing") {
          return false;
        }
      }

      // 3. Payment Method Filter
      if (methodFilter !== "all") {
        const itemMethod = String(item.payment_method || (item.purpose?.toLowerCase().includes("upi") ? "UPI" : "")).toLowerCase();
        if (!itemMethod.includes(methodFilter.toLowerCase())) {
          return false;
        }
      }

      // 4. Provider Filter
      if (providerFilter !== "all") {
        const itemTxn = String(item.provider_transaction_id || item.provider_reference || item.provider || "").toLowerCase();
        if (!itemTxn.includes(providerFilter.toLowerCase())) {
          return false;
        }
      }

      // 5. Amount Range Filter
      const amt = Number(item.amount || 0);
      if (minAmount && !isNaN(Number(minAmount)) && amt < Number(minAmount)) {
        return false;
      }
      if (maxAmount && !isNaN(Number(maxAmount)) && amt > Number(maxAmount)) {
        return false;
      }

      // 6. Date Range Filter
      if (item.created_at) {
        const itemDate = new Date(item.created_at);
        if (startDate) {
          const s = new Date(startDate);
          s.setHours(0, 0, 0, 0);
          if (itemDate < s) return false;
        }
        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          if (itemDate > e) return false;
        }
      }

      return true;
    });
  }, [payments, search, statusFilter, methodFilter, providerFilter, minAmount, maxAmount, startDate, endDate]);

  // Pagination calculation
  const totalItems = filteredPayments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  // Status badge renderer
  const renderStatusBadge = (st) => {
    const s = String(st || "").toLowerCase();
    if (["success", "successful", "succeeded"].includes(s)) {
      return (
        <span className="badge-pill verified" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <CheckCircle2 size={12} /> SUCCESS
        </span>
      );
    }
    if (["pending", "initiated"].includes(s)) {
      return (
        <span
          className="badge-pill"
          style={{
            background: "rgba(255, 170, 0, 0.15)",
            color: "#ffb020",
            border: "1px solid rgba(255, 170, 0, 0.4)",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          <Clock size={12} /> PENDING
        </span>
      );
    }
    if (s === "processing") {
      return (
        <span
          className="badge-pill"
          style={{
            background: "rgba(8, 124, 255, 0.15)",
            color: "#6ba6ff",
            border: "1px solid rgba(8, 124, 255, 0.4)",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          <RefreshCw size={12} className="spin" /> PROCESSING
        </span>
      );
    }
    return (
      <span
        className="badge-pill"
        style={{
          background: "rgba(255, 77, 77, 0.15)",
          color: "#ff6b6b",
          border: "1px solid rgba(255, 77, 77, 0.4)",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px"
        }}
      >
        <XCircle size={12} /> FAILED
      </span>
    );
  };

  // Helper for Payment Method display
  const resolveMethod = (item) => {
    if (item.payment_method) return String(item.payment_method).toUpperCase();
    if (item.purpose?.toLowerCase().includes("upi") || item.provider_transaction_id?.startsWith("UPI")) return "UPI";
    if (item.purpose?.toLowerCase().includes("wallet")) return "WALLET";
    if (item.purpose?.toLowerCase().includes("card")) return "CARD";
    if (item.purpose?.toLowerCase().includes("netbanking")) return "NETBANKING";
    return "GATEWAY";
  };

  // Helper for Provider display
  const resolveProvider = (item) => {
    if (item.provider_name) return item.provider_name;
    const tid = String(item.provider_transaction_id || item.provider_reference || "");
    if (tid.startsWith("TXN_JF")) return "Jio Fiber Switch";
    if (tid.startsWith("UPI_TOP")) return "NPCI UPI Switch";
    if (tid.startsWith("P2P_TRF")) return "ApnaPay Ledger";
    if (tid.startsWith("BILL_TP")) return "BBPS Bharat BillPay";
    if (tid.startsWith("REC_AT")) return "Airtel Tele-Switch";
    if (tid.startsWith("LND_REG")) return "Digital Land Registry";
    if (item.provider_id) return `Provider #${item.provider_id}`;
    return "ApnaPay Core Gateway";
  };

  // Helper to format Date
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

  return (
    <div className="table-card">
      {/* 1. Header Toolbar */}
      <div
        style={{
          padding: "18px 20px",
          borderBottom: "1px solid #1b3153",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "14px"
        }}
      >
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#e7efff", display: "flex", alignItems: "center", gap: "8px" }}>
            <CreditCard size={18} color="#087cff" /> Real-time Payments Ledger
          </h3>
          <p style={{ fontSize: "12px", color: "#8498ba", marginTop: "2px" }}>
            Audit trail of customer checkouts, gateway settlements, and provider responses.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {onRefresh && (
            <button
              className="refresh-btn"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh ledger from database"
            >
              <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
            </button>
          )}

          <button
            onClick={handleClearFilters}
            className="filter-chip"
            style={{ cursor: "pointer", background: "#0a1526" }}
            title="Reset all filter conditions"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* 2. Comprehensive Filter Bar */}
      <div
        style={{
          padding: "16px 20px",
          background: "#081224",
          borderBottom: "1px solid #142847",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}
      >
        {/* Row 1: Search & Status Pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          {/* Search Box */}
          <div className="search-box" style={{ flex: 1, minWidth: "260px" }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search Payment ID, User ID, Txn ID, Name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ background: "transparent", border: "none", color: "#6ba6ff", cursor: "pointer", padding: "0 6px" }}
              >
                ×
              </button>
            )}
          </div>

          {/* Status Pills */}
          <div className="filter-group">
            <span className="filter-label"><Filter size={13} /> Status:</span>
            {[
              { id: "all", label: "All" },
              { id: "successful", label: "Successful" },
              { id: "pending", label: "Pending" },
              { id: "failed", label: "Failed" }
            ].map((st) => (
              <button
                key={st.id}
                className={`filter-chip ${statusFilter === st.id ? "active" : ""}`}
                onClick={() => {
                  setStatusFilter(st.id);
                  setCurrentPage(1);
                }}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Method, Provider, Amount & Date Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          {/* Method Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#8498ba" }}>Method:</span>
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                background: "#0d1b33",
                border: "1px solid #1b3153",
                color: "#c6d8f5",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "12px",
                outline: "none"
              }}
            >
              <option value="all">All Methods</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="wallet">Wallet</option>
              <option value="netbanking">NetBanking</option>
              {availableMethods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Provider Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#8498ba" }}>Provider:</span>
            <select
              value={providerFilter}
              onChange={(e) => {
                setProviderFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                background: "#0d1b33",
                border: "1px solid #1b3153",
                color: "#c6d8f5",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "12px",
                outline: "none"
              }}
            >
              <option value="all">All Providers</option>
              <option value="TXN_JF">Jio Fiber</option>
              <option value="UPI">NPCI UPI</option>
              <option value="BILL_TP">BBPS BillPay</option>
              <option value="REC_AT">Airtel Gateway</option>
              <option value="LND_REG">Land Registry</option>
            </select>
          </div>

          {/* Amount Range Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#8498ba" }}>Amount:</span>
            <input
              type="number"
              placeholder="Min ₹"
              value={minAmount}
              onChange={(e) => {
                setMinAmount(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: "80px",
                background: "#0d1b33",
                border: "1px solid #1b3153",
                color: "#e7efff",
                borderRadius: "6px",
                padding: "6px 8px",
                fontSize: "12px",
                outline: "none"
              }}
            />
            <span style={{ color: "#546e96" }}>-</span>
            <input
              type="number"
              placeholder="Max ₹"
              value={maxAmount}
              onChange={(e) => {
                setMaxAmount(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: "80px",
                background: "#0d1b33",
                border: "1px solid #1b3153",
                color: "#e7efff",
                borderRadius: "6px",
                padding: "6px 8px",
                fontSize: "12px",
                outline: "none"
              }}
            />
          </div>

          {/* Date Range Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Calendar size={13} color="#8498ba" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                background: "#0d1b33",
                border: "1px solid #1b3153",
                color: "#e7efff",
                borderRadius: "6px",
                padding: "5px 8px",
                fontSize: "11px",
                outline: "none"
              }}
              title="From date"
            />
            <span style={{ color: "#546e96" }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                background: "#0d1b33",
                border: "1px solid #1b3153",
                color: "#e7efff",
                borderRadius: "6px",
                padding: "5px 8px",
                fontSize: "11px",
                outline: "none"
              }}
              title="To date"
            />
          </div>
        </div>
      </div>

      {/* 3. Error Alert */}
      {error && (
        <div
          style={{
            margin: "16px 20px",
            padding: "12px 16px",
            background: "rgba(255, 77, 77, 0.12)",
            border: "1px solid rgba(255, 77, 77, 0.35)",
            borderRadius: "8px",
            color: "#ff7777",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* 4. Table Wrapper */}
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>PAYMENT ID</th>
              <th>USER</th>
              <th>AMOUNT</th>
              <th>METHOD</th>
              <th>PROVIDER</th>
              <th>TRANSACTION ID</th>
              <th>STATUS</th>
              <th>PAYMENT DATE</th>
              <th style={{ textAlign: "right" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "50px 20px" }}>
                  <RefreshCw size={24} className="spin" color="#087cff" style={{ margin: "0 auto 12px" }} />
                  <div style={{ color: "#c6d8f5", fontSize: "14px", fontWeight: "600" }}>
                    Loading Real-time Payments from Database...
                  </div>
                </td>
              </tr>
            ) : paginatedPayments.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "50px 20px" }}>
                  <XCircle size={32} color="#546e96" style={{ margin: "0 auto 12px" }} />
                  <div style={{ color: "#e7efff", fontSize: "15px", fontWeight: "600" }}>
                    No payment records found
                  </div>
                  <p style={{ color: "#8498ba", fontSize: "12px", marginTop: "4px" }}>
                    Try relaxing your search terms or resetting the filter options.
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="filter-chip"
                    style={{ marginTop: "12px", cursor: "pointer", display: "inline-block" }}
                  >
                    Reset Filters
                  </button>
                </td>
              </tr>
            ) : (
              paginatedPayments.map((item) => {
                const method = resolveMethod(item);
                const provider = resolveProvider(item);
                const txnId = item.provider_transaction_id || item.provider_reference || `TXN_${item.id}`;

                return (
                  <tr key={item.id}>
                    {/* Payment ID */}
                    <td>
                      <span className="api-tag" style={{ fontSize: "11px" }}>
                        #{item.id}
                      </span>
                    </td>

                    {/* User ID & Name */}
                    <td>
                      <div>
                        <span style={{ fontWeight: "600", color: "#e7efff", fontSize: "13px" }}>
                          {item.user_name || "ApnaPay User"}
                        </span>
                        <div style={{ fontSize: "11px", color: "#6ba6ff", marginTop: "2px" }}>
                          UID: #{item.user_id}
                        </div>
                      </div>
                    </td>

                    {/* Payment Amount */}
                    <td>
                      <span style={{ fontWeight: "700", color: "#00d26a", fontSize: "14px" }}>
                        ₹{Number(item.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                      <div style={{ fontSize: "10px", color: "#8498ba" }}>
                        {item.currency || "INR"}
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td>
                      <span
                        style={{
                          background: "#0c1b36",
                          border: "1px solid #1a3966",
                          color: "#91a6c8",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "600"
                        }}
                      >
                        {method}
                      </span>
                    </td>

                    {/* Payment Provider */}
                    <td>
                      <span style={{ fontSize: "12px", color: "#c6d8f5" }}>
                        {provider}
                      </span>
                    </td>

                    {/* Transaction ID */}
                    <td>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "11px",
                          color: "#9bb0cf",
                          background: "#081324",
                          padding: "3px 6px",
                          borderRadius: "4px",
                          border: "1px solid #142847"
                        }}
                      >
                        {txnId}
                      </span>
                    </td>

                    {/* Payment Status */}
                    <td>{renderStatusBadge(item.status)}</td>

                    {/* Payment Date */}
                    <td>
                      <span style={{ fontSize: "12px", color: "#8498ba" }}>
                        {formatDate(item.created_at)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => onViewDetails && onViewDetails(item)}
                        style={{
                          background: "linear-gradient(135deg, #087cff, #065ec3)",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          boxShadow: "0 2px 8px rgba(8, 124, 255, 0.3)"
                        }}
                        title="View comprehensive payment details"
                      >
                        <Eye size={13} /> View Details
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Pagination Footer */}
      <div
        style={{
          padding: "14px 20px",
          borderTop: "1px solid #1b3153",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          background: "#091428"
        }}
      >
        {/* Entries info & selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: "#8498ba" }}>
          <span>
            Showing {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
          </span>
          <span style={{ color: "#546e96" }}>|</span>
          <span>Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{
              background: "#0d1b33",
              border: "1px solid #1b3153",
              color: "#c6d8f5",
              borderRadius: "4px",
              padding: "4px 8px",
              fontSize: "12px",
              outline: "none"
            }}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>

        {/* Page navigation buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              background: currentPage === 1 ? "#0a1526" : "#0d1b33",
              border: "1px solid #1b3153",
              color: currentPage === 1 ? "#475c7e" : "#c6d8f5",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "12px",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <ChevronLeft size={14} /> Prev
          </button>

          <span style={{ fontSize: "12px", color: "#c6d8f5", padding: "0 6px" }}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            style={{
              background: currentPage >= totalPages ? "#0a1526" : "#0d1b33",
              border: "1px solid #1b3153",
              color: currentPage >= totalPages ? "#475c7e" : "#c6d8f5",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "12px",
              cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
