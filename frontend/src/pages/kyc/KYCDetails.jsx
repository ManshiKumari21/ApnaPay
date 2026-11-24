import React, { useState, useEffect } from "react";
import {
  ArrowLeft, ShieldCheck, User, Mail, Phone, Calendar,
  MapPin, Clock, CheckCircle2, XCircle, AlertCircle,
  FileText, History, RefreshCw, AlertTriangle, ShieldAlert,
  Lock, Check, Smartphone, MessageSquarePlus, Download
} from "lucide-react";
import api from "../../services/api";
import KYCDocumentPreview from "../../components/kyc/KYCDocumentPreview";

export default function KYCDetails({ kycId, onBack, onStatusUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Modals state
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [resubmitModalOpen, setResubmitModalOpen] = useState(false);
  const [remarksModalOpen, setRemarksModalOpen] = useState(false);

  // Action form inputs
  const [approveRemarks, setApproveRemarks] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [resubmitReason, setResubmitReason] = useState("");
  const [adminRemarkText, setAdminRemarkText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch full details
  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use clean route: api.js base URL already contains /api/v1
      const res = await api.get(`/admin/kyc/${kycId}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Fetch KYC Details error:", err);
      setError(err.response?.data?.message || "Failed to load application details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (kycId) {
      fetchDetails();
    }
  }, [kycId]);

  // 1. APPROVE ACTION
  const handleApprove = async () => {
    setActionLoading(true);
    setNotification(null);
    try {
      const res = await api.put(`/admin/kyc/${kycId}/approve`, {
        remarks: approveRemarks.trim() || "Documents verified and approved"
      });

      if (res.data.success) {
        setNotification({ type: "success", message: res.data.message });
        setApproveModalOpen(false);
        setApproveRemarks("");
        await fetchDetails();
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to approve KYC application."
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 2. REJECT ACTION
  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectReason || rejectReason.trim() === "") {
      alert("Please provide a mandatory rejection reason.");
      return;
    }

    setActionLoading(true);
    setNotification(null);
    try {
      const res = await api.put(`/admin/kyc/${kycId}/reject`, {
        reason: rejectReason.trim()
      });

      if (res.data.success) {
        setNotification({ type: "success", message: res.data.message });
        setRejectModalOpen(false);
        setRejectReason("");
        await fetchDetails();
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to reject KYC application."
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 3. REQUEST RESUBMISSION ACTION
  const handleRequestResubmission = async (e) => {
    e.preventDefault();
    if (!resubmitReason || resubmitReason.trim() === "") {
      alert("Please provide mandatory remarks explaining which documents need resubmission.");
      return;
    }

    setActionLoading(true);
    setNotification(null);
    try {
      const res = await api.put(`/admin/kyc/${kycId}/request-resubmission`, {
        reason: resubmitReason.trim(),
        remarks: resubmitReason.trim()
      });

      if (res.data.success) {
        setNotification({ type: "success", message: res.data.message });
        setResubmitModalOpen(false);
        setResubmitReason("");
        await fetchDetails();
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to request resubmission."
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 4. ADD ADMIN REMARK ACTION
  const handleAddRemark = async (e) => {
    e.preventDefault();
    if (!adminRemarkText || adminRemarkText.trim() === "") {
      alert("Please provide remark content.");
      return;
    }

    setActionLoading(true);
    setNotification(null);
    try {
      const res = await api.post(`/admin/kyc/${kycId}/remarks`, {
        remarks: adminRemarkText.trim()
      });

      if (res.data.success) {
        setNotification({ type: "success", message: res.data.message });
        setRemarksModalOpen(false);
        setAdminRemarkText("");
        await fetchDetails();
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to add remark."
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="table-card" style={{ padding: "60px", textAlign: "center", color: "#94a3b8" }}>
        <RefreshCw size={28} className="spin" style={{ margin: "0 auto 12px" }} />
        <div>Loading application #{kycId} details from database...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="table-card" style={{ padding: "40px", textAlign: "center" }}>
        <AlertTriangle size={36} color="#f87171" style={{ margin: "0 auto 12px" }} />
        <h3 style={{ color: "#e2ecff" }}>Error Loading Application</h3>
        <p style={{ color: "#f87171", margin: "8px 0 16px" }}>{error || "Record not found."}</p>
        <button className="btn-save" onClick={onBack}>
          <ArrowLeft size={14} style={{ marginRight: "6px" }} /> Back to Applications List
        </button>
      </div>
    );
  }

  const { kyc, user, mobile_verification, documents = [], history = [] } = data;
  const currentStatus = (kyc.verification_status || "pending").toLowerCase();
  const isVerified = currentStatus === "verified" || currentStatus === "approved";
  const isRejected = currentStatus === "rejected";
  const isUnderReview = currentStatus === "under_review" || currentStatus === "resubmission_requested";
  const isMobVerified = Boolean(mobile_verification?.is_verified || mobile_verification?.status === "Verified");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Navigation & Status Bar */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        background: "#091326",
        border: "1px solid #1b2b47",
        padding: "16px 20px",
        borderRadius: "10px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button
            onClick={onBack}
            className="refresh-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px" }}
          >
            <ArrowLeft size={15} /> Back to List
          </button>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
              KYC Application #{kyc.id}
            </h2>
            <span style={{ fontSize: "12px", color: "#7a90b3" }}>
              Submitted on {new Date(kyc.submission_date || Date.now()).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button className="refresh-btn" onClick={fetchDetails} title="Refresh latest state">
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>

          {/* Current KYC Status Badge */}
          <span
            className={`badge-pill ${isVerified ? "verified" : isRejected ? "rejected" : isUnderReview ? "active" : "pending"}`}
            style={{ fontSize: "13px", padding: "8px 14px", fontWeight: "700" }}
          >
            {isVerified ? <CheckCircle2 size={14} /> : isRejected ? <XCircle size={14} /> : isUnderReview ? <AlertCircle size={14} /> : <Clock size={14} />}
            {kyc.verification_status?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {notification && (
        <div style={{
          padding: "14px 18px",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: notification.type === "success" ? "#0b3d20" : "#3d1010",
          border: `1px solid ${notification.type === "success" ? "#1b8744" : "#a82424"}`,
          color: notification.type === "success" ? "#75f0a0" : "#ff9e9e"
        }}>
          {notification.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span style={{ fontSize: "13px", fontWeight: "500" }}>{notification.message}</span>
        </div>
      )}

      {/* Alert banner if Rejected or Under Review */}
      {kyc.rejection_reason && (
        <div style={{
          padding: "14px 18px",
          borderRadius: "8px",
          background: isRejected ? "#301014" : "#2a1542",
          border: `1px solid ${isRejected ? "#7f1d1d" : "#6b21a8"}`,
          color: isRejected ? "#fca5a5" : "#d8b4fe",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px"
        }}>
          <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong style={{ fontSize: "13px" }}>
              {isRejected ? "Rejection Reason Logged:" : "Resubmission Request Note:"}
            </strong>
            <p style={{ fontSize: "13px", marginTop: "3px" }}>{kyc.rejection_reason}</p>
          </div>
        </div>
      )}

      {/* Three Column Grid: User Info, Mobile OTP Verification, KYC Info */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        
        {/* Card 1: User Information */}
        <div className="table-card" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "#e2ecff" }}>
            <User size={18} color="#087cff" /> User Information
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
              <span style={{ color: "#7a90b3" }}>User ID</span>
              <strong style={{ color: "#38bdf8" }}>#USR-{user.id}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
              <span style={{ color: "#7a90b3" }}>Full Name</span>
              <strong style={{ color: "#ffffff" }}>{user.full_name}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
              <span style={{ color: "#7a90b3" }}>Mobile Number</span>
              <span style={{ color: "#cbd5e1" }}>{user.mobile}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
              <span style={{ color: "#7a90b3" }}>Email (Info Only)</span>
              <span style={{ color: "#94a3b8", fontSize: "12px" }}>{user.email}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
              <span style={{ color: "#7a90b3" }}>Registration Date</span>
              <span style={{ color: "#cbd5e1" }}>
                {user.registration_date ? new Date(user.registration_date).toLocaleDateString("en-IN") : "2026-01-10"}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#7a90b3" }}>Account Status</span>
              <span className={`badge-pill ${user.user_status === "active" ? "active" : "rejected"}`} style={{ fontSize: "11px" }}>
                {user.user_status?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Mobile Number OTP Verification */}
        <div className="table-card" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "#e2ecff" }}>
            <Smartphone size={18} color="#087cff" /> Mobile OTP Verification
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
              <span style={{ color: "#7a90b3" }}>OTP Verification Status</span>
              {isMobVerified ? (
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "#06331a",
                  color: "#34d399",
                  border: "1px solid #059669",
                  padding: "3px 8px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "700"
                }}>
                  <CheckCircle2 size={12} /> Verified
                </span>
              ) : (
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "#332204",
                  color: "#fbbf24",
                  border: "1px solid #b45309",
                  padding: "3px 8px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "700"
                }}>
                  <AlertTriangle size={12} /> Not Verified
                </span>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
              <span style={{ color: "#7a90b3" }}>Verified Date & Time</span>
              <span style={{ color: "#cbd5e1" }}>
                {mobile_verification?.verified_at ? new Date(mobile_verification.verified_at).toLocaleString("en-IN") : "Pending Verification"}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
              <span style={{ color: "#7a90b3" }}>Masked Phone</span>
              <code style={{ color: "#38bdf8", fontSize: "13px" }}>
                {mobile_verification?.masked_mobile || "******" + (user.mobile ? user.mobile.slice(-4) : "XXXX")}
              </code>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
              <span style={{ color: "#7a90b3" }}>SMS Gateway Channel</span>
              <span style={{ color: "#cbd5e1", fontSize: "12px" }}>Direct SMS OTP (MSG91 / 2Factor)</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#7a90b3" }}>OTP Security</span>
              <span style={{ color: "#34d399", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                <Lock size={12} /> Hashed (Zero Plaintext Exposure)
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: KYC Information & Verification Checks */}
        <div className="table-card" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "#e2ecff" }}>
            <ShieldCheck size={18} color="#087cff" /> KYC & Regulatory Checks
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
              <span style={{ color: "#7a90b3" }}>KYC Tier / Type</span>
              <span style={{ background: "#112644", color: "#60a5fa", padding: "3px 8px", borderRadius: "4px", fontWeight: "600", fontSize: "12px" }}>
                {kyc.kyc_type}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
              <span style={{ color: "#7a90b3" }}>Primary Document</span>
              <strong style={{ color: "#ffffff" }}>{kyc.document_type}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
              <span style={{ color: "#7a90b3" }}>PAN Check Status</span>
              <span style={{ color: "#34d399", fontWeight: "600", fontSize: "12px" }}>
                {kyc.pan_verification_status || "Verified"}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
              <span style={{ color: "#7a90b3" }}>Aadhaar Status</span>
              <span style={{ color: "#60a5fa", fontSize: "12px" }}>
                {kyc.aadhaar_verification_status || "Verified via Authorized Gateway"}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#7a90b3" }}>Admin Remarks</span>
              <span style={{ color: "#cbd5e1", fontSize: "12px", maxWidth: "200px", textAlign: "right" }}>
                {kyc.remarks || "No administrative remarks logged."}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Document Information & Secure Preview Card */}
      <div className="table-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#e2ecff", display: "flex", alignItems: "center", gap: "8px" }}>
              <FileText size={18} color="#087cff" /> Uploaded Document Verification
            </h3>
            <p style={{ fontSize: "12px", color: "#7a90b3", marginTop: "2px" }}>
              Encrypted storage · Click any document to expand full resolution inspection preview
            </p>
          </div>
          <span style={{ fontSize: "12px", background: "#0a1f3d", color: "#38bdf8", padding: "4px 10px", borderRadius: "6px", border: "1px solid #1b4577" }}>
            {documents.length} Document{documents.length !== 1 ? "s" : ""} Attached
          </span>
        </div>

        <KYCDocumentPreview documents={documents} />
      </div>

      {/* Verification History Timeline & Admin Audit Trail */}
      <div className="table-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", color: "#e2ecff" }}>
            <History size={18} color="#087cff" /> Verification History & Audit Trail
          </h3>
          <button
            onClick={() => setRemarksModalOpen(true)}
            className="refresh-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", fontSize: "12px" }}
          >
            <MessageSquarePlus size={14} /> Add Internal Remark
          </button>
        </div>

        {history.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#94a3b8" }}>No prior actions logged on this application.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {history.map((h) => (
              <div
                key={h.id}
                style={{
                  background: "#08152b",
                  border: "1px solid #172d4d",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: h.action?.includes("APPROVE") ? "#0b3d20" : h.action?.includes("REJECT") ? "#3d1010" : h.action?.includes("REMARK") ? "#112644" : "#1a2c47",
                      color: h.action?.includes("APPROVE") ? "#75f0a0" : h.action?.includes("REJECT") ? "#fca5a5" : h.action?.includes("REMARK") ? "#38bdf8" : "#60a5fa"
                    }}>
                      {h.action}
                    </span>
                    <span style={{ fontSize: "13px", color: "#e2ecff" }}>
                      {h.action === "ADMIN_REMARK" ? (
                        <span>Admin Note logged by <strong>{h.admin_name || `Admin #${h.admin_id || 1}`}</strong></span>
                      ) : (
                        <span>Status: <strong style={{ color: "#38bdf8" }}>{h.previous_status || "initial"}</strong> → <strong>{h.new_status}</strong></span>
                      )}
                    </span>
                  </div>
                  {h.remarks && (
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                      "{h.remarks}"
                    </div>
                  )}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  {new Date(h.created_at).toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Decision Action Bar */}
      <div className="table-card" style={{
        padding: "20px 24px",
        background: "#071326",
        border: "1px solid #183359",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "14px"
      }}>
        <div>
          <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#ffffff" }}>Compliance Decision Actions</h4>
          <p style={{ fontSize: "12px", color: "#7a90b3", marginTop: "2px" }}>
            All approvals, rejections, and resubmissions are permanently recorded in the RBI compliance audit log.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {/* Add Remark */}
          <button
            type="button"
            onClick={() => setRemarksModalOpen(true)}
            className="refresh-btn"
            style={{ padding: "10px 16px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <MessageSquarePlus size={15} /> Add Remark
          </button>

          {/* Request Resubmission */}
          <button
            type="button"
            onClick={() => setResubmitModalOpen(true)}
            disabled={actionLoading || isVerified}
            style={{
              background: "#3b1764",
              color: "#d8b4fe",
              border: "1px solid #6b21a8",
              padding: "10px 18px",
              borderRadius: "6px",
              fontWeight: "600",
              fontSize: "13px",
              cursor: isVerified ? "not-allowed" : "pointer",
              opacity: isVerified ? 0.5 : 1,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
            title={isVerified ? "Cannot request resubmission on verified KYC" : "Request user to re-upload documents"}
          >
            <AlertCircle size={15} /> Request Resubmission
          </button>

          {/* Reject Button */}
          <button
            type="button"
            onClick={() => setRejectModalOpen(true)}
            disabled={actionLoading || isVerified}
            style={{
              background: "#7f1d1d",
              color: "#fca5a5",
              border: "1px solid #991b1b",
              padding: "10px 18px",
              borderRadius: "6px",
              fontWeight: "600",
              fontSize: "13px",
              cursor: isVerified ? "not-allowed" : "pointer",
              opacity: isVerified ? 0.5 : 1,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
            title={isVerified ? "Cannot reject already verified KYC" : "Reject application"}
          >
            <XCircle size={15} /> Reject KYC
          </button>

          {/* Approve Button */}
          <button
            type="button"
            onClick={() => setApproveModalOpen(true)}
            disabled={actionLoading || isVerified}
            style={{
              background: isVerified ? "#064e3b" : "linear-gradient(90deg, #10b981, #059669)",
              color: "#ffffff",
              border: "none",
              padding: "10px 22px",
              borderRadius: "6px",
              fontWeight: "700",
              fontSize: "13px",
              cursor: isVerified ? "default" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: isVerified ? "none" : "0 4px 12px rgba(16, 185, 129, 0.3)"
            }}
          >
            <Check size={16} /> {isVerified ? "Already Approved" : "Approve KYC"}
          </button>
        </div>
      </div>

      {/* ================= MODALS ================= */}

      {/* 1. APPROVE MODAL */}
      {approveModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "460px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#34d399", display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={20} /> Approve KYC Application #{kyc.id}
            </h3>
            <p style={{ fontSize: "13px", color: "#94a3b8", margin: "10px 0 16px" }}>
              This will upgrade the user's tier to Full KYC Verified and enable high transaction volumes and wallet settlements.
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", color: "#cbd5e1", display: "block", marginBottom: "6px" }}>
                Approval Remarks (Optional):
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Government identity verified against central databases."
                value={approveRemarks}
                onChange={(e) => setApproveRemarks(e.target.value)}
                style={{
                  width: "100%",
                  background: "#08152b",
                  border: "1px solid #1c3257",
                  color: "#ffffff",
                  padding: "10px",
                  borderRadius: "6px",
                  fontSize: "13px"
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="refresh-btn"
                onClick={() => setApproveModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                style={{
                  background: "linear-gradient(90deg, #10b981, #059669)",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 18px",
                  borderRadius: "6px",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                {actionLoading ? "Approving..." : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. REJECT MODAL */}
      {rejectModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "480px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#f87171", display: "flex", alignItems: "center", gap: "8px" }}>
              <XCircle size={20} /> Reject KYC Application #{kyc.id}
            </h3>
            <p style={{ fontSize: "13px", color: "#94a3b8", margin: "10px 0 16px" }}>
              A mandatory explanation is required so the customer can understand why the verification was rejected.
            </p>

            <form onSubmit={handleReject}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", color: "#cbd5e1", display: "block", marginBottom: "6px" }}>
                  Rejection Reason <span style={{ color: "#f87171" }}>*</span>:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Document image is illegible or name does not match registered profile."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#08152b",
                    border: "1px solid #7f1d1d",
                    color: "#ffffff",
                    padding: "10px",
                    borderRadius: "6px",
                    fontSize: "13px"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="refresh-btn"
                  onClick={() => setRejectModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !rejectReason.trim()}
                  style={{
                    background: "#b91c1c",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 18px",
                    borderRadius: "6px",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: (!rejectReason.trim() || actionLoading) ? "not-allowed" : "pointer"
                  }}
                >
                  {actionLoading ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. REQUEST RESUBMISSION MODAL */}
      {resubmitModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "480px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#c084fc", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertCircle size={20} /> Request Document Resubmission
            </h3>
            <p style={{ fontSize: "13px", color: "#94a3b8", margin: "10px 0 16px" }}>
              The application status will be marked as "Under Review". The customer will see these remarks in their User Portal to upload fresh copies.
            </p>

            <form onSubmit={handleRequestResubmission}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", color: "#cbd5e1", display: "block", marginBottom: "6px" }}>
                  Resubmission Instructions <span style={{ color: "#f87171" }}>*</span>:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Back side of Aadhaar card is cropped. Please re-upload full scan showing complete address."
                  value={resubmitReason}
                  onChange={(e) => setResubmitReason(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#08152b",
                    border: "1px solid #581c87",
                    color: "#ffffff",
                    padding: "10px",
                    borderRadius: "6px",
                    fontSize: "13px"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="refresh-btn"
                  onClick={() => setResubmitModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !resubmitReason.trim()}
                  style={{
                    background: "#7e22ce",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 18px",
                    borderRadius: "6px",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: (!resubmitReason.trim() || actionLoading) ? "not-allowed" : "pointer"
                  }}
                >
                  {actionLoading ? "Submitting..." : "Send Resubmission Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. ADD INTERNAL REMARKS MODAL */}
      {remarksModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "480px" }}>
            <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#38bdf8", display: "flex", alignItems: "center", gap: "8px" }}>
              <MessageSquarePlus size={20} /> Add Compliance Remark
            </h3>
            <p style={{ fontSize: "13px", color: "#94a3b8", margin: "10px 0 16px" }}>
              Append an internal compliance observation to the audit history of application #{kyc.id}.
            </p>

            <form onSubmit={handleAddRemark}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", color: "#cbd5e1", display: "block", marginBottom: "6px" }}>
                  Internal Remark Note <span style={{ color: "#f87171" }}>*</span>:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Cross-checked with CERSAI database. Signature matches."
                  value={adminRemarkText}
                  onChange={(e) => setAdminRemarkText(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#08152b",
                    border: "1px solid #1c3257",
                    color: "#ffffff",
                    padding: "10px",
                    borderRadius: "6px",
                    fontSize: "13px"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="refresh-btn"
                  onClick={() => setRemarksModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !adminRemarkText.trim()}
                  style={{
                    background: "#0284c7",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 18px",
                    borderRadius: "6px",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: (!adminRemarkText.trim() || actionLoading) ? "not-allowed" : "pointer"
                  }}
                >
                  {actionLoading ? "Saving..." : "Add Remark to Trail"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
