import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Landmark,
  User,
  DollarSign,
  Calendar,
  X
} from "lucide-react";
import wealthService from "../../services/wealthService";

export default function LoanApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [loanType, setLoanType] = useState("All");
  const [status, setStatus] = useState("All");
  const [lender, setLender] = useState("All");
  const [page, setPage] = useState(1);
  const recordsPerPage = 5;

  // Selected for Details
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailsData, setDetailsData] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await wealthService.getLoanApplications({
        loanType,
        status,
        lender,
        search
      });
      if (res?.success) {
        setApplications(res.applications || []);
      } else {
        setError(res?.message || "Failed to fetch loan applications");
      }
    } catch (err) {
      setError(err?.message || "Error connecting to loan service");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [loanType, status, lender]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApplications();
  };

  const handleOpenDetails = async (app) => {
    setSelectedApp(app);
    setDetailsLoading(true);
    try {
      const res = await wealthService.getLoanApplicationDetails(app.id);
      if (res?.success) {
        setDetailsData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change status to '${newStatus}'?`)) return;
    setUpdating(true);
    try {
      const res = await wealthService.updateLoanApplicationStatus(appId, { status: newStatus });
      if (res?.success) {
        await fetchApplications();
        if (selectedApp && selectedApp.id === appId) {
          handleOpenDetails(res.application);
        }
      }
    } catch (err) {
      alert("Error updating status: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const exportCSV = () => {
    if (!applications.length) return;
    const headers = ["Application Ref", "User ID", "Applicant Name", "Email", "Phone", "Loan Type", "Requested Amount", "Approved Amount", "Tenure (Mo)", "EMI", "Lender", "Status", "Date"];
    const rows = applications.map(a => [
      a.application_reference,
      a.user_id,
      `"${a.applicant_name}"`,
      a.applicant_email || "",
      a.applicant_phone || "",
      a.loan_type,
      a.requested_amount,
      a.approved_amount || "",
      a.tenure_months,
      a.emi_amount || "",
      `"${a.lender_name}"`,
      a.application_status,
      a.created_at
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ApnaPay_Loan_Applications_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(applications.length / recordsPerPage) || 1;
  const paginatedApps = applications.slice((page - 1) * recordsPerPage, page * recordsPerPage);

  return (
    <div className="dashboard-content">
      {/* Page Heading */}
      <div className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "-0.5px" }}>
            Loan Applications Management
          </h1>
          <p style={{ color: "var(--secondary-text)", fontSize: "13.5px", marginTop: "4px" }}>
            Underwriting, e-KYC document verification, credit policy sanctioning, and bank disbursement management.
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
            onClick={fetchApplications}
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
              placeholder="Search by App ID, User ID, Applicant Name..."
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
              value={loanType}
              onChange={(e) => { setLoanType(e.target.value); setPage(1); }}
              style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px", color: "#FFFFFF", fontSize: "13px" }}
            >
              <option value="All">All Loan Types</option>
              <option value="Personal Loan">Personal Loan</option>
              <option value="Business Loan">Business Loan</option>
              <option value="Home Loan">Home Loan</option>
              <option value="Vehicle Loan">Vehicle Loan</option>
              <option value="Gold Loan">Gold Loan</option>
              <option value="Education Loan">Education Loan</option>
            </select>

            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px", color: "#FFFFFF", fontSize: "13px" }}
            >
              <option value="All">All Statuses</option>
              <option value="Applied">Applied</option>
              <option value="Under Review">Under Review</option>
              <option value="Documents Required">Documents Required</option>
              <option value="Approved">Approved</option>
              <option value="Disbursed">Disbursed</option>
              <option value="Rejected">Rejected</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              value={lender}
              onChange={(e) => { setLender(e.target.value); setPage(1); }}
              style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px", color: "#FFFFFF", fontSize: "13px" }}
            >
              <option value="All">All Lenders</option>
              <option value="HDFC">HDFC Bank</option>
              <option value="ICICI">ICICI Bank</option>
              <option value="State Bank">SBI</option>
              <option value="Bajaj">Bajaj Finserv</option>
              <option value="Tata">Tata Capital</option>
              <option value="Muthoot">Muthoot Finance</option>
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

      {/* Applications Table */}
      <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#071426", borderBottom: "1px solid var(--border-color)", color: "var(--secondary-text)" }}>
                <th style={{ padding: "12px 16px" }}>App Ref</th>
                <th style={{ padding: "12px 16px" }}>Applicant Details</th>
                <th style={{ padding: "12px 16px" }}>Loan Type</th>
                <th style={{ padding: "12px 16px" }}>Requested Amt</th>
                <th style={{ padding: "12px 16px" }}>Tenure</th>
                <th style={{ padding: "12px 16px" }}>Lender Bank/NBFC</th>
                <th style={{ padding: "12px 16px" }}>Application Date</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "var(--secondary-text)" }}>
                    <RefreshCw size={20} className="spin" style={{ margin: "0 auto 10px" }} />
                    Loading applications...
                  </td>
                </tr>
              ) : paginatedApps.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "var(--secondary-text)" }}>
                    No loan applications match the filters.
                  </td>
                </tr>
              ) : (
                paginatedApps.map((a) => (
                  <tr key={a.id} style={{ borderBottom: "1px solid rgba(23, 56, 93, 0.5)" }}>
                    <td style={{ padding: "14px 16px", color: "var(--cyan-highlight)", fontWeight: "700" }}>
                      {a.application_reference}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: "700", color: "#FFFFFF" }}>{a.applicant_name}</div>
                      <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>ID: {a.user_id} • {a.applicant_phone || a.applicant_email}</div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#FFFFFF" }}>
                      <span style={{ fontSize: "11.5px", background: "rgba(8, 123, 255, 0.12)", padding: "3px 8px", borderRadius: "4px", color: "#00D5FF" }}>
                        {a.loan_type}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: "700", color: "#FFFFFF" }}>
                      ₹{Number(a.requested_amount).toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--secondary-text)" }}>
                      {a.tenure_months} Months
                    </td>
                    <td style={{ padding: "14px 16px", color: "#FFFFFF" }}>
                      {a.lender_name}
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--secondary-text)" }}>
                      {a.created_at?.slice(0, 10)}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "3px 8px",
                          borderRadius: "999px",
                          background: a.application_status === "Disbursed" || a.application_status === "Closed" ? "rgba(0, 229, 153, 0.15)" : a.application_status === "Approved" ? "rgba(8, 123, 255, 0.15)" : a.application_status === "Rejected" ? "rgba(255, 77, 77, 0.15)" : "rgba(245, 158, 11, 0.15)",
                          color: a.application_status === "Disbursed" || a.application_status === "Closed" ? "#00E599" : a.application_status === "Approved" ? "#00D5FF" : a.application_status === "Rejected" ? "#FF4D4D" : "#F59E0B"
                        }}
                      >
                        {a.application_status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(a)}
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
                        <Eye size={13} /> View Details
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
            Showing page {page} of {totalPages} ({applications.length} total applications)
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

      {/* Loan Details Modal */}
      {selectedApp && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(5, 13, 27, 0.8)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "16px", maxWidth: "700px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "24px", boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--cyan-highlight)", fontWeight: "700" }}>{selectedApp.application_reference}</span>
                <h2 style={{ fontSize: "20px", color: "#FFFFFF", marginTop: "2px" }}>{selectedApp.applicant_name}</h2>
                <div style={{ fontSize: "12px", color: "var(--secondary-text)" }}>{selectedApp.loan_type} • Lender: {selectedApp.lender_name}</div>
              </div>
              <button type="button" onClick={() => setSelectedApp(null)} style={{ background: "transparent", border: "none", color: "#A9BDD7", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {/* Application Info Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", background: "#071426", padding: "16px", borderRadius: "10px", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Requested Amount</div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#FFFFFF" }}>₹{Number(selectedApp.requested_amount).toLocaleString("en-IN")}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Approved Amount</div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#00E599" }}>
                  {selectedApp.approved_amount ? `₹${Number(selectedApp.approved_amount).toLocaleString("en-IN")}` : "Under Review"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Interest Rate</div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#00D5FF" }}>
                  {selectedApp.interest_rate ? `${selectedApp.interest_rate}% p.a.` : "TBD"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Tenure</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#FFFFFF" }}>{selectedApp.tenure_months} Months</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>EMI Amount</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#00D5FF" }}>
                  {selectedApp.emi_amount ? `₹${Number(selectedApp.emi_amount).toFixed(2)}/mo` : "Calculated on sanction"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>e-KYC Documents</div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#00E599" }}>{selectedApp.document_status || "Verified"}</div>
              </div>
            </div>

            {/* Application Timeline */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ fontSize: "13px", color: "var(--secondary-text)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Processing Timeline</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "#071426", padding: "14px", borderRadius: "10px" }}>
                {(detailsData?.timeline || [
                  { title: "Application Submitted", date: selectedApp.created_at, status: "completed" },
                  { title: "e-KYC & Document Verification", date: selectedApp.created_at, status: "completed" },
                  { title: "Underwriting & Credit Approval", date: "In Progress", status: "completed" }
                ]).map((t, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: t.status === "completed" ? "#00E599" : "#F59E0B" }} />
                    <span style={{ fontSize: "12.5px", color: "#FFFFFF", fontWeight: "600", flex: 1 }}>{t.title}</span>
                    <span style={{ fontSize: "11px", color: "var(--secondary-text)" }}>{t.date?.slice(0, 16)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "10px" }}>
              {selectedApp.application_status === "Applied" || selectedApp.application_status === "Under Review" ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedApp.id, "Approved")}
                    disabled={updating}
                    style={{ flex: 1, background: "rgba(0, 229, 153, 0.15)", border: "1px solid rgba(0, 229, 153, 0.3)", color: "#00E599", padding: "10px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                  >
                    Sanction & Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedApp.id, "Rejected")}
                    disabled={updating}
                    style={{ flex: 1, background: "rgba(255, 77, 77, 0.15)", border: "1px solid rgba(255, 77, 77, 0.3)", color: "#FF6B6B", padding: "10px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                  >
                    Reject Application
                  </button>
                </>
              ) : selectedApp.application_status === "Approved" ? (
                <button
                  type="button"
                  onClick={() => handleStatusChange(selectedApp.id, "Disbursed")}
                  disabled={updating}
                  style={{ flex: 1, background: "rgba(0, 229, 153, 0.2)", border: "1px solid #00E599", color: "#00E599", padding: "10px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                >
                  Disburse to Customer Bank
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setSelectedApp(null)}
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
