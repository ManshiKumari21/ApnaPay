import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle,
  PlayCircle,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Download,
  Eye,
  Shield,
  Layers,
  ArrowRight,
  TrendingUp,
  DollarSign,
  X
} from "lucide-react";
import wealthService from "../../services/wealthService";

export default function SipManagementAdmin({ onNavigate, isCustomer = false }) {
  const [activeTab, setActiveTab] = useState("subscriptions"); // subscriptions, upcoming, failed, mandates, history
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [frequency, setFrequency] = useState("All");
  const [page, setPage] = useState(1);
  const recordsPerPage = 5;

  // Selected item for details modal
  const [selectedSip, setSelectedSip] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await wealthService.getSipManagementData({
        status,
        frequency,
        search
      });
      if (res?.success) {
        setData(res);
      } else {
        setError(res?.message || "Failed to fetch SIP records");
      }
    } catch (err) {
      setError(err?.message || "Error connecting to SIP service");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [status, frequency]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleAction = async (sipId, action) => {
    if (!window.confirm(`Are you sure you want to ${action.toUpperCase()} SIP #${sipId}?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await wealthService.updateSipStatus(sipId, action);
      if (res?.success) {
        await fetchData();
        if (selectedSip && selectedSip.id === sipId) {
          setSelectedSip(res.plan);
        }
      }
    } catch (err) {
      alert("Failed to update SIP status: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const exportCSV = () => {
    const list = data?.sips || [];
    if (!list.length) return;
    const headers = ["SIP ID", "Investor Name", "User ID", "Scheme Name", "Amount", "Frequency", "Start Date", "Next Due Date", "Mandate", "Status"];
    const rows = list.map(s => [
      s.id,
      `"${s.investor_name}"`,
      s.user_id,
      `"${s.scheme_name}"`,
      s.installment_amount,
      s.frequency,
      s.start_date,
      s.next_due_date,
      `"${s.mandate_status}"`,
      s.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ApnaPay_SIP_Subscriptions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = data?.stats || {};
  const sips = data?.sips || [];
  const upcoming = data?.upcomingInstallments || [];
  const failed = data?.failedPayments || [];
  const mandates = data?.mandates || [];
  const history = data?.history || [];

  const totalPages = Math.ceil(sips.length / recordsPerPage) || 1;
  const paginatedSips = sips.slice((page - 1) * recordsPerPage, page * recordsPerPage);

  return (
    <div className="dashboard-content">
      {/* Page Heading */}
      <div className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "-0.5px" }}>
            {isCustomer ? "Systematic Investment Plans (SIP)" : "SIP Management Console"}
          </h1>
          <p style={{ color: "var(--secondary-text)", fontSize: "13.5px", marginTop: "4px" }}>
            {isCustomer
              ? "Manage your recurring auto-debit plans, upcoming installments, and e-mandates."
              : "Monitor investor SIP subscriptions, upcoming automated installments, failed auto-debits, and recurring mandates."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={exportCSV}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(0, 213, 255, 0.12)",
              border: "1px solid rgba(0, 213, 255, 0.3)",
              color: "var(--cyan-highlight)",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            type="button"
            className="refresh-btn"
            onClick={fetchData}
            disabled={loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(8, 123, 255, 0.15)",
              border: "1px solid var(--border-color)",
              color: "var(--cyan-highlight)",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(255, 77, 77, 0.12)", border: "1px solid rgba(255, 77, 77, 0.3)", padding: "14px 18px", borderRadius: "10px", color: "#FF6B6B", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {/* 6 KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Total SIPs</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", marginTop: "4px" }}>{stats.totalSips || sips.length}</div>
          <span style={{ fontSize: "11px", color: "var(--cyan-highlight)" }}>Registered folios</span>
        </div>

        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Active SIPs</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#00E599", marginTop: "4px" }}>{stats.activeSips || 5}</div>
          <span style={{ fontSize: "11px", color: "#00E599" }}>Live recurring debits</span>
        </div>

        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Paused Plans</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#F59E0B", marginTop: "4px" }}>{stats.pausedSips || 1}</div>
          <span style={{ fontSize: "11px", color: "#F59E0B" }}>Temporary pause by user</span>
        </div>

        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Cancelled SIPs</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#FF4D4D", marginTop: "4px" }}>{stats.cancelledSips || 0}</div>
          <span style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Terminated mandates</span>
        </div>

        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Failed Debits</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#FF6B6B", marginTop: "4px" }}>{stats.failedSipPayments || failed.length}</div>
          <span style={{ fontSize: "11px", color: "#FF6B6B" }}>Requires balance retry</span>
        </div>

        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Monthly Collection</span>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#00D5FF", marginTop: "4px" }}>₹{Number(stats.monthlyCollection || 22500).toLocaleString("en-IN")}</div>
          <span style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Monthly volume book</span>
        </div>
      </div>

      {/* Navigation Tabs for Sub-sections */}
      <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid var(--border-color)", marginBottom: "20px", overflowX: "auto" }}>
        {[
          { key: "subscriptions", label: "SIP Subscriptions", count: sips.length },
          { key: "upcoming", label: "Upcoming Installments", count: upcoming.length },
          { key: "failed", label: "Failed Payments", count: failed.length },
          { key: "mandates", label: "Mandate Management", count: mandates.length },
          { key: "history", label: "Installment History", count: history.length }
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: activeTab === tab.key ? "3px solid #087BFF" : "3px solid transparent",
              color: activeTab === tab.key ? "#FFFFFF" : "var(--secondary-text)",
              padding: "10px 16px",
              fontSize: "13.5px",
              fontWeight: activeTab === tab.key ? "700" : "500",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap"
            }}
          >
            {tab.label}
            <span
              style={{
                fontSize: "10.5px",
                padding: "2px 6px",
                borderRadius: "999px",
                background: activeTab === tab.key ? "rgba(8, 123, 255, 0.25)" : "rgba(23, 56, 93, 0.5)",
                color: activeTab === tab.key ? "#00D5FF" : "var(--secondary-text)"
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* TAB 1: SIP SUBSCRIPTIONS */}
      {activeTab === "subscriptions" && (
        <>
          {/* Search and Filters */}
          <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
            <form onSubmit={handleSearchSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
              <div style={{ flex: "1 1 240px", position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted-text)" }} />
                <input
                  type="text"
                  placeholder="Search SIP ID, Investor Name, Scheme..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#071426",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    padding: "8px 12px 8px 36px",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                  style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px", color: "#FFFFFF", fontSize: "13px" }}
                >
                  <option value="All">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={frequency}
                  onChange={(e) => { setFrequency(e.target.value); setPage(1); }}
                  style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px", color: "#FFFFFF", fontSize: "13px" }}
                >
                  <option value="All">All Frequencies</option>
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="quarterly">Quarterly</option>
                </select>

                <button
                  type="submit"
                  style={{ background: "#087BFF", border: "none", color: "#FFFFFF", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                >
                  Apply
                </button>
              </div>
            </form>
          </div>

          {/* Subscriptions Table */}
          <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#071426", borderBottom: "1px solid var(--border-color)", color: "var(--secondary-text)" }}>
                    <th style={{ padding: "12px 16px" }}>SIP ID</th>
                    <th style={{ padding: "12px 16px" }}>Investor Name</th>
                    <th style={{ padding: "12px 16px" }}>Scheme Name</th>
                    <th style={{ padding: "12px 16px" }}>SIP Amount</th>
                    <th style={{ padding: "12px 16px" }}>Frequency</th>
                    <th style={{ padding: "12px 16px" }}>Start Date</th>
                    <th style={{ padding: "12px 16px" }}>Next Auto Debit</th>
                    <th style={{ padding: "12px 16px" }}>Mandate</th>
                    <th style={{ padding: "12px 16px" }}>Status</th>
                    <th style={{ padding: "12px 16px", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSips.map((sip) => (
                    <tr key={sip.id} style={{ borderBottom: "1px solid rgba(23, 56, 93, 0.5)" }}>
                      <td style={{ padding: "14px 16px", color: "var(--cyan-highlight)", fontWeight: "700" }}>
                        #SIP-{sip.id}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: "700", color: "#FFFFFF" }}>{sip.investor_name}</div>
                        <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>ID: {sip.user_id} • {sip.user_email || sip.user_phone}</div>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#FFFFFF" }}>
                        {sip.scheme_name}
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: "700", color: "#00D5FF" }}>
                        ₹{Number(sip.installment_amount).toFixed(2)}
                      </td>
                      <td style={{ padding: "14px 16px", textTransform: "capitalize", color: "var(--secondary-text)" }}>
                        {sip.frequency}
                      </td>
                      <td style={{ padding: "14px 16px", color: "var(--secondary-text)" }}>
                        {sip.start_date}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#00E599", fontWeight: "600" }}>
                        {sip.next_due_date}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "12px", color: "var(--secondary-text)" }}>
                        {sip.mandate_status}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "700",
                            padding: "3px 8px",
                            borderRadius: "999px",
                            background: sip.status === "active" ? "rgba(0, 229, 153, 0.15)" : sip.status === "paused" ? "rgba(245, 158, 11, 0.15)" : "rgba(255, 77, 77, 0.15)",
                            color: sip.status === "active" ? "#00E599" : sip.status === "paused" ? "#F59E0B" : "#FF6B6B",
                            textTransform: "uppercase"
                          }}
                        >
                          {sip.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button
                            type="button"
                            onClick={() => setSelectedSip(sip)}
                            title="View Details"
                            style={{ background: "rgba(8, 123, 255, 0.15)", border: "1px solid var(--border-color)", color: "#00D5FF", padding: "5px 8px", borderRadius: "6px", cursor: "pointer" }}
                          >
                            <Eye size={14} />
                          </button>
                          {sip.status === "active" && (
                            <button
                              type="button"
                              onClick={() => handleAction(sip.id, "pause")}
                              title="Pause SIP"
                              style={{ background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)", color: "#F59E0B", padding: "5px 8px", borderRadius: "6px", cursor: "pointer" }}
                            >
                              <PauseCircle size={14} />
                            </button>
                          )}
                          {sip.status === "paused" && (
                            <button
                              type="button"
                              onClick={() => handleAction(sip.id, "resume")}
                              title="Resume SIP"
                              style={{ background: "rgba(0, 229, 153, 0.15)", border: "1px solid rgba(0, 229, 153, 0.3)", color: "#00E599", padding: "5px 8px", borderRadius: "6px", cursor: "pointer" }}
                            >
                              <PlayCircle size={14} />
                            </button>
                          )}
                          {sip.status !== "cancelled" && (
                            <button
                              type="button"
                              onClick={() => handleAction(sip.id, "cancel")}
                              title="Cancel SIP"
                              style={{ background: "rgba(255, 77, 77, 0.15)", border: "1px solid rgba(255, 77, 77, 0.3)", color: "#FF6B6B", padding: "5px 8px", borderRadius: "6px", cursor: "pointer" }}
                            >
                              <XCircle size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid var(--border-color)", background: "#071426" }}>
              <span style={{ fontSize: "12px", color: "var(--secondary-text)" }}>
                Showing page {page} of {totalPages} ({sips.length} total SIPs)
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  style={{ background: "#0B1B32", border: "1px solid var(--border-color)", color: "#FFFFFF", padding: "4px 12px", borderRadius: "6px", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.5 : 1 }}
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  style={{ background: "#0B1B32", border: "1px solid var(--border-color)", color: "#FFFFFF", padding: "4px 12px", borderRadius: "6px", cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.5 : 1 }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: UPCOMING INSTALLMENTS */}
      {activeTab === "upcoming" && (
        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)" }}>
            <h3 style={{ fontSize: "16px", color: "#FFFFFF", fontWeight: "700" }}>Upcoming Auto-Debit Installments</h3>
            <p style={{ fontSize: "12px", color: "var(--secondary-text)" }}>Automated NACH & UPI AutoPay batches queued for execution</p>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#071426", color: "var(--secondary-text)", borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "12px 16px" }}>SIP Plan</th>
                <th style={{ padding: "12px 16px" }}>Investor</th>
                <th style={{ padding: "12px 16px" }}>Scheme Name</th>
                <th style={{ padding: "12px 16px" }}>Installment Amount</th>
                <th style={{ padding: "12px 16px" }}>Scheduled Due Date</th>
                <th style={{ padding: "12px 16px" }}>Mandate Route</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid rgba(23, 56, 93, 0.5)" }}>
                  <td style={{ padding: "14px 16px", color: "var(--cyan-highlight)", fontWeight: "700" }}>#SIP-{u.sip_id}</td>
                  <td style={{ padding: "14px 16px", fontWeight: "700", color: "#FFFFFF" }}>{u.investor_name}</td>
                  <td style={{ padding: "14px 16px", color: "#FFFFFF" }}>{u.scheme_name}</td>
                  <td style={{ padding: "14px 16px", fontWeight: "700", color: "#00D5FF" }}>₹{Number(u.amount).toFixed(2)}</td>
                  <td style={{ padding: "14px 16px", color: "#00E599", fontWeight: "600" }}>{u.due_date}</td>
                  <td style={{ padding: "14px 16px", color: "var(--secondary-text)" }}>{u.mandate_mode}</td>
                  <td style={{ padding: "14px 16px" }}><span style={{ fontSize: "11px", background: "rgba(0, 229, 153, 0.15)", color: "#00E599", padding: "3px 8px", borderRadius: "4px" }}>Queued</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: FAILED PAYMENTS */}
      {activeTab === "failed" && (
        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)" }}>
            <h3 style={{ fontSize: "16px", color: "#FFFFFF", fontWeight: "700" }}>Failed SIP Installment Exceptions</h3>
            <p style={{ fontSize: "12px", color: "var(--secondary-text)" }}>Failed auto-debit transactions requiring re-trigger or user notification</p>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#071426", color: "var(--secondary-text)", borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "12px 16px" }}>Exception ID</th>
                <th style={{ padding: "12px 16px" }}>SIP ID</th>
                <th style={{ padding: "12px 16px" }}>Investor</th>
                <th style={{ padding: "12px 16px" }}>Scheme Name</th>
                <th style={{ padding: "12px 16px" }}>Amount</th>
                <th style={{ padding: "12px 16px" }}>Attempt Date</th>
                <th style={{ padding: "12px 16px" }}>Failure Reason</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {failed.map(f => (
                <tr key={f.id} style={{ borderBottom: "1px solid rgba(23, 56, 93, 0.5)" }}>
                  <td style={{ padding: "14px 16px", color: "#FF6B6B", fontWeight: "700" }}>#ERR-{f.id}</td>
                  <td style={{ padding: "14px 16px", color: "var(--cyan-highlight)" }}>#SIP-{f.sip_id}</td>
                  <td style={{ padding: "14px 16px", fontWeight: "700", color: "#FFFFFF" }}>{f.investor_name}</td>
                  <td style={{ padding: "14px 16px", color: "#FFFFFF" }}>{f.scheme_name}</td>
                  <td style={{ padding: "14px 16px", fontWeight: "700", color: "#FF6B6B" }}>₹{Number(f.amount).toFixed(2)}</td>
                  <td style={{ padding: "14px 16px", color: "var(--secondary-text)" }}>{f.attempt_date}</td>
                  <td style={{ padding: "14px 16px", color: "#FF6B6B" }}>{f.failure_reason}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontSize: "11px", background: f.status === "recovered" ? "rgba(0, 229, 153, 0.15)" : "rgba(255, 77, 77, 0.15)", color: f.status === "recovered" ? "#00E599" : "#FF6B6B", padding: "3px 8px", borderRadius: "4px" }}>
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: MANDATE MANAGEMENT */}
      {activeTab === "mandates" && (
        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)" }}>
            <h3 style={{ fontSize: "16px", color: "#FFFFFF", fontWeight: "700" }}>Approved Auto-Debit Mandates</h3>
            <p style={{ fontSize: "12px", color: "var(--secondary-text)" }}>NPCI e-NACH & NPCI UPI AutoPay mandate limits and bank linkage</p>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#071426", color: "var(--secondary-text)", borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "12px 16px" }}>Mandate UMRN</th>
                <th style={{ padding: "12px 16px" }}>Investor</th>
                <th style={{ padding: "12px 16px" }}>Mandate Type</th>
                <th style={{ padding: "12px 16px" }}>Linked Bank / VPA</th>
                <th style={{ padding: "12px 16px" }}>Max Limit</th>
                <th style={{ padding: "12px 16px" }}>Valid Until</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {mandates.map(m => (
                <tr key={m.id} style={{ borderBottom: "1px solid rgba(23, 56, 93, 0.5)" }}>
                  <td style={{ padding: "14px 16px", color: "var(--cyan-highlight)", fontWeight: "700" }}>{m.id}</td>
                  <td style={{ padding: "14px 16px", fontWeight: "700", color: "#FFFFFF" }}>{m.user_name}</td>
                  <td style={{ padding: "14px 16px" }}><span style={{ fontSize: "11px", background: "rgba(8, 123, 255, 0.15)", color: "#00D5FF", padding: "3px 8px", borderRadius: "4px" }}>{m.mandate_type}</span></td>
                  <td style={{ padding: "14px 16px", color: "#FFFFFF" }}>{m.bank_name}</td>
                  <td style={{ padding: "14px 16px", fontWeight: "700", color: "#00E599" }}>₹{Number(m.max_amount).toFixed(2)}</td>
                  <td style={{ padding: "14px 16px", color: "var(--secondary-text)" }}>{m.valid_until}</td>
                  <td style={{ padding: "14px 16px" }}><span style={{ fontSize: "11px", background: "rgba(0, 229, 153, 0.15)", color: "#00E599", padding: "3px 8px", borderRadius: "4px" }}>{m.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: TRANSACTION HISTORY */}
      {activeTab === "history" && (
        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)" }}>
            <h3 style={{ fontSize: "16px", color: "#FFFFFF", fontWeight: "700" }}>SIP Installment Execution History</h3>
            <p style={{ fontSize: "12px", color: "var(--secondary-text)" }}>Successful unit allotment records from BSE StAR MF</p>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#071426", color: "var(--secondary-text)", borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "12px 16px" }}>Ref ID</th>
                <th style={{ padding: "12px 16px" }}>Investor</th>
                <th style={{ padding: "12px 16px" }}>Scheme Name</th>
                <th style={{ padding: "12px 16px" }}>Amount</th>
                <th style={{ padding: "12px 16px" }}>NAV</th>
                <th style={{ padding: "12px 16px" }}>Units Allotted</th>
                <th style={{ padding: "12px 16px" }}>Date & Time</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} style={{ borderBottom: "1px solid rgba(23, 56, 93, 0.5)" }}>
                  <td style={{ padding: "14px 16px", color: "var(--cyan-highlight)", fontWeight: "700" }}>{h.id}</td>
                  <td style={{ padding: "14px 16px", fontWeight: "700", color: "#FFFFFF" }}>{h.user_name}</td>
                  <td style={{ padding: "14px 16px", color: "#FFFFFF" }}>{h.scheme_name}</td>
                  <td style={{ padding: "14px 16px", fontWeight: "700", color: "#00D5FF" }}>₹{Number(h.amount).toFixed(2)}</td>
                  <td style={{ padding: "14px 16px", color: "var(--secondary-text)" }}>₹{h.nav}</td>
                  <td style={{ padding: "14px 16px", color: "#00E599", fontWeight: "600" }}>{h.units}</td>
                  <td style={{ padding: "14px 16px", color: "var(--secondary-text)" }}>{h.transaction_date}</td>
                  <td style={{ padding: "14px 16px" }}><span style={{ fontSize: "11px", background: "rgba(0, 229, 153, 0.15)", color: "#00E599", padding: "3px 8px", borderRadius: "4px" }}>{h.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SIP Details Modal */}
      {selectedSip && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(5, 13, 27, 0.8)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "16px", maxWidth: "600px", width: "100%", padding: "24px", boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--cyan-highlight)", fontWeight: "700" }}>#SIP-{selectedSip.id}</span>
                <h2 style={{ fontSize: "18px", color: "#FFFFFF", marginTop: "2px" }}>{selectedSip.scheme_name}</h2>
                <div style={{ fontSize: "12px", color: "var(--secondary-text)" }}>Investor: {selectedSip.investor_name} (ID: {selectedSip.user_id})</div>
              </div>
              <button type="button" onClick={() => setSelectedSip(null)} style={{ background: "transparent", border: "none", color: "#A9BDD7", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#071426", padding: "16px", borderRadius: "10px", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Installment Amount</div>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#00D5FF" }}>₹{Number(selectedSip.installment_amount).toFixed(2)}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Frequency</div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "#FFFFFF", textTransform: "capitalize" }}>{selectedSip.frequency}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Next Auto-Debit</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#00E599" }}>{selectedSip.next_due_date}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Mandate Route</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#FFFFFF" }}>{selectedSip.mandate_status}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Total Cumulative Invested</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#FFFFFF" }}>₹{Number(selectedSip.total_invested || 0).toFixed(2)}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Installments Paid</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#FFFFFF" }}>{selectedSip.installments_paid || 0} Successful</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              {selectedSip.status === "active" && (
                <button
                  type="button"
                  onClick={() => handleAction(selectedSip.id, "pause")}
                  disabled={actionLoading}
                  style={{ flex: 1, background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)", color: "#F59E0B", padding: "10px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                >
                  Pause Subscription
                </button>
              )}
              {selectedSip.status === "paused" && (
                <button
                  type="button"
                  onClick={() => handleAction(selectedSip.id, "resume")}
                  disabled={actionLoading}
                  style={{ flex: 1, background: "rgba(0, 229, 153, 0.15)", border: "1px solid rgba(0, 229, 153, 0.3)", color: "#00E599", padding: "10px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                >
                  Resume Subscription
                </button>
              )}
              {selectedSip.status !== "cancelled" && (
                <button
                  type="button"
                  onClick={() => handleAction(selectedSip.id, "cancel")}
                  disabled={actionLoading}
                  style={{ flex: 1, background: "rgba(255, 77, 77, 0.15)", border: "1px solid rgba(255, 77, 77, 0.3)", color: "#FF6B6B", padding: "10px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                >
                  Cancel Plan
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedSip(null)}
                style={{ flex: 1, background: "#087BFF", border: "none", color: "#FFFFFF", padding: "10px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
