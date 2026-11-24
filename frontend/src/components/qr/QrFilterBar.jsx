import React, { useState } from "react";
import {
  Search,
  Filter,
  X,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Calendar,
  IndianRupee,
  Smartphone,
  QrCode
} from "lucide-react";

export default function QrFilterBar({
  filters,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  onRefresh,
  loading = false,
  totalQrs = 0,
  totalRequests = 0
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const statuses = [
    { id: "all", label: "All Payment Statuses", color: "#8BA2C1" },
    { id: "paid", label: "Paid", color: "#00E599" },
    { id: "pending", label: "Pending", color: "#FFB020" },
    { id: "failed", label: "Failed", color: "#FF4D4D" },
    { id: "cancelled", label: "Cancelled", color: "#8BA2C1" },
    { id: "expired", label: "Expired", color: "#A855F7" }
  ];

  const types = [
    { id: "all", label: "All QR Types" },
    { id: "static", label: "Static Counter QR" },
    { id: "dynamic", label: "Dynamic Invoice QR" }
  ];

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onApplyFilters();
    }
  };

  const hasActiveFilters =
    filters.qr_type !== "all" ||
    filters.payment_status !== "all" ||
    Boolean(filters.search) ||
    Boolean(filters.min_amount) ||
    Boolean(filters.max_amount) ||
    Boolean(filters.start_date) ||
    Boolean(filters.end_date);

  return (
    <div
      style={{
        background: "#071426",
        border: "1px solid #16365C",
        borderRadius: "14px",
        padding: "18px 20px",
        marginBottom: "20px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)"
      }}
    >
      {/* 1. Primary Filter Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          justifyContent: "space-between"
        }}
      >
        {/* Universal Search Bar */}
        <div
          style={{
            flex: "1 1 280px",
            position: "relative",
            minWidth: "240px"
          }}
        >
          <Search
            size={16}
            color="#627B9B"
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)"
            }}
          />
          <input
            type="text"
            placeholder="Search by QR ID, Merchant Name, Purpose or Reference..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: "100%",
              padding: "10px 14px 10px 38px",
              background: "#0B1D35",
              border: "1px solid #16365C",
              borderRadius: "8px",
              color: "#FFFFFF",
              fontSize: "13px",
              outline: "none",
              transition: "border-color 0.2s ease"
            }}
            onFocus={(e) => (e.target.style.borderColor = "#00D5FF")}
            onBlur={(e) => (e.target.style.borderColor = "#16365C")}
          />
          {filters.search && (
            <button
              onClick={() => {
                onFilterChange("search", "");
                onApplyFilters();
              }}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "#627B9B",
                cursor: "pointer"
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* QR Type Filter Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", color: "#8BA2C1", fontWeight: "600" }}>QR Type:</span>
          <select
            value={filters.qr_type}
            onChange={(e) => onFilterChange("qr_type", e.target.value)}
            style={{
              background: "#0B1D35",
              border: "1px solid #16365C",
              borderRadius: "8px",
              color: "#00D5FF",
              fontWeight: "600",
              padding: "9px 12px",
              fontSize: "13px",
              cursor: "pointer",
              outline: "none"
            }}
          >
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Status Filter Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", color: "#8BA2C1", fontWeight: "600" }}>Payment Status:</span>
          <select
            value={filters.payment_status}
            onChange={(e) => onFilterChange("payment_status", e.target.value)}
            style={{
              background: "#0B1D35",
              border: "1px solid #16365C",
              borderRadius: "8px",
              color:
                statuses.find((s) => s.id === filters.payment_status.toLowerCase())?.color || "#FFFFFF",
              fontWeight: "600",
              padding: "9px 12px",
              fontSize: "13px",
              cursor: "pointer",
              outline: "none"
            }}
          >
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Actions Group */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 14px",
              borderRadius: "8px",
              background: showAdvanced ? "rgba(8, 123, 255, 0.15)" : "#0B1D35",
              border: showAdvanced ? "1px solid #00D5FF" : "1px solid #16365C",
              color: showAdvanced ? "#00D5FF" : "#8BA2C1",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            <SlidersHorizontal size={14} />
            <span>Range</span>
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <button
            onClick={onApplyFilters}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #087BFF 0%, #00D5FF 100%)",
              border: "none",
              color: "#FFFFFF",
              fontSize: "12.5px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(0, 213, 255, 0.3)"
            }}
          >
            <Filter size={14} />
            Apply Filters
          </button>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "9px 12px",
                borderRadius: "8px",
                background: "#0B1D35",
                border: "1px solid #16365C",
                color: "#FF6B6B",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer"
              }}
              title="Clear all active filters"
            >
              <RotateCcw size={13} />
              Clear
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 12px",
              borderRadius: "8px",
              background: "#0B1D35",
              border: "1px solid #16365C",
              color: "#00D5FF",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer"
            }}
            title="Refresh database records"
          >
            <RefreshCw size={13} className={loading ? "spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* 2. Collapsible Amount & Date Range Controls */}
      {showAdvanced && (
        <div
          style={{
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid #16365C",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "14px"
          }}
        >
          {/* Min Amount */}
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#8BA2C1", marginBottom: "5px", fontWeight: "600" }}>
              Min Amount (₹)
            </label>
            <input
              type="number"
              placeholder="e.g. 100"
              value={filters.min_amount}
              onChange={(e) => onFilterChange("min_amount", e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "#0B1D35",
                border: "1px solid #16365C",
                borderRadius: "6px",
                color: "#FFFFFF",
                fontSize: "12.5px"
              }}
            />
          </div>

          {/* Max Amount */}
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#8BA2C1", marginBottom: "5px", fontWeight: "600" }}>
              Max Amount (₹)
            </label>
            <input
              type="number"
              placeholder="e.g. 10000"
              value={filters.max_amount}
              onChange={(e) => onFilterChange("max_amount", e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "#0B1D35",
                border: "1px solid #16365C",
                borderRadius: "6px",
                color: "#FFFFFF",
                fontSize: "12.5px"
              }}
            />
          </div>

          {/* Start Date */}
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#8BA2C1", marginBottom: "5px", fontWeight: "600" }}>
              Start Date
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => onFilterChange("start_date", e.target.value)}
              style={{
                width: "100%",
                padding: "7px 10px",
                background: "#0B1D35",
                border: "1px solid #16365C",
                borderRadius: "6px",
                color: "#FFFFFF",
                fontSize: "12px"
              }}
            />
          </div>

          {/* End Date */}
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#8BA2C1", marginBottom: "5px", fontWeight: "600" }}>
              End Date
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => onFilterChange("end_date", e.target.value)}
              style={{
                width: "100%",
                padding: "7px 10px",
                background: "#0B1D35",
                border: "1px solid #16365C",
                borderRadius: "6px",
                color: "#FFFFFF",
                fontSize: "12px"
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
