import React, { useEffect, useState } from "react";
import { ShieldCheck, CheckCircle2, XCircle, Clock, Search, Filter, RefreshCw, FileText, AlertCircle } from "lucide-react";
import api from "../services/api";

export default function KycManagement() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewItem, setReviewItem] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchKyc = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/kyc/queue");
      const list = res.data.records || [];
      setRecords(list);
      setFiltered(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKyc();
  }, []);

  useEffect(() => {
    let res = [...records];
    if (statusFilter !== "all") {
      res = res.filter(r => r.status.toLowerCase() === statusFilter.toLowerCase());
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      res = res.filter(r =>
        (r.full_name && r.full_name.toLowerCase().includes(q)) ||
        (r.doc_number && r.doc_number.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q))
      );
    }
    setFiltered(res);
  }, [statusFilter, searchTerm, records]);

  const handleReview = async (status) => {
    if (!reviewItem) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await api.put(`/admin/kyc/${reviewItem.id}/review`, { status, remarks });
      if (res.data.success) {
        setFeedback({ type: "success", text: `KYC for ${reviewItem.full_name} marked as ${status}!` });
        setReviewItem(null);
        setRemarks("");
        fetchKyc();
      }
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.message || "Failed to update KYC." });
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = records.filter(r => r.status === "pending").length;
  const verifiedCount = records.filter(r => r.status === "verified").length;
  const rejectedCount = records.filter(r => r.status === "rejected").length;

  return (
    <div className="dashboard-content">
      <div className="page-heading">
        <div>
          <h1>Module 5: KYC Management</h1>
          <p>Verify government identity documents (Aadhaar, PAN, Passport) and approve or reject submissions.</p>
        </div>
        <button className="refresh-btn" onClick={fetchKyc}>
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Queue
        </button>
      </div>

      {feedback && (
        <div style={{
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "18px",
          background: feedback.type === "success" ? "#0b3d20" : "#3d1010",
          border: `1px solid ${feedback.type === "success" ? "#1b8744" : "#a82424"}`,
          color: feedback.type === "success" ? "#75f0a0" : "#ff9e9e"
        }}>
          {feedback.text}
        </div>
      )}

      {/* KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card orange">
          <div className="stat-top">
            <span className="stat-title">Pending Approvals</span>
            <div className="stat-icon"><Clock size={20} /></div>
          </div>
          <h2>{pendingCount}</h2>
          <small>Awaiting compliance officer review</small>
        </div>

        <div className="stat-card green">
          <div className="stat-top">
            <span className="stat-title">Verified Users</span>
            <div className="stat-icon"><CheckCircle2 size={20} /></div>
          </div>
          <h2>{verifiedCount}</h2>
          <small>High transaction limits unlocked</small>
        </div>

        <div className="stat-card red">
          <div className="stat-top">
            <span className="stat-title">Rejected Documents</span>
            <div className="stat-icon"><XCircle size={20} /></div>
          </div>
          <h2>{rejectedCount}</h2>
          <small>Re-upload requested</small>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="table-card">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search user name, PAN, Aadhaar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {["all", "pending", "verified", "rejected"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st ? "#087cff" : "#0d1b33",
                  color: statusFilter === st ? "#fff" : "#94a3b8",
                  border: "1px solid #1a2f52",
                  padding: "8px 14px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  textTransform: "capitalize",
                  cursor: "pointer"
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Applicant</th>
                <th>Contact</th>
                <th>Doc Type</th>
                <th>Document No</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((k) => (
                <tr key={k.id}>
                  <td><strong>#{k.id}</strong></td>
                  <td>
                    <div>
                      <strong>{k.full_name || `User #${k.user_id}`}</strong>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>User ID: {k.user_id}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: "12px" }}>{k.email}</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>{k.phone}</div>
                  </td>
                  <td>
                    <span style={{ background: "#112644", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", color: "#60a5fa" }}>
                      {k.doc_type}
                    </span>
                  </td>
                  <td><code style={{ color: "#38bdf8" }}>{k.doc_number}</code></td>
                  <td>
                    <span className={`badge-pill ${k.status === "verified" ? "verified" : k.status === "pending" ? "pending" : "rejected"}`}>
                      {k.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => { setReviewItem(k); setRemarks(k.remarks || ""); }}
                      style={{
                        background: "#1e3a8a",
                        color: "#bfdbfe",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {reviewItem && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "grid", placeItems: "center", zIndex: 999
        }}>
          <div className="table-card" style={{ width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto", padding: "24px", background: "#0b1528", border: "1px solid #1f3557", margin: "16px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={20} color="#087cff" /> Verify Identity Document
            </h3>

            <div style={{ background: "#050e1c", padding: "16px", borderRadius: "8px", border: "1px solid #142847", marginBottom: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
                <div><span style={{ color: "#7a90b3" }}>Applicant:</span> <strong>{reviewItem.full_name}</strong></div>
                <div><span style={{ color: "#7a90b3" }}>User ID:</span> <strong>#{reviewItem.user_id}</strong></div>
                <div><span style={{ color: "#7a90b3" }}>Document:</span> <strong>{reviewItem.doc_type}</strong></div>
                <div><span style={{ color: "#7a90b3" }}>Number:</span> <code style={{ color: "#38bdf8" }}>{reviewItem.doc_number}</code></div>
              </div>

              <div style={{ marginTop: "14px", padding: "12px", background: "#0a1b33", borderRadius: "6px", textAlign: "center" }}>
                <FileText size={32} color="#60a5fa" style={{ margin: "0 auto 6px" }} />
                <p style={{ fontSize: "12px", color: "#93c5fd" }}>Scanned ID Preview: Verified against NSDL/UIDAI Mock Gateway</p>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "18px" }}>
              <label>Auditor Remarks (Optional for approve, required for reject):</label>
              <textarea
                rows="3"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Document verified successfully / Name mismatch on Aadhaar"
                style={{
                  width: "100%",
                  background: "#08152b",
                  border: "1px solid #1c3257",
                  color: "#e2ecff",
                  padding: "10px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontFamily: "inherit"
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button type="button" className="btn-cancel" onClick={() => setReviewItem(null)}>Close</button>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => handleReview("rejected")}
                  disabled={submitting}
                  style={{
                    background: "#7f1d1d",
                    color: "#fca5a5",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: "6px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  <XCircle size={15} style={{ verticalAlign: "middle", marginRight: "4px" }} /> Reject KYC
                </button>

                <button
                  type="button"
                  onClick={() => handleReview("verified")}
                  disabled={submitting}
                  className="btn-save"
                >
                  <CheckCircle2 size={15} style={{ verticalAlign: "middle", marginRight: "4px" }} /> Approve KYC
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
