import React, { useState, useEffect } from "react";
import {
  Receipt,
  Search,
  Filter,
  RefreshCw,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  ArrowRightLeft
} from "lucide-react";
import wealthService from "../../services/wealthService";

export default function InvestmentTransactions({ onNavigate, isCustomer = false }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const recordsPerPage = 6;

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await wealthService.getInvestmentTransactions({
        type,
        status,
        search
      });
      if (res?.success) {
        setTransactions(res.transactions || []);
      } else {
        setError(res?.message || "Failed to fetch investment transactions");
      }
    } catch (err) {
      setError(err?.message || "Error connecting to transaction service");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [type, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

  const exportCSV = () => {
    if (!transactions.length) return;
    const headers = ["Transaction ID", "User Name", "Scheme Name", "Type", "Amount", "Units", "NAV", "Payment Mode", "Reference ID", "Date", "Status"];
    const rows = transactions.map(t => [
      t.id,
      `"${t.user_name}"`,
      `"${t.scheme_name}"`,
      t.transaction_type,
      t.amount,
      t.units || 0,
      t.nav || 0,
      `"${t.payment_mode}"`,
      t.reference_id,
      t.transaction_date,
      t.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ApnaPay_Investment_Transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(transactions.length / recordsPerPage) || 1;
  const paginatedTxns = transactions.slice((page - 1) * recordsPerPage, page * recordsPerPage);

  const totalVolume = transactions.reduce((acc, t) => acc + (t.status === "Successful" ? Number(t.amount || 0) : 0), 0);

  return (
    <div className="dashboard-content">
      {/* Page Heading */}
      <div className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "-0.5px" }}>
            {isCustomer ? "My Investment Transactions" : "Investment Transactions"}
          </h1>
          <p style={{ color: "var(--secondary-text)", fontSize: "13.5px", marginTop: "4px" }}>
            {isCustomer
              ? "Complete statement of your mutual fund purchases, monthly SIP debits, redemptions, and refunds."
              : "Audit log of mutual fund purchases, redemptions, SIP installments, and portfolio switches across BSE StAR MF."}
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
            onClick={fetchTransactions}
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

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Total Transactions</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", marginTop: "4px" }}>{transactions.length}</div>
          <span style={{ fontSize: "11px", color: "var(--cyan-highlight)" }}>Filtered ledger records</span>
        </div>

        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Successful Volume</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#00E599", marginTop: "4px" }}>₹{totalVolume.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
          <span style={{ fontSize: "11px", color: "#00E599" }}>Settled fund allocations</span>
        </div>

        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>In-Progress / Pending</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#F59E0B", marginTop: "4px" }}>
            {transactions.filter(t => t.status === "Processing" || t.status === "Pending").length}
          </div>
          <span style={{ fontSize: "11px", color: "#F59E0B" }}>Under bank clearance</span>
        </div>

        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Failed Orders</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#FF4D4D", marginTop: "4px" }}>
            {transactions.filter(t => t.status === "Failed").length}
          </div>
          <span style={{ fontSize: "11px", color: "#FF4D4D" }}>Insufficient balance or timeout</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <div style={{ flex: "1 1 240px", position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted-text)" }} />
            <input
              type="text"
              placeholder="Search by Txn ID, User Name, Scheme, Ref ID..."
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
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px", color: "#FFFFFF", fontSize: "13px" }}
            >
              <option value="All">All Types</option>
              <option value="SIP Installment">SIP Installment</option>
              <option value="Purchase">Purchase (Lumpsum)</option>
              <option value="Redemption">Redemption</option>
              <option value="Switch">Switch</option>
              <option value="Refund">Refund</option>
            </select>

            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px", color: "#FFFFFF", fontSize: "13px" }}
            >
              <option value="All">All Statuses</option>
              <option value="Successful">Successful</option>
              <option value="Processing">Processing</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>

            <button
              type="submit"
              style={{ background: "#087BFF", border: "none", color: "#FFFFFF", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
            >
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* Table Card */}
      <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#071426", borderBottom: "1px solid var(--border-color)", color: "var(--secondary-text)" }}>
                <th style={{ padding: "12px 16px" }}>Transaction ID</th>
                <th style={{ padding: "12px 16px" }}>Investor Name</th>
                <th style={{ padding: "12px 16px" }}>Scheme Name</th>
                <th style={{ padding: "12px 16px" }}>Type</th>
                <th style={{ padding: "12px 16px" }}>Amount</th>
                <th style={{ padding: "12px 16px" }}>Units / NAV</th>
                <th style={{ padding: "12px 16px" }}>Payment Mode</th>
                <th style={{ padding: "12px 16px" }}>Reference ID</th>
                <th style={{ padding: "12px 16px" }}>Date & Time</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ padding: "40px", textAlign: "center", color: "var(--secondary-text)" }}>
                    <RefreshCw size={20} className="spin" style={{ margin: "0 auto 10px" }} />
                    Loading transactions...
                  </td>
                </tr>
              ) : paginatedTxns.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: "40px", textAlign: "center", color: "var(--secondary-text)" }}>
                    No investment transactions match the filters.
                  </td>
                </tr>
              ) : (
                paginatedTxns.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid rgba(23, 56, 93, 0.5)" }}>
                    <td style={{ padding: "14px 16px", color: "var(--cyan-highlight)", fontWeight: "700" }}>
                      {t.id}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: "700", color: "#FFFFFF" }}>
                      {t.user_name}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#FFFFFF" }}>
                      {t.scheme_name}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background: t.transaction_type === "SIP Installment" ? "rgba(0, 229, 153, 0.15)" : t.transaction_type === "Redemption" ? "rgba(245, 158, 11, 0.15)" : "rgba(8, 123, 255, 0.15)",
                          color: t.transaction_type === "SIP Installment" ? "#00E599" : t.transaction_type === "Redemption" ? "#F59E0B" : "#00D5FF"
                        }}
                      >
                        {t.transaction_type}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: "700", color: "#FFFFFF" }}>
                      ₹{Number(t.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--secondary-text)", fontSize: "12px" }}>
                      {t.units > 0 ? `${t.units} @ ₹${t.nav}` : "—"}
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--secondary-text)" }}>
                      {t.payment_mode}
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--secondary-text)", fontFamily: "monospace" }}>
                      {t.reference_id}
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--secondary-text)" }}>
                      {t.transaction_date}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "3px 8px",
                          borderRadius: "999px",
                          background: t.status === "Successful" ? "rgba(0, 229, 153, 0.15)" : t.status === "Failed" ? "rgba(255, 77, 77, 0.15)" : "rgba(245, 158, 11, 0.15)",
                          color: t.status === "Successful" ? "#00E599" : t.status === "Failed" ? "#FF4D4D" : "#F59E0B"
                        }}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid var(--border-color)", background: "#071426" }}>
          <span style={{ fontSize: "12px", color: "var(--secondary-text)" }}>
            Showing page {page} of {totalPages} ({transactions.length} total entries)
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
    </div>
  );
}
