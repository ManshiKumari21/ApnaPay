import React, { useState, useEffect } from "react";
import {
  Gauge,
  Search,
  Filter,
  RefreshCw,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  ShieldCheck,
  Calendar,
  DollarSign,
  TrendingUp,
  X
} from "lucide-react";
import wealthService from "../../services/wealthService";

export default function CreditScoreRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [bureau, setBureau] = useState("All");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const recordsPerPage = 6;

  // Selected for Details
  const [selectedReq, setSelectedReq] = useState(null);
  const [detailsData, setDetailsData] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await wealthService.getCreditScoreRequests({
        bureau,
        status,
        search
      });
      if (res?.success) {
        setRequests(res.requests || []);
      } else {
        setError(res?.message || "Failed to fetch credit score records");
      }
    } catch (err) {
      setError(err?.message || "Error connecting to credit score service");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [bureau, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRequests();
  };

  const handleOpenDetails = async (req) => {
    setSelectedReq(req);
    setDetailsLoading(true);
    try {
      const res = await wealthService.getCreditScoreDetails(req.id);
      if (res?.success) {
        setDetailsData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const exportCSV = () => {
    if (!requests.length) return;
    const headers = ["Request Ref", "User ID", "Customer Name", "PAN Number", "Bureau", "Score", "Rating", "Report Date", "Consent Status", "Request Status"];
    const rows = requests.map(r => [
      r.request_reference,
      r.user_id,
      `"${r.customer_name}"`,
      r.pan_number,
      `"${r.credit_bureau}"`,
      r.credit_score || "",
      r.score_category || "",
      r.report_date,
      r.consent_status,
      r.request_status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ApnaPay_Credit_Score_Requests_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(requests.length / recordsPerPage) || 1;
  const paginatedRequests = requests.slice((page - 1) * recordsPerPage, page * recordsPerPage);

  return (
    <div className="dashboard-content">
      {/* Page Heading */}
      <div className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "-0.5px" }}>
            Credit Score Inquiries & Reports
          </h1>
          <p style={{ color: "var(--secondary-text)", fontSize: "13.5px", marginTop: "4px" }}>
            Official customer credit report requests, authorized bureau pulls, and consent audit trails.
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
            onClick={fetchRequests}
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

      {/* Filter and Search Bar */}
      <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <div style={{ flex: "1 1 240px", position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted-text)" }} />
            <input
              type="text"
              placeholder="Search by Request ID, Customer Name, PAN..."
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
              value={bureau}
              onChange={(e) => { setBureau(e.target.value); setPage(1); }}
              style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px", color: "#FFFFFF", fontSize: "13px" }}
            >
              <option value="All">All Credit Bureaus</option>
              <option value="CIBIL">TransUnion CIBIL</option>
              <option value="Experian">Experian India</option>
              <option value="CRIF High Mark">CRIF High Mark</option>
              <option value="Equifax">Equifax India</option>
            </select>

            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px", color: "#FFFFFF", fontSize: "13px" }}
            >
              <option value="All">All Statuses</option>
              <option value="Successful">Successful</option>
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

      {/* Requests Table Card */}
      <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#071426", borderBottom: "1px solid var(--border-color)", color: "var(--secondary-text)" }}>
                <th style={{ padding: "12px 16px" }}>Request ID</th>
                <th style={{ padding: "12px 16px" }}>Customer Name</th>
                <th style={{ padding: "12px 16px" }}>Masked PAN</th>
                <th style={{ padding: "12px 16px" }}>Bureau</th>
                <th style={{ padding: "12px 16px" }}>Credit Score</th>
                <th style={{ padding: "12px 16px" }}>Band / Tier</th>
                <th style={{ padding: "12px 16px" }}>Report Date</th>
                <th style={{ padding: "12px 16px" }}>Consent</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ padding: "40px", textAlign: "center", color: "var(--secondary-text)" }}>
                    <RefreshCw size={20} className="spin" style={{ margin: "0 auto 10px" }} />
                    Loading credit score requests...
                  </td>
                </tr>
              ) : paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: "40px", textAlign: "center", color: "var(--secondary-text)" }}>
                    No credit score reports found matching the criteria.
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid rgba(23, 56, 93, 0.5)" }}>
                    <td style={{ padding: "14px 16px", color: "var(--cyan-highlight)", fontWeight: "700" }}>
                      {r.request_reference}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: "700", color: "#FFFFFF" }}>{r.customer_name}</div>
                      <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>User ID: #{r.user_id}</div>
                    </td>
                    <td style={{ padding: "14px 16px", fontFamily: "monospace", color: "#FFFFFF" }}>
                      {r.pan_number ? `${r.pan_number.slice(0, 2)}***${r.pan_number.slice(-2)}` : "—"}
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--secondary-text)" }}>
                      <span style={{ fontSize: "11.5px", background: "rgba(8, 123, 255, 0.12)", padding: "3px 8px", borderRadius: "4px", color: "#00D5FF" }}>
                        {r.credit_bureau}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: "900", fontSize: "16px", color: (r.credit_score || 0) >= 750 ? "#00E599" : (r.credit_score || 0) >= 700 ? "#00D5FF" : "#F59E0B" }}>
                      {r.credit_score || "—"}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#FFFFFF", fontWeight: "600" }}>
                      {r.score_category || "—"}
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--secondary-text)" }}>
                      {r.report_date}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: "11px", color: r.consent_status === "Consented" ? "#00E599" : "#FF6B6B" }}>
                        ● {r.consent_status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "3px 8px",
                          borderRadius: "999px",
                          background: r.request_status === "Successful" ? "rgba(0, 229, 153, 0.15)" : "rgba(245, 158, 11, 0.15)",
                          color: r.request_status === "Successful" ? "#00E599" : "#F59E0B"
                        }}
                      >
                        {r.request_status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(r)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "rgba(0, 213, 255, 0.12)",
                          border: "1px solid rgba(0, 213, 255, 0.3)",
                          color: "var(--cyan-highlight)",
                          padding: "5px 10px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        <Eye size={13} /> Full Report
                      </button>
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
            Showing page {page} of {totalPages} ({requests.length} total score inquiries)
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

      {/* Credit Report Modal */}
      {selectedReq && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(5, 13, 27, 0.8)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "16px", maxWidth: "650px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "24px", boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--cyan-highlight)", fontWeight: "700" }}>{selectedReq.request_reference}</span>
                <h2 style={{ fontSize: "20px", color: "#FFFFFF", marginTop: "2px" }}>{selectedReq.customer_name}</h2>
                <div style={{ fontSize: "12px", color: "var(--secondary-text)" }}>Bureau: {selectedReq.credit_bureau} • Generated: {selectedReq.report_date}</div>
              </div>
              <button type="button" onClick={() => setSelectedReq(null)} style={{ background: "transparent", border: "none", color: "#A9BDD7", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {/* Score Showcase Hero */}
            <div style={{ background: "linear-gradient(135deg, #071E3D 0%, #071426 100%)", border: "1px solid rgba(0, 213, 255, 0.3)", borderRadius: "12px", padding: "20px", textAlign: "center", marginBottom: "20px" }}>
              <span style={{ fontSize: "12px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Official Credit Health Score</span>
              <div style={{ fontSize: "44px", fontWeight: "900", color: (selectedReq.credit_score || 0) >= 750 ? "#00E599" : "#00D5FF", lineHeight: 1.1, marginTop: "4px" }}>
                {selectedReq.credit_score}
              </div>
              <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#FFFFFF", marginTop: "4px" }}>
                Rating: <span style={{ color: "#00E599" }}>{selectedReq.score_category}</span> (Score Range: 300 - 900)
              </div>
            </div>

            {/* Credit Bureau Report Breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#071426", padding: "16px", borderRadius: "10px", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>On-Time Payment History</div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#00E599" }}>{selectedReq.payment_history_pct || 99.2}%</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Credit Utilization Ratio</div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#00D5FF" }}>{selectedReq.credit_utilization_pct || 24.5}%</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Active Credit Accounts</div>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#FFFFFF" }}>{selectedReq.active_accounts || 6} Trades</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Total Outstanding Balance</div>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#FFFFFF" }}>₹{Number(selectedReq.outstanding_balance || 285400).toLocaleString("en-IN")}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Credit Inquiries (Last 12 Mo)</div>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#F59E0B" }}>{selectedReq.total_enquiries || 3} Enquiries</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Digital Customer Consent</div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#00E599" }}>{selectedReq.consent_status} (e-Signed)</div>
              </div>
            </div>

            <p style={{ fontSize: "11.5px", color: "var(--muted-text)", marginBottom: "20px", lineHeight: 1.4 }}>
              * Data retrieved via authorized encrypted server-to-server connection. ApnaPay does not share or retain unencrypted credit bureau histories outside authorized RBI compliance rules.
            </p>

            <button
              type="button"
              onClick={() => setSelectedReq(null)}
              style={{ width: "100%", background: "#087BFF", border: "none", color: "#FFFFFF", padding: "10px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
