import React, { useState } from "react";
import {
  Search,
  Filter,
  X,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  Calendar,
  Send,
  CreditCard,
  User,
  Hash,
  IndianRupee,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function TransfersFilterBar({
  filters,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  onRefresh,
  loading = false,
  totalRecords = 0
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Status badges config for filter
  const statuses = [
    { id: "all", label: "All Statuses", color: "#8BA2C1" },
    { id: "initiated", label: "Initiated", color: "#00D5FF" },
    { id: "processing", label: "Processing", color: "#FFB020" },
    { id: "successful", label: "Successful", color: "#00E599" },
    { id: "pending", label: "Pending", color: "#F59E0B" },
    { id: "failed", label: "Failed", color: "#FF4D4D" },
    { id: "reversed", label: "Reversed", color: "#A855F7" }
  ];

  // Transfer Modes config
  const modes = [
    { id: "all", label: "All Modes" },
    { id: "UPI", label: "UPI" },
    { id: "IMPS", label: "IMPS" },
    { id: "NEFT", label: "NEFT" },
    { id: "RTGS", label: "RTGS" }
  ];

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onApplyFilters();
    }
  };

  const hasActiveFilters =
    filters.mode !== "all" ||
    filters.status !== "all" ||
    Boolean(filters.search) ||
    Boolean(filters.transfer_id) ||
    Boolean(filters.user_id) ||
    Boolean(filters.reference_id) ||
    Boolean(filters.beneficiary_name) ||
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
      {/* 1. Quick Filter Row */}
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
            placeholder="Search by Transfer ID, Reference, Name, UPI or Account..."
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

        {/* Transfer Mode Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", color: "#8BA2C1", fontWeight: "600" }}>Mode:</span>
          <select
            value={filters.mode}
            onChange={(e) => {
              onFilterChange("mode", e.target.value);
            }}
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
            {modes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Transaction Status Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", color: "#8BA2C1", fontWeight: "600" }}>Status:</span>
          <select
            value={filters.status}
            onChange={(e) => {
              onFilterChange("status", e.target.value);
            }}
            style={{
              background: "#0B1D35",
              border: "1px solid #16365C",
              borderRadius: "8px",
              color:
                statuses.find((s) => s.id === filters.status.toLowerCase())?.color || "#FFFFFF",
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

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Toggle Advanced */}
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
            <span>Filters</span>
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {/* Apply Filters Button */}
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

          {/* Clear Filters Button */}
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

          {/* Refresh Button */}
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

      {/* 2. Collapsible Advanced Filters Section */}
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
          {/* Transfer ID */}
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#8BA2C1", marginBottom: "5px", fontWeight: "600" }}>
              Transfer ID
            </label>
            <input
              type="number"
              placeholder="e.g. 16"
              value={filters.transfer_id}
              onChange={(e) => onFilterChange("transfer_id", e.target.value)}
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

          {/* User ID */}
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#8BA2C1", marginBottom: "5px", fontWeight: "600" }}>
              User ID (Sender/Receiver)
            </label>
            <input
              type="number"
              placeholder="e.g. 1 or 7"
              value={filters.user_id}
              onChange={(e) => onFilterChange("user_id", e.target.value)}
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

          {/* Reference ID */}
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#8BA2C1", marginBottom: "5px", fontWeight: "600" }}>
              Reference ID
            </label>
            <input
              type="text"
              placeholder="e.g. UPI_9921478201"
              value={filters.reference_id}
              onChange={(e) => onFilterChange("reference_id", e.target.value)}
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

          {/* Beneficiary Name */}
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#8BA2C1", marginBottom: "5px", fontWeight: "600" }}>
              Beneficiary Name
            </label>
            <input
              type="text"
              placeholder="e.g. Priya Patel"
              value={filters.beneficiary_name}
              onChange={(e) => onFilterChange("beneficiary_name", e.target.value)}
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

          {/* Min Amount */}
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "#8BA2C1", marginBottom: "5px", fontWeight: "600" }}>
              Min Amount (₹)
            </label>
            <input
              type="number"
              placeholder="e.g. 1000"
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
              placeholder="e.g. 50000"
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
