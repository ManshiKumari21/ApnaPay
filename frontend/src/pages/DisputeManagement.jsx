import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  MessageSquare,
  Clock,
  ArrowRight,
  Download,
  AlertTriangle,
  Send,
  User,
  CreditCard,
  FileText,
  DollarSign,
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  X
} from "lucide-react";
import disputeService from "../services/disputeService";

export default function DisputeManagement({ defaultTab = "disputes" }) {
  const [activeTab, setActiveTab] = useState(defaultTab); // disputes, analytics, refunds, reports
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [totalDisputes, setTotalDisputes] = useState(0);
  const [totalRefunds, setTotalRefunds] = useState(0);

  // Filters for Disputes
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [agentFilter, setAgentFilter] = useState("All");
  const [page, setPage] = useState(1);
  const recordsPerPage = 8;

  // Filters for Refunds
  const [refundSearch, setRefundSearch] = useState("");
  const [refundStatusFilter, setRefundStatusFilter] = useState("All");
  const [refundMethodFilter, setRefundMethodFilter] = useState("All");
  const [refundPage, setRefundPage] = useState(1);

  // Modals & Action States
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'resolve', 'note', 'message', 'refund'
  const [actionNotes, setActionNotes] = useState("");
  const [actionStatus, setActionStatus] = useState("Resolved");
  const [assignedAgent, setAssignedAgent] = useState("");
  const [assignedPriority, setAssignedPriority] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Fetch Dashboard Stats & Analytics
  const fetchDashboardData = async () => {
    try {
      const res = await disputeService.getAdminStats();
      if (res.success) {
        setStats(res.stats);
        setAnalytics(res.analytics);
      }
    } catch (err) {
      console.warn("Dispute stats fetch error:", err);
    }
  };

  // Fetch Disputes Queue
  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await disputeService.getAdminDisputes({
        search,
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        assigned_agent: agentFilter,
        page,
        limit: recordsPerPage
      });
      if (res.success) {
        setDisputes(res.disputes || []);
        setTotalDisputes(res.total || 0);
      }
    } catch (err) {
      console.warn("Disputes list error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Refunds Queue
  const fetchRefunds = async () => {
    try {
      const res = await disputeService.getAdminRefunds({
        search: refundSearch,
        status: refundStatusFilter,
        method: refundMethodFilter,
        page: refundPage,
        limit: recordsPerPage
      });
      if (res.success) {
        setRefunds(res.refunds || []);
        setTotalRefunds(res.total || 0);
      }
    } catch (err) {
      console.warn("Refunds list error:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === "disputes") {
      fetchDisputes();
    } else if (activeTab === "refunds") {
      fetchRefunds();
    }
  }, [activeTab, page, statusFilter, categoryFilter, priorityFilter, agentFilter, refundPage, refundStatusFilter, refundMethodFilter]);

  // Open Full Investigation View
  const handleOpenInvestigate = async (disp) => {
    try {
      const res = await disputeService.getAdminDisputeDetails(disp.id);
      if (res.success) {
        setSelectedDispute(res.dispute);
        setAssignedAgent(res.dispute.assigned_agent || "Support Queue");
        setAssignedPriority(res.dispute.priority || "Medium");
      } else {
        setSelectedDispute(disp);
      }
    } catch (_) {
      setSelectedDispute(disp);
    }
  };

  // Status Change / Resolution Submission
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;
    setSubmittingAction(true);
    setFeedback(null);

    try {
      const res = await disputeService.updateDisputeStatus(
        selectedDispute.id,
        actionStatus,
        actionNotes
      );

      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        setSelectedDispute(res.dispute);
        setActiveModal(null);
        setActionNotes("");
        fetchDisputes();
        fetchDashboardData();
      }
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.message || err.message });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Agent / Priority Update
  const handleAssignSubmit = async () => {
    if (!selectedDispute) return;
    setSubmittingAction(true);
    try {
      const res = await disputeService.assignDispute(
        selectedDispute.id,
        assignedAgent,
        assignedPriority
      );
      if (res.success) {
        setSelectedDispute(res.dispute);
        setFeedback({ type: "success", text: "Dispute assignment and priority updated." });
        fetchDisputes();
      }
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.message || err.message });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Add Internal Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!selectedDispute || !actionNotes.trim()) return;
    setSubmittingAction(true);
    try {
      const res = await disputeService.addDisputeInternalNote(selectedDispute.id, actionNotes);
      if (res.success) {
        setSelectedDispute(prev => ({ ...prev, internal_notes: res.internal_notes }));
        setActiveModal(null);
        setActionNotes("");
        setFeedback({ type: "success", text: "Internal investigation note saved." });
      }
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.message || err.message });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Send Message / Request More Info
  const handleSendMessage = async (isRequestInfo = false) => {
    if (!selectedDispute || !actionNotes.trim()) return;
    setSubmittingAction(true);
    try {
      const res = await disputeService.sendAdminMessage(selectedDispute.id, actionNotes, isRequestInfo);
      if (res.success) {
        setSelectedDispute(prev => ({
          ...prev,
          status: res.status || prev.status,
          messages: [...(prev.messages || []), res.messageData]
        }));
        setActiveModal(null);
        setActionNotes("");
        setFeedback({ type: "success", text: res.message });
        fetchDisputes();
      }
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.message || err.message });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Refund Initiation
  const handleInitiateRefund = async (refundId) => {
    if (!window.confirm("Are you sure you want to initiate provider payout for this refund?")) return;
    setSubmittingAction(true);
    try {
      const res = await disputeService.initiateRefund(refundId);
      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        fetchRefunds();
        fetchDashboardData();
        if (selectedRefund && selectedRefund.id === refundId) {
          setSelectedRefund(res.refund);
        }
      }
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.message || err.message });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Retry Failed Refund
  const handleRetryRefund = async (refundId) => {
    setSubmittingAction(true);
    try {
      const res = await disputeService.retryRefund(refundId);
      if (res.success) {
        setFeedback({ type: "success", text: res.message });
        fetchRefunds();
        fetchDashboardData();
      }
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.message || err.message });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Export CSV
  const handleExportCSV = (type = "disputes") => {
    const list = type === "refunds" ? refunds : disputes;
    if (!list.length) return;

    let headers = [];
    let rows = [];

    if (type === "refunds") {
      headers = ["Refund Code", "User Name", "Payment ID", "Amount", "Method", "UTR", "Gateway Ref", "Status", "Created At"];
      rows = list.map(r => [
        r.refund_code,
        r.user_name,
        r.payment_id,
        r.amount,
        r.refund_method,
        r.utr_number || "Pending",
        r.gateway_refund_id || "N/A",
        r.status,
        r.created_at
      ]);
    } else {
      headers = ["Dispute Code", "Claimant", "Txn ID", "Category", "Claim Amount", "Priority", "Agent", "Status", "Submitted At"];
      rows = list.map(d => [
        d.dispute_code,
        d.user_name,
        d.transaction_id,
        d.category,
        d.claim_amount,
        d.priority,
        d.assigned_agent,
        d.status,
        d.created_at
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ApnaPay_${type.toUpperCase()}_REPORT_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadgeClass = (st) => {
    switch (st?.toLowerCase()) {
      case "resolved":
      case "successful":
      case "approved":
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
    <div className="dashboard-content" style={{ paddingBottom: "40px" }}>
      {/* 1. Header with Module Title & Sync */}
      <div className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", color: "var(--cyan-highlight)", background: "rgba(0, 213, 255, 0.12)", padding: "2px 8px", borderRadius: "4px" }}>
              SUPPORT & COMPLIANCE
            </span>
            <span style={{ fontSize: "12px", color: "var(--secondary-text)" }}>
              Chargebacks, Grievances, Payout Reversals & SLA Tracking
            </span>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "-0.5px" }}>
            Dispute & Refund Management Console
          </h1>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="refresh-btn"
            onClick={() => { fetchDashboardData(); if (activeTab === "disputes") fetchDisputes(); else fetchRefunds(); }}
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
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Data
          </button>

          <button
            type="button"
            onClick={() => handleExportCSV(activeTab === "refunds" ? "refunds" : "disputes")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#08172C",
              border: "1px solid var(--border-color)",
              color: "#FFFFFF",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
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

      {/* 2. Top Metric Cards (10 Dynamic KPI Cards) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        <div className="stat-card" style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#A9BDD7", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
            <span>Total Disputes</span>
            <ShieldAlert size={16} color="#00D5FF" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", marginTop: "8px" }}>
            {stats ? stats.totalDisputes : "..."}
          </div>
          <small style={{ color: "#A9BDD7", fontSize: "11px" }}>Lifetime customer claims</small>
        </div>

        <div className="stat-card" style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#A9BDD7", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
            <span>Open & Submitted</span>
            <Clock size={16} color="#00D5FF" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#00D5FF", marginTop: "8px" }}>
            {stats ? stats.openDisputes : "..."}
          </div>
          <small style={{ color: "#A9BDD7", fontSize: "11px" }}>Awaiting assignment</small>
        </div>

        <div className="stat-card" style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#A9BDD7", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
            <span>Under Review</span>
            <BarChart3 size={16} color="#F59E0B" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#F59E0B", marginTop: "8px" }}>
            {stats ? stats.underReview : "..."}
          </div>
          <small style={{ color: "#A9BDD7", fontSize: "11px" }}>Investigation in progress</small>
        </div>

        <div className="stat-card" style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#A9BDD7", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
            <span>Resolved</span>
            <CheckCircle2 size={16} color="#00E599" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#00E599", marginTop: "8px" }}>
            {stats ? stats.resolvedDisputes : "..."}
          </div>
          <small style={{ color: "#00E599", fontSize: "11px" }}>Claims successfully satisfied</small>
        </div>

        <div className="stat-card" style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#A9BDD7", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
            <span>Rejected</span>
            <XCircle size={16} color="#FF6B6B" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#FF6B6B", marginTop: "8px" }}>
            {stats ? stats.rejectedDisputes : "..."}
          </div>
          <small style={{ color: "#A9BDD7", fontSize: "11px" }}>Invalid / Settled claims</small>
        </div>

        <div className="stat-card" style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#A9BDD7", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
            <span>Refunded Total</span>
            <DollarSign size={16} color="#00E599" />
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#00E599", marginTop: "8px" }}>
            ₹{stats ? Number(stats.totalRefundAmount).toLocaleString("en-IN") : "0"}
          </div>
          <small style={{ color: "#A9BDD7", fontSize: "11px" }}>Total payouts disbursed</small>
        </div>

        <div className="stat-card" style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#A9BDD7", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
            <span>Pending Payout</span>
            <Clock size={16} color="#F59E0B" />
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#F59E0B", marginTop: "8px" }}>
            ₹{stats ? Number(stats.pendingRefundAmount).toLocaleString("en-IN") : "0"}
          </div>
          <small style={{ color: "#A9BDD7", fontSize: "11px" }}>Awaiting gateway approval</small>
        </div>

        <div className="stat-card" style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#A9BDD7", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
            <span>Overdue (&gt;24h)</span>
            <AlertTriangle size={16} color="#FF6B6B" />
          </div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#FF6B6B", marginTop: "8px" }}>
            {stats ? stats.overdueDisputes : 0}
          </div>
          <small style={{ color: "#FF6B6B", fontSize: "11px" }}>SLA breach alert</small>
        </div>
      </div>

      {/* 3. Navigation Tabs Bar */}
      <div style={{ display: "flex", gap: "8px", background: "#081629", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "6px", marginBottom: "20px", overflowX: "auto" }}>
        {[
          { id: "disputes", label: "Dispute Queue & Investigation", icon: ShieldAlert, badge: totalDisputes || "5" },
          { id: "refunds", label: "Refund Management Console", icon: DollarSign, badge: totalRefunds || "4" },
          { id: "analytics", label: "Dispute & Refund Analytics", icon: TrendingUp },
          { id: "reports", label: "Audit & SLA Reports", icon: FileText }
        ].map(t => {
          const Icon = t.icon;
          const isSelected = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
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
                cursor: "pointer",
                whiteSpace: "nowrap"
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
      {/* TAB 1: DISPUTE QUEUE TABLE */}
      {/* ======================================================== */}
      {activeTab === "disputes" && (
        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", overflow: "hidden" }}>
          {/* Filters Bar */}
          <div style={{ padding: "16px 20px", background: "#081629", borderBottom: "1px solid var(--border-color)", display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ position: "relative", minWidth: "280px", flex: 1 }}>
              <Search size={15} style={{ position: "absolute", left: "12px", top: "10px", color: "#5E7B9D" }} />
              <input
                type="text"
                placeholder="Search Dispute ID, User, Payment ID, Txn..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ width: "100%", background: "#071426", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px 8px 36px", color: "#FFFFFF", fontSize: "13px", outline: "none" }}
              />
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px", color: "#FFFFFF", fontSize: "12.5px" }}
              >
                <option value="All">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Pending Information">Pending Info</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px", color: "#FFFFFF", fontSize: "12.5px" }}
              >
                <option value="All">All Categories</option>
                <option value="Bill Payment Issue">Bill Payment Issue</option>
                <option value="QR Payment Issue">QR Payment Issue</option>
                <option value="Duplicate Payment">Duplicate Payment</option>
                <option value="Money Transfer Issue">Money Transfer Issue</option>
                <option value="Refund Not Received">Refund Not Received</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px", color: "#FFFFFF", fontSize: "12.5px" }}
              >
                <option value="All">All Priorities</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <select
                value={agentFilter}
                onChange={(e) => { setAgentFilter(e.target.value); setPage(1); }}
                style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px", color: "#FFFFFF", fontSize: "12.5px" }}
              >
                <option value="All">All Agents</option>
                <option value="Neha Deshmukh">Neha Deshmukh</option>
                <option value="Gopal Parmar">Gopal Parmar</option>
                <option value="Support Queue">Unassigned Queue</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#071426", borderBottom: "1px solid var(--border-color)", color: "var(--secondary-text)" }}>
                  <th style={{ padding: "12px 16px" }}>Dispute ID</th>
                  <th style={{ padding: "12px 16px" }}>Claimant</th>
                  <th style={{ padding: "12px 16px" }}>Txn ID / Type</th>
                  <th style={{ padding: "12px 16px" }}>Claim Amount</th>
                  <th style={{ padding: "12px 16px" }}>Category & Reason</th>
                  <th style={{ padding: "12px 16px" }}>Assigned Agent</th>
                  <th style={{ padding: "12px 16px" }}>Priority</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "#A9BDD7" }}>Loading dispute tickets...</td></tr>
                ) : disputes.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "#A9BDD7" }}>No disputes found matching current filters.</td></tr>
                ) : (
                  disputes.map((d) => (
                    <tr key={d.id} style={{ borderBottom: "1px solid rgba(23, 56, 93, 0.4)", transition: "background 0.15s" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <strong style={{ color: "#00D5FF" }}>{d.dispute_code || `#DSP-${d.id}`}</strong>
                        <div style={{ fontSize: "11px", color: "#8BA2C1", marginTop: "2px" }}>
                          {new Date(d.created_at).toLocaleDateString("en-IN")}
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: "700", color: "#FFFFFF" }}>{d.user_name}</div>
                        <div style={{ fontSize: "11px", color: "#8BA2C1" }}>UID: {d.user_id}</div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <code style={{ fontSize: "12px", color: "#A9BDD7" }}>{d.transaction_id || `#TXN-${d.payment_id}`}</code>
                        <div style={{ fontSize: "11px", color: "var(--cyan-highlight)" }}>{d.transaction_type}</div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <strong style={{ color: "#FF6B6B", fontSize: "14px" }}>
                          ₹{Number(d.claim_amount || d.amount).toFixed(2)}
                        </strong>
                      </td>

                      <td style={{ padding: "14px 16px", maxWidth: "240px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", background: "rgba(0, 213, 255, 0.1)", color: "#00D5FF", padding: "2px 6px", borderRadius: "4px" }}>
                          {d.category || d.dispute_reason}
                        </span>
                        <div style={{ fontSize: "11.5px", color: "#A9BDD7", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {d.description}
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px", fontSize: "12px", color: "#FFFFFF" }}>
                        {d.assigned_agent || "Unassigned"}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          fontSize: "10.5px",
                          fontWeight: "800",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          textTransform: "uppercase",
                          background: d.priority === "Urgent" ? "rgba(255, 77, 77, 0.2)" : d.priority === "High" ? "rgba(245, 158, 11, 0.2)" : "rgba(8, 123, 255, 0.15)",
                          color: d.priority === "Urgent" ? "#FF6B6B" : d.priority === "High" ? "#F59E0B" : "#00D5FF"
                        }}>
                          {d.priority || "Medium"}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span className={getStatusBadgeClass(d.status)}>
                          {d.status}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleOpenInvestigate(d)}
                          style={{
                            background: "linear-gradient(135deg, #087BFF, #00D5FF)",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: "6px",
                            padding: "6px 12px",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            boxShadow: "0 2px 8px rgba(0, 168, 255, 0.3)"
                          }}
                        >
                          <Eye size={13} /> Investigate
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#081629", borderTop: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "12px", color: "var(--secondary-text)" }}>
              Showing {disputes.length} of {totalDisputes} total disputes
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                style={{ padding: "5px 12px", background: "#071426", border: "1px solid var(--border-color)", color: page <= 1 ? "#475569" : "#FFFFFF", borderRadius: "6px", cursor: page <= 1 ? "not-allowed" : "pointer" }}
              >
                Previous
              </button>
              <button
                disabled={page * recordsPerPage >= totalDisputes}
                onClick={() => setPage(p => p + 1)}
                style={{ padding: "5px 12px", background: "#071426", border: "1px solid var(--border-color)", color: page * recordsPerPage >= totalDisputes ? "#475569" : "#FFFFFF", borderRadius: "6px", cursor: page * recordsPerPage >= totalDisputes ? "not-allowed" : "pointer" }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: REFUND MANAGEMENT CONSOLE */}
      {/* ======================================================== */}
      {activeTab === "refunds" && (
        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", overflow: "hidden" }}>
          {/* Filters Bar */}
          <div style={{ padding: "16px 20px", background: "#081629", borderBottom: "1px solid var(--border-color)", display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ position: "relative", minWidth: "280px", flex: 1 }}>
              <Search size={15} style={{ position: "absolute", left: "12px", top: "10px", color: "#5E7B9D" }} />
              <input
                type="text"
                placeholder="Search Refund ID, UTR, Txn, User..."
                value={refundSearch}
                onChange={(e) => { setRefundSearch(e.target.value); setRefundPage(1); }}
                style={{ width: "100%", background: "#071426", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px 8px 36px", color: "#FFFFFF", fontSize: "13px", outline: "none" }}
              />
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <select
                value={refundStatusFilter}
                onChange={(e) => { setRefundStatusFilter(e.target.value); setRefundPage(1); }}
                style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px", color: "#FFFFFF", fontSize: "12.5px" }}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Processing">Processing</option>
                <option value="Successful">Successful</option>
                <option value="Failed">Failed</option>
                <option value="Rejected">Rejected</option>
              </select>

              <select
                value={refundMethodFilter}
                onChange={(e) => { setRefundMethodFilter(e.target.value); setRefundPage(1); }}
                style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px", color: "#FFFFFF", fontSize: "12.5px" }}
              >
                <option value="All">All Refund Methods</option>
                <option value="Wallet">Wallet</option>
                <option value="UPI">UPI</option>
                <option value="Bank">Bank Account</option>
              </select>
            </div>
          </div>

          {/* Refunds Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#071426", borderBottom: "1px solid var(--border-color)", color: "var(--secondary-text)" }}>
                  <th style={{ padding: "12px 16px" }}>Refund Code</th>
                  <th style={{ padding: "12px 16px" }}>Beneficiary / User</th>
                  <th style={{ padding: "12px 16px" }}>Original Txn</th>
                  <th style={{ padding: "12px 16px" }}>Linked Dispute</th>
                  <th style={{ padding: "12px 16px" }}>Refund Amount</th>
                  <th style={{ padding: "12px 16px" }}>Method</th>
                  <th style={{ padding: "12px 16px" }}>UTR / Reference</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {refunds.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "#A9BDD7" }}>No refund requests found.</td></tr>
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
                        <div style={{ fontWeight: "700", color: "#FFFFFF" }}>{r.user_name}</div>
                        <div style={{ fontSize: "11px", color: "#8BA2C1" }}>UID: {r.user_id}</div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <code style={{ fontSize: "12px", color: "#A9BDD7" }}>{r.transaction_id || `#TXN-${r.payment_id}`}</code>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        {r.dispute_code ? (
                          <span style={{ fontSize: "11px", color: "#00D5FF", fontWeight: "700" }}>{r.dispute_code}</span>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#64748B" }}>Direct Request</span>
                        )}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <strong style={{ color: "#00E599", fontSize: "14px" }}>
                          ₹{Number(r.amount).toFixed(2)}
                        </strong>
                      </td>

                      <td style={{ padding: "14px 16px", fontSize: "12px", color: "#FFFFFF" }}>
                        {r.refund_method}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        {r.utr_number ? (
                          <code style={{ fontSize: "11px", color: "#00E599" }}>{r.utr_number}</code>
                        ) : r.failure_reason ? (
                          <span style={{ fontSize: "11px", color: "#FF6B6B" }}>{r.failure_reason}</span>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#F59E0B" }}>Awaiting Gateway</span>
                        )}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span className={getStatusBadgeClass(r.status)}>
                          {r.status}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          {r.status === "Pending" && (
                            <button
                              type="button"
                              onClick={() => handleInitiateRefund(r.id)}
                              disabled={submittingAction}
                              style={{ background: "#087BFF", border: "none", color: "#FFF", padding: "5px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: "700", cursor: "pointer" }}
                            >
                              Initiate Payout
                            </button>
                          )}

                          {r.status === "Failed" && (
                            <button
                              type="button"
                              onClick={() => handleRetryRefund(r.id)}
                              disabled={submittingAction}
                              style={{ background: "#F59E0B", border: "none", color: "#000", padding: "5px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: "700", cursor: "pointer" }}
                            >
                              Retry
                            </button>
                          )}

                          {r.status === "Successful" && (
                            <button
                              type="button"
                              onClick={() => setSelectedRefund(r)}
                              style={{ background: "rgba(0, 229, 153, 0.15)", border: "1px solid rgba(0, 229, 153, 0.3)", color: "#00E599", padding: "5px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: "700", cursor: "pointer" }}
                            >
                              Receipt
                            </button>
                          )}
                        </div>
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
      {/* TAB 3: DISPUTE & REFUND ANALYTICS */}
      {/* ======================================================== */}
      {activeTab === "analytics" && analytics && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "20px" }}>
          {/* Monthly Dispute vs Refund Volume */}
          <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#FFFFFF", marginBottom: "4px" }}>
              Monthly Dispute Claims vs Resolved Volume
            </h3>
            <p style={{ fontSize: "12px", color: "var(--secondary-text)", marginBottom: "16px" }}>
              Trailing 6-month grievance volume and refund disbursement amounts
            </p>

            <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", height: "180px", paddingTop: "20px", borderBottom: "1px solid rgba(23, 56, 93, 0.6)", paddingBottom: "10px" }}>
              {(analytics.monthlyTrends || []).map((m, idx) => (
                <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "10px", color: "#00D5FF", fontWeight: "700" }}>₹{(m.amount / 1000).toFixed(0)}k</span>
                  <div style={{ display: "flex", gap: "4px", width: "100%", justifyContent: "center", alignItems: "flex-end", height: "80%" }}>
                    <div style={{ width: "14px", height: `${(m.disputes / 28) * 100}%`, background: "#FF6B6B", borderRadius: "4px 4px 0 0" }} title={`Disputes: ${m.disputes}`} />
                    <div style={{ width: "14px", height: `${(m.resolved / 28) * 100}%`, background: "#00E599", borderRadius: "4px 4px 0 0" }} title={`Resolved: ${m.resolved}`} />
                  </div>
                  <span style={{ fontSize: "10.5px", color: "#8BA2C1", whiteSpace: "nowrap" }}>{m.month.split(" ")[0]}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "12px", fontSize: "12px" }}>
              <span style={{ color: "#FF6B6B" }}>● Disputes Filed</span>
              <span style={{ color: "#00E599" }}>● Claims Resolved</span>
            </div>
          </div>

          {/* Complaint Category Breakdown */}
          <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#FFFFFF", marginBottom: "4px" }}>
              Complaint Category Distribution
            </h3>
            <p style={{ fontSize: "12px", color: "var(--secondary-text)", marginBottom: "16px" }}>
              Breakdown by grievance type across ApnaPay services
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {(analytics.categoryDistribution || []).map((cat, idx) => (
                <div key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: "4px" }}>
                    <span style={{ color: "#FFFFFF", fontWeight: "600" }}>{cat.category}</span>
                    <span style={{ color: "var(--cyan-highlight)" }}>{cat.count} disputes ({cat.pct}%)</span>
                  </div>
                  <div style={{ width: "100%", height: "7px", background: "#071426", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${cat.pct}%`, height: "100%", background: "linear-gradient(90deg, #087BFF, #00D5FF)", borderRadius: "4px" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: AUDIT & SLA REPORTS */}
      {/* ======================================================== */}
      {activeTab === "reports" && (
        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#FFFFFF", marginBottom: "6px" }}>
            Compliance & SLA Resolution Audit Center
          </h3>
          <p style={{ fontSize: "13px", color: "var(--secondary-text)", marginBottom: "20px" }}>
            Export compliance logs required by Reserve Bank of India (RBI) and National Payments Corporation of India (NPCI).
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            <div style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "16px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#FFFFFF", marginBottom: "4px" }}>Daily Dispute Incident Log</h4>
              <p style={{ fontSize: "12px", color: "var(--secondary-text)", marginBottom: "12px" }}>Raw list of all disputes logged today with user details & evidence</p>
              <button onClick={() => handleExportCSV("disputes")} style={{ background: "#087BFF", border: "none", color: "#FFF", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                Download CSV
              </button>
            </div>

            <div style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "16px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#FFFFFF", marginBottom: "4px" }}>Monthly Refund Settlement Report</h4>
              <p style={{ fontSize: "12px", color: "var(--secondary-text)", marginBottom: "12px" }}>Complete ledger of bank reversals, wallet credits, and gateway UTR numbers</p>
              <button onClick={() => handleExportCSV("refunds")} style={{ background: "#00E599", border: "none", color: "#000", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                Download CSV
              </button>
            </div>

            <div style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "16px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#FFFFFF", marginBottom: "4px" }}>SLA & Resolution Speed Audit</h4>
              <p style={{ fontSize: "12px", color: "var(--secondary-text)", marginBottom: "12px" }}>Average TAT (Turn Around Time) metric: 4.2h against 24h statutory window</p>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#00E599" }}>✓ 94.8% SLA Compliant</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. INVESTIGATION DRAWER / MODAL */}
      {/* ======================================================== */}
      {selectedDispute && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(3, 10, 20, 0.85)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", justifyContent: "flex-end" }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedDispute(null); }}
        >
          <div style={{ width: "100%", maxWidth: "680px", background: "#0B1D35", borderLeft: "1px solid rgba(0, 213, 255, 0.3)", height: "100%", overflowY: "auto", padding: "24px", boxShadow: "-8px 0 32px rgba(0,0,0,0.6)" }}>
            {/* Drawer Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginBottom: "20px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "#00D5FF", background: "rgba(0, 213, 255, 0.15)", padding: "2px 8px", borderRadius: "4px" }}>
                    {selectedDispute.dispute_code || `#DSP-${selectedDispute.id}`}
                  </span>
                  <span className={getStatusBadgeClass(selectedDispute.status)}>
                    {selectedDispute.status}
                  </span>
                </div>
                <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#FFFFFF", marginTop: "6px", margin: 0 }}>
                  Dispute Investigation Console
                </h2>
              </div>
              <button onClick={() => setSelectedDispute(null)} style={{ background: "transparent", border: "none", color: "#A9BDD7", cursor: "pointer" }}>
                <X size={22} />
              </button>
            </div>

            {/* Quick Action Strip */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
              <button
                type="button"
                onClick={() => { setActiveModal("resolve"); setActionStatus("Resolved"); setActionNotes(""); }}
                style={{ background: "#00E599", border: "none", color: "#000", padding: "8px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
              >
                ✓ Approve & Refund
              </button>
              <button
                type="button"
                onClick={() => { setActiveModal("resolve"); setActionStatus("Rejected"); setActionNotes(""); }}
                style={{ background: "#FF6B6B", border: "none", color: "#FFF", padding: "8px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
              >
                ✕ Reject Claim
              </button>
              <button
                type="button"
                onClick={() => { setActiveModal("message"); setActionNotes(""); }}
                style={{ background: "#087BFF", border: "none", color: "#FFF", padding: "8px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
              >
                ✉ Request Information
              </button>
              <button
                type="button"
                onClick={() => { setActiveModal("note"); setActionNotes(""); }}
                style={{ background: "#071426", border: "1px solid var(--border-color)", color: "#00D5FF", padding: "8px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
              >
                + Internal Note
              </button>
            </div>

            {/* User & Transaction Detail Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              <div style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "14px", fontSize: "12.5px" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#00D5FF", textTransform: "uppercase", marginBottom: "8px" }}>Claimant Information</div>
                <div style={{ color: "#FFFFFF", fontWeight: "700", fontSize: "14px" }}>{selectedDispute.user_name}</div>
                <div style={{ color: "#A9BDD7", marginTop: "3px" }}>Email: {selectedDispute.user_email || "N/A"}</div>
                <div style={{ color: "#A9BDD7", marginTop: "2px" }}>Phone: {selectedDispute.user_phone || "N/A"}</div>
                <div style={{ color: "#8BA2C1", marginTop: "2px" }}>User ID: #{selectedDispute.user_id}</div>
              </div>

              <div style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "14px", fontSize: "12.5px" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#00D5FF", textTransform: "uppercase", marginBottom: "8px" }}>Transaction Breakdown</div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#A9BDD7" }}>Txn ID:</span>
                  <code style={{ color: "#FFFFFF" }}>{selectedDispute.transaction_id}</code>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                  <span style={{ color: "#A9BDD7" }}>Payment Method:</span>
                  <span style={{ color: "#FFFFFF" }}>{selectedDispute.payment_method}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                  <span style={{ color: "#A9BDD7" }}>Txn Amount:</span>
                  <span style={{ color: "#FFFFFF" }}>₹{Number(selectedDispute.original_amount || selectedDispute.claim_amount).toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                  <span style={{ color: "#A9BDD7" }}>Claim Amount:</span>
                  <strong style={{ color: "#FF6B6B" }}>₹{Number(selectedDispute.claim_amount || selectedDispute.amount).toFixed(2)}</strong>
                </div>
              </div>
            </div>

            {/* Complaint Description & Evidence */}
            <div style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#00D5FF", textTransform: "uppercase", marginBottom: "6px" }}>
                Grievance Description • {selectedDispute.category || selectedDispute.dispute_reason}
              </div>
              <p style={{ fontSize: "13px", color: "#E2ECFF", lineHeight: "1.5", margin: 0 }}>
                "{selectedDispute.description}"
              </p>

              {selectedDispute.evidence_url && (
                <div style={{ marginTop: "12px", borderTop: "1px solid rgba(23, 56, 93, 0.6)", paddingTop: "12px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#A9BDD7", marginBottom: "6px" }}>Uploaded Supporting Evidence:</div>
                  <a
                    href={selectedDispute.evidence_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--cyan-highlight)", fontSize: "12px", textDecoration: "none" }}
                  >
                    📎 {selectedDispute.evidence_name || "View Attached Evidence Document"} →
                  </a>
                </div>
              )}
            </div>

            {/* Assignment & Priority Controls */}
            <div style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "14px", marginBottom: "20px", display: "flex", gap: "12px", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#A9BDD7", marginBottom: "4px" }}>Assigned Agent</label>
                <select
                  value={assignedAgent}
                  onChange={(e) => setAssignedAgent(e.target.value)}
                  style={{ width: "100%", background: "#0B1D35", border: "1px solid var(--border-color)", color: "#FFF", borderRadius: "6px", padding: "6px 8px", fontSize: "12.5px" }}
                >
                  <option value="Support Queue">Support Queue (Unassigned)</option>
                  <option value="Neha Deshmukh">Neha Deshmukh (Level 2 Senior)</option>
                  <option value="Gopal Parmar">Gopal Parmar (Super Admin)</option>
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#A9BDD7", marginBottom: "4px" }}>Priority</label>
                <select
                  value={assignedPriority}
                  onChange={(e) => setAssignedPriority(e.target.value)}
                  style={{ width: "100%", background: "#0B1D35", border: "1px solid var(--border-color)", color: "#FFF", borderRadius: "6px", padding: "6px 8px", fontSize: "12.5px" }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAssignSubmit}
                disabled={submittingAction}
                style={{ marginTop: "18px", background: "#087BFF", border: "none", color: "#FFF", padding: "7px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
              >
                Save
              </button>
            </div>

            {/* Internal Investigation Notes */}
            {selectedDispute.internal_notes && (
              <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: "10px", padding: "14px", marginBottom: "20px" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#F59E0B", textTransform: "uppercase", marginBottom: "6px" }}>
                  🔒 Internal Investigation Notes (Admin Only)
                </div>
                <div style={{ fontSize: "12.5px", color: "#FDE68A", whiteSpace: "pre-wrap", lineHeight: "1.4" }}>
                  {selectedDispute.internal_notes}
                </div>
              </div>
            )}

            {/* Communication Thread (User & Admin Messages) */}
            <div style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#FFFFFF", marginBottom: "12px" }}>Customer Communication Thread</div>
              {(!selectedDispute.messages || selectedDispute.messages.length === 0) ? (
                <div style={{ fontSize: "12px", color: "#64748B", textAlign: "center", padding: "12px" }}>No messages exchanged yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {selectedDispute.messages.map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: m.sender_type === "admin" ? "rgba(8, 123, 255, 0.15)" : "#0B1D35",
                        border: `1px solid ${m.sender_type === "admin" ? "rgba(8, 123, 255, 0.3)" : "rgba(23, 56, 93, 0.6)"}`,
                        alignSelf: m.sender_type === "admin" ? "flex-end" : "flex-start",
                        maxWidth: "85%"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", fontSize: "11px", color: m.sender_type === "admin" ? "#00D5FF" : "#A9BDD7", marginBottom: "3px" }}>
                        <strong>{m.sender_name}</strong>
                        <span>{new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div style={{ fontSize: "12.5px", color: "#FFFFFF" }}>{m.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit Log / Timeline */}
            <div style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#FFFFFF", marginBottom: "12px" }}>Investigation Audit Log</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {(selectedDispute.timeline || []).map((tl, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "10px", fontSize: "12px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00D5FF", marginTop: "6px" }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ color: "#FFFFFF", fontWeight: "600" }}>{tl.action.replace(/_/g, " ")}</span> by <span style={{ color: "#00D5FF" }}>{tl.actor}</span>
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

      {/* 6. Action Modal (Resolve / Reject / Note / Message) */}
      {activeModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "grid", placeItems: "center", zIndex: 10000, padding: "16px" }}>
          <div style={{ width: "100%", maxWidth: "500px", background: "#0B1D35", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "22px", boxShadow: "0 16px 40px rgba(0,0,0,0.6)" }}>
            <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#FFFFFF", marginBottom: "14px" }}>
              {activeModal === "resolve" ? `${actionStatus} Dispute Claim` : activeModal === "note" ? "Add Internal Note" : "Send Customer Message"}
            </h3>

            {activeModal === "resolve" && (
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#A9BDD7", marginBottom: "6px" }}>Decision Status</label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value)}
                  style={{ width: "100%", background: "#071426", border: "1px solid var(--border-color)", color: "#FFF", borderRadius: "8px", padding: "8px 12px", fontSize: "13px" }}
                >
                  <option value="Resolved">Resolved (Approve & Settle)</option>
                  <option value="Rejected">Rejected (Deny Claim)</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#A9BDD7", marginBottom: "6px" }}>
                {activeModal === "resolve" ? "Resolution / Rejection Remarks (Required)" : activeModal === "note" ? "Internal Investigation Remark" : "Message to Customer"}
              </label>
              <textarea
                rows={4}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Enter remarks or reasoning..."
                required
                style={{ width: "100%", background: "#071426", border: "1px solid var(--border-color)", color: "#FFF", borderRadius: "8px", padding: "10px", fontSize: "13px", outline: "none" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" onClick={() => setActiveModal(null)} style={{ padding: "8px 16px", background: "#08172C", border: "1px solid var(--border-color)", color: "#A9BDD7", borderRadius: "8px", cursor: "pointer" }}>
                Cancel
              </button>
              <button
                type="button"
                onClick={activeModal === "resolve" ? handleStatusSubmit : activeModal === "note" ? handleAddNote : () => handleSendMessage(false)}
                disabled={submittingAction}
                style={{
                  padding: "8px 18px",
                  background: actionStatus === "Rejected" ? "#FF6B6B" : "linear-gradient(135deg, #087BFF, #00D5FF)",
                  border: "none",
                  color: "#FFFFFF",
                  fontWeight: "700",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                {submittingAction ? "Processing..." : "Confirm & Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Refund Receipt Modal */}
      {selectedRefund && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "grid", placeItems: "center", zIndex: 10000, padding: "16px" }}>
          <div style={{ width: "100%", maxWidth: "460px", background: "#0B1D35", border: "1px solid #00E599", borderRadius: "14px", padding: "24px" }}>
            <div style={{ textAlign: "center", paddingBottom: "16px", borderBottom: "1px solid rgba(23, 56, 93, 0.6)" }}>
              <CheckCircle2 size={44} color="#00E599" style={{ margin: "0 auto 8px" }} />
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#FFFFFF" }}>ApnaPay Refund Receipt</h3>
              <div style={{ fontSize: "12px", color: "#A9BDD7" }}>Bank Gateway UTR Acknowledgment</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#A9BDD7" }}>Refund Code:</span>
                <strong style={{ color: "#00E599" }}>{selectedRefund.refund_code}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#A9BDD7" }}>Claimant:</span>
                <span style={{ color: "#FFFFFF" }}>{selectedRefund.user_name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#A9BDD7" }}>Original Txn:</span>
                <span style={{ color: "#FFFFFF" }}>{selectedRefund.transaction_id}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#A9BDD7" }}>Refund Amount:</span>
                <strong style={{ color: "#00E599", fontSize: "15px" }}>₹{Number(selectedRefund.amount).toFixed(2)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#A9BDD7" }}>Payout Method:</span>
                <span style={{ color: "#FFFFFF" }}>{selectedRefund.refund_method}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#A9BDD7" }}>Bank UTR / Ref:</span>
                <code style={{ color: "#00D5FF" }}>{selectedRefund.utr_number}</code>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#A9BDD7" }}>Completion Date:</span>
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
