import React from "react";
import {
  Search,
  Filter,
  RotateCcw,
  RefreshCw,
  Calendar,
  Layers,
  Smartphone,
  IndianRupee,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";

export default function RechargeFilterBar({
  filters,
  operators = [],
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  onRefresh,
  loading = false,
  totalOrders = 0
}) {
  return (
    <div
      style={{
        background: "#071426",
        border: "1px solid #16365C",
        borderRadius: "14px",
        padding: "18px 20px",
        boxShadow: "0 6px 24px rgba(0, 0, 0, 0.35)",
        marginBottom: "24px"
      }}
    >
      {/* Top Filter Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "16px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Filter size={16} color="#087BFF" />
          <span style={{ fontSize: "14px", fontWeight: "700", color: "#FFFFFF" }}>
            Advanced Search & Filters
          </span>
          <span
            style={{
              fontSize: "11px",
              color: "#8BA2C1",
              background: "#0B1D35",
              padding: "2px 8px",
              borderRadius: "10px",
              border: "1px solid #16365C"
            }}
          >
            {totalOrders} matches
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={onApplyFilters}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "#087BFF",
              border: "none",
              color: "#FFFFFF",
              padding: "7px 14px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(8, 123, 255, 0.4)"
            }}
          >
            <Filter size={13} /> Apply Filters
          </button>

          <button
            onClick={onClearFilters}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "#0B1D35",
              border: "1px solid #16365C",
              color: "#8BA2C1",
              padding: "7px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            <RotateCcw size={13} /> Clear
          </button>

          <button
            onClick={onRefresh}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "#071426",
              border: "1px solid #16365C",
              color: "#00D5FF",
              padding: "7px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer"
            }}
            title="Refresh Recharge Records"
          >
            <RefreshCw size={13} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter Inputs Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "12px"
        }}
      >
        {/* 1. Keyword Search */}
        <div>
          <label style={{ display: "block", fontSize: "11px", color: "#8BA2C1", marginBottom: "5px", fontWeight: "600" }}>
            Search Keyword:
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Order ID, User ID, Mobile..."
              value={filters.search || ""}
              onChange={(e) => onFilterChange("search", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onApplyFilters()}
              style={{
                width: "100%",
                background: "#0B1D35",
                border: "1px solid #16365C",
                borderRadius: "6px",
                color: "#FFFFFF",
                fontSize: "12px",
                padding: "7px 10px 7px 28px",
                outline: "none"
              }}
            />
            <Search
              size={13}
              color="#8BA2C1"
              style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)" }}
            />
          </div>
        </div>

        {/* 2. Operator Filter */}
        <div>
          <label style={{ display: "block", fontSize: "11px", color: "#8BA2C1", marginBottom: "5px", fontWeight: "600" }}>
            Operator:
          </label>
          <select
            value={filters.operator_id || "all"}
            onChange={(e) => onFilterChange("operator_id", e.target.value)}
            style={{
              width: "100%",
              background: "#0B1D35",
              border: "1px solid #16365C",
              borderRadius: "6px",
              color: "#FFFFFF",
              fontSize: "12px",
              padding: "7px 10px",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="all">All Operators</option>
            {operators.map((op) => (
              <option key={op.id} value={op.id}>
                {op.operator_name}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Service Type Filter */}
        <div>
          <label style={{ display: "block", fontSize: "11px", color: "#8BA2C1", marginBottom: "5px", fontWeight: "600" }}>
            Service Type:
          </label>
          <select
            value={filters.service_type || "all"}
            onChange={(e) => onFilterChange("service_type", e.target.value)}
            style={{
              width: "100%",
              background: "#0B1D35",
              border: "1px solid #16365C",
              borderRadius: "6px",
              color: "#FFFFFF",
              fontSize: "12px",
              padding: "7px 10px",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="all">All Services</option>
            <option value="prepaid">Prepaid Mobile</option>
            <option value="postpaid">Postpaid Mobile</option>
            <option value="dth">DTH Satellite TV</option>
          </select>
        </div>

        {/* 4. Status Filter */}
        <div>
          <label style={{ display: "block", fontSize: "11px", color: "#8BA2C1", marginBottom: "5px", fontWeight: "600" }}>
            Transaction Status:
          </label>
          <select
            value={filters.status || "all"}
            onChange={(e) => onFilterChange("status", e.target.value)}
            style={{
              width: "100%",
              background: "#0B1D35",
              border: "1px solid #16365C",
              borderRadius: "6px",
              color: "#FFFFFF",
              fontSize: "12px",
              padding: "7px 10px",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="all">All Statuses</option>
            <option value="success">Successful</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
            <option value="reversed">Reversed</option>
            <option value="initiated">Initiated</option>
          </select>
        </div>

        {/* 5. Min Amount */}
        <div>
          <label style={{ display: "block", fontSize: "11px", color: "#8BA2C1", marginBottom: "5px", fontWeight: "600" }}>
            Min Amount (₹):
          </label>
          <input
            type="number"
            placeholder="Min ₹"
            value={filters.min_amount || ""}
            onChange={(e) => onFilterChange("min_amount", e.target.value)}
            style={{
              width: "100%",
              background: "#0B1D35",
              border: "1px solid #16365C",
              borderRadius: "6px",
              color: "#FFFFFF",
              fontSize: "12px",
              padding: "7px 10px",
              outline: "none"
            }}
          />
        </div>

        {/* 6. Max Amount */}
        <div>
          <label style={{ display: "block", fontSize: "11px", color: "#8BA2C1", marginBottom: "5px", fontWeight: "600" }}>
            Max Amount (₹):
          </label>
          <input
            type="number"
            placeholder="Max ₹"
            value={filters.max_amount || ""}
            onChange={(e) => onFilterChange("max_amount", e.target.value)}
            style={{
              width: "100%",
              background: "#0B1D35",
              border: "1px solid #16365C",
              borderRadius: "6px",
              color: "#FFFFFF",
              fontSize: "12px",
              padding: "7px 10px",
              outline: "none"
            }}
          />
        </div>

        {/* 7. Start Date */}
        <div>
          <label style={{ display: "block", fontSize: "11px", color: "#8BA2C1", marginBottom: "5px", fontWeight: "600" }}>
            Start Date:
          </label>
          <input
            type="date"
            value={filters.start_date || ""}
            onChange={(e) => onFilterChange("start_date", e.target.value)}
            style={{
              width: "100%",
              background: "#0B1D35",
              border: "1px solid #16365C",
              borderRadius: "6px",
              color: "#FFFFFF",
              fontSize: "12px",
              padding: "7px 10px",
              outline: "none"
            }}
          />
        </div>

        {/* 8. End Date */}
        <div>
          <label style={{ display: "block", fontSize: "11px", color: "#8BA2C1", marginBottom: "5px", fontWeight: "600" }}>
            End Date:
          </label>
          <input
            type="date"
            value={filters.end_date || ""}
            onChange={(e) => onFilterChange("end_date", e.target.value)}
            style={{
              width: "100%",
              background: "#0B1D35",
              border: "1px solid #16365C",
              borderRadius: "6px",
              color: "#FFFFFF",
              fontSize: "12px",
              padding: "7px 10px",
              outline: "none"
            }}
          />
        </div>
      </div>
    </div>
  );
}
