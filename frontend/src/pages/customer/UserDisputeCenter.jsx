import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Eye,
  MessageSquare,
  FileText,
  DollarSign,
  Upload,
  AlertCircle,
  ArrowRight,
  Download,
  ShieldCheck,
  Send,
  X,
  CreditCard,
  Wallet
} from "lucide-react";
import disputeService from "../../services/disputeService";

export default function UserDisputeCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialTab = searchParams.get("tab") || (searchParams.get("raise") ? "raise" : "disputes");
  const prefillTxnId = searchParams.get("txnId");

  const [activeTab, setActiveTab] = useState(initialTab); // disputes, raise, refunds
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [eligibleTxns, setEligibleTxns] = useState([]);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const recordsPerPage = 6;

  // Tracking & Modals
  const [trackingDispute, setTrackingDispute] = useState(null);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [additionalEvidence, setAdditionalEvidence] = useState("");
  const [showEvidenceUpload, setShowEvidenceUpload] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Raise Dispute Form State
  const [formData, setFormData] = useState({
    transaction_id: prefillTxnId || "",
    payment_id: "",
    transaction_type: "Payment",
    transaction_amount: "",
    claim_amount: "",
    category: "Amount Debited but Payment Failed",
    description: "",
    evidence_url: "",
    evidence_name: ""
  });
  const [submittingDispute, setSubmittingDispute] = useState(false);

  // Load Dashboard Stats & Eligible Transactions
  const fetchUserData = async () => {
    setLoading(true);
    try {
      const [statsRes, txnsRes] = await Promise.all([
        disputeService.getUserStats(),
        disputeService.getEligibleTransactions()
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (txnsRes.success) {
        setEligibleTxns(txnsRes.transactions || []);

        // If prefillTxnId provided, match and pre-fill form
        if (prefillTxnId) {
          const match = txnsRes.transactions.find(
            t => String(t.id) === String(prefillTxnId) || t.transaction_id === prefillTxnId
          );
          if (match) {
            setFormData(prev => ({
              ...prev,
              transaction_id: match.transaction_id,
              payment_id: match.id,
              transaction_type: match.type,
              transaction_amount: match.amount,
              claim_amount: match.amount,
              category: match.category || prev.category
            }));
          }
        }
      }
    } catch (err) {
      console.warn("User dispute data error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load User's Disputes List
  const fetchUserDisputes = async () => {
    try {
      const res = await disputeService.getUserDisputes({
        search,
        status: statusFilter,
        page,
        limit: recordsPerPage
      });
      if (res.success) setDisputes(res.disputes || []);
    } catch (err) {
      console.warn("User disputes error:", err);
    }
  };

  // Load User's Refunds List
  const fetchUserRefunds = async () => {
    try {
      const res = await disputeService.getUserRefunds();
      if (res.success) setRefunds(res.refunds || []);
    } catch (err) {
      console.warn("User refunds error:", err);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [prefillTxnId]);

  useEffect(() => {
    if (activeTab === "disputes") fetchUserDisputes();
    else if (activeTab === "refunds") fetchUserRefunds();
  }, [activeTab, search, statusFilter, page]);

  // Handle Transaction Selection in Raise Form
  const handleSelectTxn = (txnId) => {
    const selected = eligibleTxns.find(t => String(t.id) === String(txnId) || t.transaction_id === txnId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        transaction_id: selected.transaction_id,
        payment_id: selected.id,
        transaction_type: selected.type,
        transaction_amount: selected.amount,
        claim_amount: selected.amount,
        category: selected.category || prev.category
      }));
    }
  };

  // Submit New Dispute Form
  const handleSubmitDispute = async (e) => {
    e.preventDefault();
    setSubmittingDispute(true);
    setFeedback(null);

    // Amount validation
    if (Number(formData.claim_amount) > Number(formData.transaction_amount)) {
      setFeedback({ type: "error", text: "Dispute claim amount cannot exceed original transaction amount." });
      setSubmittingDispute(false);
      return;
    }

    try {
      const res = await disputeService.createDispute(formData);
      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        setFormData({
          transaction_id: "",
          payment_id: "",
          transaction_type: "Payment",
          transaction_amount: "",
          claim_amount: "",
          category: "Amount Debited but Payment Failed",
          description: "",
          evidence_url: "",
          evidence_name: ""
        });
        setActiveTab("disputes");
        setSearchParams({ tab: "disputes" });
        fetchUserData();
        fetchUserDisputes();
      }
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.message || err.message });
    } finally {
      setSubmittingDispute(false);
    }
  };

  // Open Tracking Modal
  const handleOpenTracking = async (disp) => {
    try {
      const res = await disputeService.getUserDisputeDetails(disp.id);
      if (res.success) setTrackingDispute(res.dispute);
      else setTrackingDispute(disp);
    } catch (_) {
      setTrackingDispute(disp);
    }
  };

  // Send Reply to Admin in Tracking Thread
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!trackingDispute || !replyMessage.trim()) return;
    setSubmittingReply(true);

    try {
      const res = await disputeService.sendUserReply(trackingDispute.id, replyMessage);
      if (res.success) {
        setTrackingDispute(prev => ({
          ...prev,
          status: res.status || prev.status,
          messages: [...(prev.messages || []), res.messageData]
        }));
        setReplyMessage("");
        setFeedback({ type: "success", text: "Reply delivered to ApnaPay support agent." });
        fetchUserDisputes();
      }
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.message || err.message });
    } finally {
      setSubmittingReply(false);
    }
  };

  // Upload Additional Evidence
  const handleUploadAdditionalEvidence = async (e) => {
    e.preventDefault();
    if (!trackingDispute || !additionalEvidence) return;
    setSubmittingReply(true);

    try {
      const res = await disputeService.uploadUserEvidence(trackingDispute.id, {
        evidence_url: additionalEvidence,
        evidence_name: "Customer_Supplementary_Proof.png",
        comment: "Uploaded additional supporting evidence document."
      });

      if (res.success) {
        setTrackingDispute(res.dispute);
        setShowEvidenceUpload(false);
        setAdditionalEvidence("");
        setFeedback({ type: "success", text: res.message });
        fetchUserDisputes();
      }
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.message || err.message });
    } finally {
      setSubmittingReply(false);
    }
  };

  const getStatusBadgeClass = (st) => {
    switch (st?.toLowerCase()) {
      case "resolved":
      case "successful":
        return "badge-pill verified";
      case "submitted":
      case "open":
      case "pending":
      case "requested":
        return "badge-pill pending";
      case "under review":
      case "processing":
      case "pending information":
        return "badge-pill info";
      case "rejected":
      case "failed":
        return "badge-pill rejected";
      default:
        return "badge-pill";
    }
  };

  return (
    <div className="dispute-center-portal" style={{ paddingBottom: "36px" }}>
      {/* 1. Header Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          background: "linear-gradient(135deg, rgba(8, 123, 255, 0.12) 0%, rgba(0, 213, 255, 0.06) 100%)",
          border: "1px solid rgba(0, 213, 255, 0.22)",
          borderRadius: "14px",
          padding: "18px 22px",
          marginBottom: "20px"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#00D5FF", background: "rgba(0, 213, 255, 0.15)", padding: "2px 8px", borderRadius: "4px" }}>
              CUSTOMER GRIEVANCE & CHARGEBACK
            </span>
            <span style={{ fontSize: "12px", color: "var(--secondary-text)" }}>
              24-Hour Automated Grievance SLA Reversal
            </span>
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#FFFFFF", margin: 0, letterSpacing: "-0.4px" }}>
            ApnaPay Dispute & Refund Center
          </h2>
        </div>

        <button
          type="button"
          onClick={() => { setActiveTab("raise"); setSearchParams({ tab: "raise" }); }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "linear-gradient(135deg, #087BFF 0%, #00D5FF 100%)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "10px",
            padding: "9px 18px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0, 168, 255, 0.35)"
          }}
        >
          <Plus size={16} /> Raise New Dispute
        </button>
      </div>

      {feedback && (
        <div style={{
          padding: "12px 18px",
          borderRadius: "10px",
          marginBottom: "20px",
          background: feedback.type === "success" ? "rgba(0, 229, 153, 0.14)" : "rgba(255, 77, 77, 0.14)",
          border: `1px solid ${feedback.type === "success" ? "rgba(0, 229, 153, 0.35)" : "rgba(255, 77, 77, 0.35)"}`,
          color: feedback.type === "success" ? "#00E599" : "#FF6B6B",
          fontSize: "13px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* 2. User KPI Summary Cards (6 Cards) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "22px" }}>
        <div className="stat-card" style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#A9BDD7", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
            <span>My Disputes</span>
            <ShieldAlert size={16} color="#00D5FF" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", marginTop: "8px" }}>
            {stats ? stats.totalDisputes : "..."}
          </div>
          <small style={{ color: "#A9BDD7", fontSize: "11px" }}>Total tickets logged</small>
        </div>

        <div className="stat-card" style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#A9BDD7", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
            <span>Pending Resolution</span>
            <Clock size={16} color="#F59E0B" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#F59E0B", marginTop: "8px" }}>
            {stats ? stats.pendingDisputes : "..."}
          </div>
          <small style={{ color: "#F59E0B", fontSize: "11px" }}>Investigating with bank</small>
        </div>

        <div className="stat-card" style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#A9BDD7", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
            <span>Resolved Claims</span>
            <CheckCircle2 size={16} color="#00E599" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#00E599", marginTop: "8px" }}>
            {stats ? stats.resolvedDisputes : "..."}
          </div>
          <small style={{ color: "#00E599", fontSize: "11px" }}>Claim approved & refunded</small>
        </div>

        <div className="stat-card" style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#A9BDD7", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
            <span>Rejected</span>
            <XCircle size={16} color="#FF6B6B" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#FF6B6B", marginTop: "8px" }}>
            {stats ? stats.rejectedDisputes : "0"}
          </div>
          <small style={{ color: "#A9BDD7", fontSize: "11px" }}>Non-eligible claims</small>
        </div>

        <div className="stat-card" style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#A9BDD7", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
            <span>Refunded to You</span>
            <DollarSign size={16} color="#00E599" />
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#00E599", marginTop: "8px" }}>
            ₹{stats ? Number(stats.totalRefundAmount).toLocaleString("en-IN") : "0"}
          </div>
          <small style={{ color: "#00E599", fontSize: "11px" }}>Credited to wallet/bank</small>
        </div>

        <div className="stat-card" style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#A9BDD7", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
            <span>Awaiting Payout</span>
            <Clock size={16} color="#00D5FF" />
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#00D5FF", marginTop: "8px" }}>
            ₹{stats ? Number(stats.pendingRefundAmount).toLocaleString("en-IN") : "0"}
          </div>
          <small style={{ color: "#A9BDD7", fontSize: "11px" }}>In banking reversal cycle</small>
        </div>
      </div>

      {/* 3. Navigation Tabs Bar */}
      <div style={{ display: "flex", gap: "8px", background: "#081629", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "6px", marginBottom: "22px" }}>
        {[
          { id: "disputes", label: "My Disputes", icon: ShieldAlert, badge: disputes.length || null },
          { id: "raise", label: "Raise a Dispute", icon: Plus },
          { id: "refunds", label: "My Refunds & Receipts", icon: DollarSign, badge: refunds.length || null }
        ].map(t => {
          const Icon = t.icon;
          const isSelected = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => { setActiveTab(t.id); setSearchParams({ tab: t.id }); }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 18px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: isSelected ? "700" : "500",
                color: isSelected ? "#FFFFFF" : "#8BA2C1",
                background: isSelected ? "linear-gradient(135deg, #087BFF 0%, #0095FF 100%)" : "transparent",
                border: isSelected ? "1px solid rgba(0, 213, 255, 0.4)" : "1px solid transparent",
                cursor: "pointer"
              }}
            >
              <Icon size={16} color={isSelected ? "#FFFFFF" : "#5E7B9D"} />
              <span>{t.label}</span>
              {t.badge && (
                <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "10px", background: isSelected ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 168, 255, 0.14)", color: isSelected ? "#FFFFFF" : "#00D5FF" }}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: MY DISPUTES TABLE */}
      {/* ======================================================== */}
      {activeTab === "disputes" && (
        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", overflow: "hidden" }}>
          {/* Search & Filter */}
          <div style={{ padding: "16px 20px", background: "#081629", borderBottom: "1px solid var(--border-color)", display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ position: "relative", minWidth: "280px", flex: 1 }}>
              <Search size={15} style={{ position: "absolute", left: "12px", top: "10px", color: "#5E7B9D" }} />
              <input
                type="text"
                placeholder="Search by Dispute ID, Category, Txn..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", background: "#071426", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px 8px 36px", color: "#FFFFFF", fontSize: "13px", outline: "none" }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px", color: "#FFFFFF", fontSize: "12.5px" }}
            >
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Pending Information">Pending Info</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#071426", borderBottom: "1px solid var(--border-color)", color: "var(--secondary-text)" }}>
                  <th style={{ padding: "12px 16px" }}>Dispute ID</th>
                  <th style={{ padding: "12px 16px" }}>Transaction ID / Type</th>
                  <th style={{ padding: "12px 16px" }}>Claim Amount</th>
                  <th style={{ padding: "12px 16px" }}>Complaint Category</th>
                  <th style={{ padding: "12px 16px" }}>Submission Date</th>
                  <th style={{ padding: "12px 16px" }}>Current Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {disputes.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#A9BDD7" }}>
                      You have not raised any disputes yet. If you have an issue with a transaction, click "Raise New Dispute".
                    </td>
                  </tr>
                ) : (
                  disputes.map((d) => (
                    <tr key={d.id} style={{ borderBottom: "1px solid rgba(23, 56, 93, 0.4)" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <strong style={{ color: "#00D5FF" }}>{d.dispute_code || `#DSP-${d.id}`}</strong>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <code style={{ fontSize: "12px", color: "#A9BDD7" }}>{d.transaction_id}</code>
                        <div style={{ fontSize: "11px", color: "var(--cyan-highlight)" }}>{d.transaction_type}</div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <strong style={{ color: "#FF6B6B", fontSize: "14px" }}>
                          ₹{Number(d.claim_amount || d.amount).toFixed(2)}
                        </strong>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#FFFFFF" }}>
                          {d.category || d.dispute_reason}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px", color: "#A9BDD7" }}>
                        {new Date(d.created_at).toLocaleDateString("en-IN")}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span className={getStatusBadgeClass(d.status)}>
                          {d.status}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleOpenTracking(d)}
                          style={{
                            background: "rgba(8, 123, 255, 0.15)",
                            border: "1px solid var(--border-color)",
                            color: "#00D5FF",
                            padding: "6px 14px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          <Eye size={13} /> Track Status
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: RAISE A DISPUTE FORM */}
      {/* ======================================================== */}
      {activeTab === "raise" && (
        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "24px", maxWidth: "760px", margin: "0 auto" }}>
          <div style={{ borderBottom: "1px solid rgba(23, 56, 93, 0.6)", paddingBottom: "16px", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#FFFFFF", margin: 0 }}>
              Raise a Transaction Grievance
            </h3>
            <p style={{ fontSize: "12.5px", color: "var(--secondary-text)", marginTop: "4px" }}>
              Select an eligible transaction from your payment history and describe your claim.
            </p>
          </div>

          <form onSubmit={handleSubmitDispute} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Step 1: Select Transaction */}
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#A9BDD7", marginBottom: "6px" }}>
                1. Select Transaction to Dispute *
              </label>
              <select
                value={formData.transaction_id}
                onChange={(e) => handleSelectTxn(e.target.value)}
                required
                style={{
                  width: "100%",
                  background: "#071426",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  outline: "none"
                }}
              >
                <option value="">-- Choose from your recent transactions --</option>
                {eligibleTxns.map((t) => (
                  <option
                    key={t.id}
                    value={t.transaction_id}
                    disabled={t.is_already_disputed}
                  >
                    {t.transaction_id} • {t.description} (₹{t.amount}) • {new Date(t.date).toLocaleDateString("en-IN")}
                    {t.is_already_disputed ? " [ALREADY DISPUTED]" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Auto-filled Summary Row */}
            {formData.transaction_id && (
              <div style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "14px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", fontSize: "12px" }}>
                <div>
                  <span style={{ color: "#8BA2C1" }}>Txn ID:</span>
                  <div style={{ color: "#FFFFFF", fontWeight: "700" }}>{formData.transaction_id}</div>
                </div>
                <div>
                  <span style={{ color: "#8BA2C1" }}>Transaction Type:</span>
                  <div style={{ color: "var(--cyan-highlight)", fontWeight: "700" }}>{formData.transaction_type}</div>
                </div>
                <div>
                  <span style={{ color: "#8BA2C1" }}>Total Paid Amount:</span>
                  <div style={{ color: "#00E599", fontWeight: "700", fontSize: "14px" }}>₹{Number(formData.transaction_amount).toFixed(2)}</div>
                </div>
              </div>
            )}

            {/* Step 2: Dispute Claim Amount & Category */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#A9BDD7", marginBottom: "6px" }}>
                  Disputed Claim Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={formData.transaction_amount || undefined}
                  value={formData.claim_amount}
                  onChange={(e) => setFormData({ ...formData, claim_amount: e.target.value })}
                  required
                  placeholder="e.g. 1250"
                  style={{
                    width: "100%",
                    background: "#071426",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    fontWeight: "700",
                    outline: "none"
                  }}
                />
                <small style={{ color: "#64748B", fontSize: "11px", display: "block", marginTop: "3px" }}>
                  Cannot exceed transaction total of ₹{formData.transaction_amount || "0"}
                </small>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#A9BDD7", marginBottom: "6px" }}>
                  Complaint Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: "100%",
                    background: "#071426",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    outline: "none"
                  }}
                >
                  <option value="UPI Payment Failed">UPI Payment Failed</option>
                  <option value="Amount Debited but Payment Failed">Amount Debited but Payment Failed</option>
                  <option value="QR Payment Issue">QR Payment Issue</option>
                  <option value="Mobile Recharge Failed">Mobile Recharge Failed</option>
                  <option value="Bill Payment Issue">Bill Payment Issue</option>
                  <option value="Money Transfer Issue">Money Transfer Issue</option>
                  <option value="Duplicate Payment">Duplicate Payment</option>
                  <option value="Wallet Balance Issue">Wallet Balance Issue</option>
                  <option value="Refund Not Received">Refund Not Received</option>
                  <option value="Other">Other Grievance</option>
                </select>
              </div>
            </div>

            {/* Step 3: Detailed Description */}
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#A9BDD7", marginBottom: "6px" }}>
                Grievance Description & What Happened *
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="Explain the issue in detail (e.g. Bank SMS received, but bill status shows overdue)..."
                style={{
                  width: "100%",
                  background: "#071426",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  outline: "none",
                  fontFamily: "inherit"
                }}
              />
            </div>

            {/* Step 4: Upload Evidence Screenshot */}
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#A9BDD7", marginBottom: "6px" }}>
                Upload Screenshot / Supporting Proof (PNG, JPG, PDF up to 5MB)
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="Paste image URL or screenshot link (or leave blank for auto-proof)"
                  value={formData.evidence_url}
                  onChange={(e) => setFormData({ ...formData, evidence_url: e.target.value, evidence_name: "Customer_Proof.png" })}
                  style={{
                    flex: 1,
                    background: "#071426",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    evidence_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600",
                    evidence_name: "Bank_Debit_SMS_Proof.png"
                  })}
                  style={{
                    background: "#08172C",
                    border: "1px solid var(--border-color)",
                    color: "#00D5FF",
                    padding: "0 14px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  Attach Bank SMS
                </button>
              </div>
            </div>

            {/* Submit Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => { setActiveTab("disputes"); setSearchParams({ tab: "disputes" }); }}
                style={{ padding: "10px 20px", background: "#08172C", border: "1px solid var(--border-color)", color: "#A9BDD7", borderRadius: "8px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingDispute || !formData.transaction_id}
                style={{
                  padding: "10px 24px",
                  background: "linear-gradient(135deg, #087BFF 0%, #00D5FF 100%)",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: "13.5px",
                  fontWeight: "700",
                  borderRadius: "8px",
                  cursor: submittingDispute || !formData.transaction_id ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(0, 168, 255, 0.35)"
                }}
              >
                {submittingDispute ? "Submitting Dispute..." : "Submit Grievance Claim"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MY REFUNDS TABLE & RECEIPTS */}
      {/* ======================================================== */}
      {activeTab === "refunds" && (
        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", background: "#081629", borderBottom: "1px solid var(--border-color)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>
              My Refund Disbursements & Reversals
            </h3>
            <p style={{ fontSize: "12px", color: "var(--secondary-text)", marginTop: "2px" }}>
              Real-time bank gateway UTR and wallet settlement acknowledgments
            </p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#071426", borderBottom: "1px solid var(--border-color)", color: "var(--secondary-text)" }}>
                  <th style={{ padding: "12px 16px" }}>Refund Code</th>
                  <th style={{ padding: "12px 16px" }}>Original Transaction</th>
                  <th style={{ padding: "12px 16px" }}>Refund Amount</th>
                  <th style={{ padding: "12px 16px" }}>Payout Destination</th>
                  <th style={{ padding: "12px 16px" }}>Bank UTR / ARN</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "center" }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {refunds.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#A9BDD7" }}>
                      No refund records found for your account.
                    </td>
                  </tr>
                ) : (
                  refunds.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid rgba(23, 56, 93, 0.4)" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <strong style={{ color: "#00E599" }}>{r.refund_code || `#RF-${r.id}`}</strong>
                        <div style={{ fontSize: "11px", color: "#8BA2C1", marginTop: "2px" }}>
                          {new Date(r.created_at).toLocaleDateString("en-IN")}
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <code style={{ fontSize: "12px", color: "#A9BDD7" }}>{r.transaction_id || `#TXN-${r.payment_id}`}</code>
                        <div style={{ fontSize: "11px", color: "#64748B" }}>{r.reason}</div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <strong style={{ color: "#00E599", fontSize: "14px" }}>
                          ₹{Number(r.amount).toFixed(2)}
                        </strong>
                      </td>

                      <td style={{ padding: "14px 16px", color: "#FFFFFF" }}>
                        {r.refund_method}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        {r.utr_number ? (
                          <code style={{ fontSize: "11px", color: "#00E599" }}>{r.utr_number}</code>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#F59E0B" }}>Processing with Bank</span>
                        )}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span className={getStatusBadgeClass(r.status)}>
                          {r.status}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => setSelectedRefund(r)}
                          style={{
                            background: "rgba(0, 229, 153, 0.15)",
                            border: "1px solid rgba(0, 229, 153, 0.3)",
                            color: "#00E599",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer"
                          }}
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. TRACKING MODAL (User View) */}
      {/* ======================================================== */}
      {trackingDispute && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(3, 10, 20, 0.85)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", justifyContent: "flex-end" }}
          onClick={(e) => { if (e.target === e.currentTarget) setTrackingDispute(null); }}
        >
          <div style={{ width: "100%", maxWidth: "600px", background: "#0B1D35", borderLeft: "1px solid rgba(0, 213, 255, 0.3)", height: "100%", overflowY: "auto", padding: "24px", boxShadow: "-8px 0 32px rgba(0,0,0,0.6)" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginBottom: "18px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "#00D5FF", background: "rgba(0, 213, 255, 0.15)", padding: "2px 8px", borderRadius: "4px" }}>
                    {trackingDispute.dispute_code || `#DSP-${trackingDispute.id}`}
                  </span>
                  <span className={getStatusBadgeClass(trackingDispute.status)}>
                    {trackingDispute.status}
                  </span>
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#FFFFFF", marginTop: "6px", margin: 0 }}>
                  Grievance Resolution Tracking
                </h3>
              </div>
              <button onClick={() => setTrackingDispute(null)} style={{ background: "transparent", border: "none", color: "#A9BDD7", cursor: "pointer" }}>
                <X size={22} />
              </button>
            </div>

            {/* Resolution Notice Banner if completed */}
            {trackingDispute.resolution_notes && (
              <div style={{ background: "rgba(0, 229, 153, 0.12)", border: "1px solid rgba(0, 229, 153, 0.35)", borderRadius: "10px", padding: "14px", marginBottom: "18px" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#00E599", textTransform: "uppercase", marginBottom: "4px" }}>
                  Official Resolution Remarks
                </div>
                <div style={{ fontSize: "13px", color: "#FFFFFF", lineHeight: "1.4" }}>
                  {trackingDispute.resolution_notes}
                </div>
              </div>
            )}

            {/* Transaction Overview Card */}
            <div style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "14px", marginBottom: "18px", fontSize: "12.5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(23, 56, 93, 0.5)", paddingBottom: "6px", marginBottom: "6px" }}>
                <span style={{ color: "#A9BDD7" }}>Transaction ID:</span>
                <code style={{ color: "#FFFFFF" }}>{trackingDispute.transaction_id}</code>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(23, 56, 93, 0.5)", paddingBottom: "6px", marginBottom: "6px" }}>
                <span style={{ color: "#A9BDD7" }}>Claim Category:</span>
                <span style={{ color: "var(--cyan-highlight)" }}>{trackingDispute.category || trackingDispute.dispute_reason}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#A9BDD7" }}>Claim Amount:</span>
                <strong style={{ color: "#FF6B6B", fontSize: "14px" }}>₹{Number(trackingDispute.claim_amount || trackingDispute.amount).toFixed(2)}</strong>
              </div>
            </div>

            {/* User Description */}
            <div style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "14px", marginBottom: "18px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#A9BDD7", textTransform: "uppercase", marginBottom: "4px" }}>
                Your Reported Grievance
              </div>
              <p style={{ fontSize: "13px", color: "#E2ECFF", margin: 0, lineHeight: "1.4" }}>
                "{trackingDispute.description}"
              </p>
              {trackingDispute.evidence_url && (
                <div style={{ marginTop: "10px", fontSize: "12px" }}>
                  <a href={trackingDispute.evidence_url} target="_blank" rel="noreferrer" style={{ color: "#00D5FF", textDecoration: "none" }}>
                    📎 {trackingDispute.evidence_name || "View Attached Proof"} →
                  </a>
                </div>
              )}
            </div>

            {/* Action Buttons if Info Requested */}
            {trackingDispute.status === "Pending Information" && (
              <div style={{ background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "10px", padding: "14px", marginBottom: "18px" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#F59E0B", marginBottom: "6px" }}>
                  ⚠️ Additional Information Required
                </div>
                <p style={{ fontSize: "12.5px", color: "#FDE68A", margin: "0 0 10px 0" }}>
                  Our support team needs supplementary proof to verify this transaction with the payment gateway.
                </p>
                <button
                  type="button"
                  onClick={() => setShowEvidenceUpload(!showEvidenceUpload)}
                  style={{ background: "#F59E0B", border: "none", color: "#000", padding: "7px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                >
                  Upload Required Proof
                </button>
              </div>
            )}

            {/* Evidence Upload Form */}
            {showEvidenceUpload && (
              <form onSubmit={handleUploadAdditionalEvidence} style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "14px", marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#A9BDD7", marginBottom: "4px" }}>Attach Image URL / Document Link</label>
                <input
                  type="text"
                  required
                  placeholder="https://... (e.g. counter slip or SMS)"
                  value={additionalEvidence}
                  onChange={(e) => setAdditionalEvidence(e.target.value)}
                  style={{ width: "100%", background: "#0B1D35", border: "1px solid var(--border-color)", color: "#FFF", borderRadius: "6px", padding: "8px 10px", fontSize: "12.5px", marginBottom: "10px" }}
                />
                <button
                  type="submit"
                  disabled={submittingReply}
                  style={{ background: "#087BFF", border: "none", color: "#FFF", padding: "7px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                >
                  {submittingReply ? "Uploading..." : "Submit Proof"}
                </button>
              </form>
            )}

            {/* Communication Thread */}
            <div style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "16px", marginBottom: "18px" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#FFFFFF", marginBottom: "12px" }}>
                Support Communication Log
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
                {(!trackingDispute.messages || trackingDispute.messages.length === 0) ? (
                  <div style={{ fontSize: "12px", color: "#64748B", textAlign: "center", padding: "10px" }}>No messages exchanged yet.</div>
                ) : (
                  trackingDispute.messages.map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: m.sender_type === "admin" ? "rgba(8, 123, 255, 0.15)" : "#0B1D35",
                        border: `1px solid ${m.sender_type === "admin" ? "rgba(8, 123, 255, 0.3)" : "rgba(23, 56, 93, 0.6)"}`,
                        alignSelf: m.sender_type === "admin" ? "flex-start" : "flex-end",
                        maxWidth: "85%"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", fontSize: "11px", color: m.sender_type === "admin" ? "#00D5FF" : "#A9BDD7", marginBottom: "3px" }}>
                        <strong>{m.sender_name}</strong>
                        <span>{new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div style={{ fontSize: "12.5px", color: "#FFFFFF" }}>{m.message}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Form */}
              {!["Resolved", "Closed"].includes(trackingDispute.status) && (
                <form onSubmit={handleSendReply} style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="Type your message to support agent..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    style={{ flex: 1, background: "#0B1D35", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px", color: "#FFF", fontSize: "12.5px", outline: "none" }}
                  />
                  <button
                    type="submit"
                    disabled={submittingReply || !replyMessage.trim()}
                    style={{ background: "#087BFF", border: "none", color: "#FFF", padding: "8px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <Send size={13} /> Send
                  </button>
                </form>
              )}
            </div>

            {/* Timeline */}
            <div style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#FFFFFF", marginBottom: "12px" }}>Investigation Milestones</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(trackingDispute.timeline || []).map((tl, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "10px", fontSize: "12px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00E599", marginTop: "6px" }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ color: "#FFFFFF", fontWeight: "600" }}>{tl.action.replace(/_/g, " ")}</span>
                      <div style={{ color: "#A9BDD7", fontSize: "11.5px" }}>{tl.details}</div>
                      <div style={{ color: "#64748B", fontSize: "10.5px" }}>{new Date(tl.timestamp).toLocaleString("en-IN")}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. User Refund Receipt Modal */}
      {selectedRefund && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "grid", placeItems: "center", zIndex: 10000, padding: "16px" }}>
          <div style={{ width: "100%", maxWidth: "440px", background: "#0B1D35", border: "1px solid #00E599", borderRadius: "14px", padding: "24px" }}>
            <div style={{ textAlign: "center", paddingBottom: "16px", borderBottom: "1px solid rgba(23, 56, 93, 0.6)" }}>
              <CheckCircle2 size={44} color="#00E599" style={{ margin: "0 auto 8px" }} />
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#FFFFFF", margin: 0 }}>Refund Credit Receipt</h3>
              <div style={{ fontSize: "12px", color: "#A9BDD7", marginTop: "2px" }}>ApnaPay Escrow Reversal Receipt</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#A9BDD7" }}>Refund Reference:</span>
                <strong style={{ color: "#00E599" }}>{selectedRefund.refund_code}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#A9BDD7" }}>Original Transaction:</span>
                <span style={{ color: "#FFFFFF" }}>{selectedRefund.transaction_id}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#A9BDD7" }}>Refunded Amount:</span>
                <strong style={{ color: "#00E599", fontSize: "16px" }}>₹{Number(selectedRefund.amount).toFixed(2)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#A9BDD7" }}>Credited To:</span>
                <span style={{ color: "#FFFFFF" }}>{selectedRefund.refund_method}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#A9BDD7" }}>Bank UTR / ARN:</span>
                <code style={{ color: "#00D5FF" }}>{selectedRefund.utr_number || "Settled Instantly"}</code>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#A9BDD7" }}>Date:</span>
                <span style={{ color: "#FFFFFF" }}>{new Date(selectedRefund.completed_at || selectedRefund.created_at).toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button onClick={() => setSelectedRefund(null)} style={{ flex: 1, padding: "10px", background: "#08172C", border: "1px solid var(--border-color)", color: "#FFF", borderRadius: "8px", cursor: "pointer" }}>
                Close
              </button>
              <button onClick={() => window.print()} style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg, #087BFF, #00D5FF)", border: "none", color: "#FFF", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
