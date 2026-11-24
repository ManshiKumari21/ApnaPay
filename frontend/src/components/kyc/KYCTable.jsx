import React, { useState, useEffect } from "react";
import {
  Search, Filter, Calendar, ChevronLeft, ChevronRight,
  Eye, RefreshCw, XCircle, FileText, CheckCircle2, Clock, AlertCircle,
  Smartphone, ShieldCheck, AlertTriangle
} from "lucide-react";
import api from "../../services/api";

export default function KYCTable({ onViewDetails }) {
  // State for data
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Pagination states
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [mobileOtpStatus, setMobileOtpStatus] = useState("all");
  const [docType, setDocType] = useState("all");
  const [kycType, setKycType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Fetch applications from Real Database API
  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        status,
        mobile_otp_status: mobileOtpStatus,
        document_type: docType,
        kyc_type: kycType,
        search: search.trim(),
        start_date: startDate,
        end_date: endDate
      });

      // Avoid double /api prefix; api.js base URL already includes /api/v1
      const res = await api.get(`/admin/kyc?${params.toString()}`);
      if (res.data.success) {
        setApplications(res.data.data || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      console.error("Fetch KYC Applications error:", err);
      setError(err.response?.data?.message || "Failed to load KYC applications from database.");
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch on filter change
  useEffect(() => {
    fetchApplications();
  }, [status, mobileOtpStatus, docType, kycType, page, limit]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchApplications();
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch("");
    setStatus("all");
    setMobileOtpStatus("all");
    setDocType("all");
    setKycType("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  // Format date helper
  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    const d = new Date(isoString);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // KYC Verification Status badge
  const renderStatusBadge = (st) => {
    const s = (st || "").toLowerCase();
    if (s === "verified" || s === "approved") {
      return (
        <span className="badge-pill verified">
          <CheckCircle2 size={12} /> VERIFIED
        </span>
      );
    }
    if (s === "rejected") {
      return (
        <span className="badge-pill rejected">
          <XCircle size={12} /> REJECTED
        </span>
      );
    }
    if (s === "under_review" || s === "resubmission_requested") {
      return (
        <span className="badge-pill" style={{ background: "#2e124d", color: "#c084fc", border: "1px solid #581c87" }}>
          <AlertCircle size={12} /> UNDER REVIEW
        </span>
      );
    }
    return (
      <span className="badge-pill pending">
        <Clock size={12} /> PENDING
      </span>
    );
  };

  // Mobile OTP Status badge
  const renderMobileOtpBadge = (isVerified) => {
    if (isVerified) {
      return (
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          background: "#06331a",
          color: "#34d399",
          border: "1px solid #059669",
          padding: "3px 8px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: "600"
        }}>
          <CheckCircle2 size={11} /> Verified
        </span>
      );
    }
    return (
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        background: "#332204",
        color: "#fbbf24",
        border: "1px solid #b45309",
        padding: "3px 8px",
        borderRadius: "12px",
        fontSize: "11px",
        fontWeight: "600"
      }}>
        <AlertTriangle size={11} /> Not Verified
      </span>
    );
  };

  return (
    <div className="table-card">
      {/* 1. Primary Toolbar: Search & Quick Status Filters */}
      <div className="table-toolbar" style={{ flexWrap: "wrap", gap: "12px", padding: "16px 20px" }}>
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px", flex: "1 1 280px" }}>
          <div className="search-box" style={{ flex: 1 }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by Name, Mobile, User ID (#USR-), App ID (#KYC-)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="refresh-btn" style={{ padding: "0 16px", height: "38px" }}>
            Search
          </button>
        </form>

        {/* Quick Status Pill Filters */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          {[
            { id: "all", label: "All Status" },
            { id: "pending", label: "Pending" },
            { id: "verified", label: "Verified" },
            { id: "rejected", label: "Rejected" },
            { id: "under_review", label: "Under Review" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setStatus(item.id); setPage(1); }}
              style={{
                background: status === item.id ? "#087cff" : "#0d1b33",
                color: status === item.id ? "#ffffff" : "#94a3b8",
                border: "1px solid #1a2f52",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: status === item.id ? "600" : "400",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Secondary Filter Bar: Mobile OTP Status, Document Type, KYC Type, Date Range & Pagination */}
      <div style={{
        padding: "12px 20px",
        background: "#071326",
        borderBottom: "1px solid #142847",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px"
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
          {/* Mobile OTP Status Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#7a90b3" }}>Mobile OTP:</span>
            <select
              value={mobileOtpStatus}
              onChange={(e) => { setMobileOtpStatus(e.target.value); setPage(1); }}
              style={{
                background: "#08152b",
                border: "1px solid #1c3257",
                color: "#e2ecff",
                padding: "6px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              <option value="all">All OTP Status</option>
              <option value="verified">Verified</option>
              <option value="not_verified">Not Verified</option>
            </select>
          </div>

          {/* Document Type Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#7a90b3" }}>Document:</span>
            <select
              value={docType}
              onChange={(e) => { setDocType(e.target.value); setPage(1); }}
              style={{
                background: "#08152b",
                border: "1px solid #1c3257",
                color: "#e2ecff",
                padding: "6px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              <option value="all">All Document Types</option>
              <option value="Aadhaar">Aadhaar Card</option>
              <option value="PAN">PAN Card</option>
              <option value="Passport">Passport</option>
              <option value="Voter">Voter ID</option>
            </select>
          </div>

          {/* KYC Type Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#7a90b3" }}>KYC Type:</span>
            <select
              value={kycType}
              onChange={(e) => { setKycType(e.target.value); setPage(1); }}
              style={{
                background: "#08152b",
                border: "1px solid #1c3257",
                color: "#e2ecff",
                padding: "6px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              <option value="all">All KYC Types</option>
              <option value="Full KYC">Full KYC</option>
              <option value="Minimum KYC">Minimum KYC</option>
            </select>
          </div>

          {/* Date Range Inputs */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#7a90b3" }}>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              style={{
                background: "#08152b",
                border: "1px solid #1c3257",
                color: "#e2ecff",
                padding: "5px 8px",
                borderRadius: "6px",
                fontSize: "12px"
              }}
            />
            <span style={{ fontSize: "12px", color: "#7a90b3" }}>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              style={{
                background: "#08152b",
                border: "1px solid #1c3257",
                color: "#e2ecff",
                padding: "5px 8px",
                borderRadius: "6px",
                fontSize: "12px"
              }}
            />
          </div>

          {/* Reset Filters button */}
          {(search || status !== "all" || mobileOtpStatus !== "all" || docType !== "all" || kycType !== "all" || startDate || endDate) && (
            <button
              onClick={handleResetFilters}
              style={{
                background: "transparent",
                border: "none",
                color: "#f87171",
                fontSize: "12px",
                cursor: "pointer",
                textDecoration: "underline",
                padding: "4px"
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Entries per page & Refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "#7a90b3" }}>Rows per page:</span>
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            style={{
              background: "#08152b",
              border: "1px solid #1c3257",
              color: "#e2ecff",
              padding: "4px 8px",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: "pointer"
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>

          <button
            className="refresh-btn"
            onClick={fetchApplications}
            title="Refresh database records"
            style={{ padding: "6px 10px" }}
          >
            <RefreshCw size={13} className={loading ? "spin" : ""} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div style={{
          margin: "16px 20px",
          padding: "12px 16px",
          background: "#3d1010",
          border: "1px solid #a82424",
          color: "#ff9e9e",
          borderRadius: "6px",
          fontSize: "13px"
        }}>
          {error}
        </div>
      )}

      {/* 3. Applications Table */}
      <div className="table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>App ID</th>
              <th>User ID</th>
              <th>User Name</th>
              <th>Mobile Number</th>
              <th>Mobile OTP Status</th>
              <th>KYC Type</th>
              <th>Document Type</th>
              <th>Submission Date</th>
              <th>KYC Status</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                  <RefreshCw size={24} className="spin" style={{ margin: "0 auto 8px" }} />
                  <div>Loading KYC applications from database...</div>
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                  <FileText size={32} color="#475569" style={{ margin: "0 auto 8px" }} />
                  <div>No KYC applications match the selected criteria.</div>
                  <button
                    onClick={handleResetFilters}
                    className="refresh-btn"
                    style={{ marginTop: "12px", display: "inline-flex" }}
                  >
                    Clear Filters
                  </button>
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app.id}>
                  <td>
                    <strong style={{ color: "#e2ecff" }}>#KYC-{app.id}</strong>
                  </td>
                  <td>
                    <code style={{ color: "#38bdf8", fontSize: "12px" }}>#USR-{app.user_id}</code>
                  </td>
                  <td>
                    <div style={{ fontWeight: "600", color: "#ffffff" }}>
                      {app.user_name}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: "12px", color: "#cbd5e1" }}>{app.mobile}</span>
                  </td>
                  <td>
                    {renderMobileOtpBadge(Boolean(app.mobile_verified))}
                  </td>
                  <td>
                    <span style={{
                      fontSize: "11px",
                      background: "#112644",
                      color: "#60a5fa",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontWeight: "600"
                    }}>
                      {app.kyc_type || "Full KYC"}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: "12px", color: "#cbd5e1" }}>
                      {app.document_type || "Aadhaar Card"}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                      {formatDate(app.submission_date)}
                    </span>
                  </td>
                  <td>
                    {renderStatusBadge(app.verification_status)}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => onViewDetails(app.id)}
                      style={{
                        background: "linear-gradient(90deg, #1269f5, #0752cf)",
                        color: "#ffffff",
                        border: "none",
                        padding: "7px 14px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 2px 8px rgba(18, 105, 245, 0.3)"
                      }}
                    >
                      <Eye size={13} /> View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Pagination Footer */}
      <div style={{
        padding: "16px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        background: "#071326",
        borderTop: "1px solid #142847",
        fontSize: "12px",
        color: "#7a90b3"
      }}>
        <div>
          Showing {applications.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
          {Math.min(page * limit, pagination.total || applications.length)} of{" "}
          <strong>{pagination.total || applications.length}</strong> applications
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            className="refresh-btn"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            style={{ opacity: page <= 1 ? 0.5 : 1, cursor: page <= 1 ? "not-allowed" : "pointer", padding: "6px 12px" }}
          >
            <ChevronLeft size={14} /> Previous
          </button>

          <span style={{ color: "#e2ecff", padding: "0 6px" }}>
            Page {page} of {pagination.totalPages || 1}
          </span>

          <button
            className="refresh-btn"
            disabled={page >= (pagination.totalPages || 1)}
            onClick={() => setPage(p => p + 1)}
            style={{
              opacity: page >= (pagination.totalPages || 1) ? 0.5 : 1,
              cursor: page >= (pagination.totalPages || 1) ? "not-allowed" : "pointer",
              padding: "6px 12px"
            }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
