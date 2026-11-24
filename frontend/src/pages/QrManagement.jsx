import React, { useEffect, useState, useCallback } from "react";
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Plus,
  Download,
  Filter,
  BarChart3,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";
import api from "../services/api";
import QrStats from "../components/qr/QrStats";
import QrAnalytics from "../components/qr/QrAnalytics";
import QrFilterBar from "../components/qr/QrFilterBar";
import QrCodesTable from "../components/qr/QrCodesTable";
import QrRequestsTable from "../components/qr/QrRequestsTable";
import CreateQrModal from "../components/qr/CreateQrModal";
import QrDetailsModal from "../components/qr/QrDetailsModal";
import QrRequestDetailsModal from "../components/qr/QrRequestDetailsModal";

export default function QrManagement() {
  const [data, setData] = useState({
    stats: {
      total_qrs: 0,
      active_qrs: 0,
      total_collection: 0,
      total_requests: 0,
      pending_payments: 0,
      failed_payments: 0
    },
    qr_codes: [],
    payment_requests: [],
    analytics: {
      dailyCollection: [],
      weeklyCollection: [],
      monthlyCollection: [],
      typeUsage: [],
      merchantCollection: []
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'qrs', 'requests'

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createInitialType, setCreateInitialType] = useState("static");
  const [selectedQr, setSelectedQr] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Filters state
  const [filters, setFilters] = useState({
    search: "",
    qr_type: "all",
    payment_status: "all",
    min_amount: "",
    max_amount: "",
    start_date: "",
    end_date: "",
    range: "30d"
  });

  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const fetchQrData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.search?.trim()) params.search = filters.search.trim();
      if (filters.qr_type && filters.qr_type !== "all") params.qr_type = filters.qr_type;
      if (filters.payment_status && filters.payment_status !== "all")
        params.payment_status = filters.payment_status;
      if (filters.min_amount) params.min_amount = filters.min_amount;
      if (filters.max_amount) params.max_amount = filters.max_amount;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.range) params.range = filters.range;
      if (filters.range === "custom" && customStart && customEnd) {
        params.start_date = customStart;
        params.end_date = customEnd;
      }

      const res = await api.get("/admin/qr", { params });
      if (res.data?.success) {
        setData({
          stats: res.data.stats || data.stats,
          qr_codes: res.data.qr_codes || [],
          payment_requests: res.data.payment_requests || [],
          analytics: res.data.analytics || data.analytics
        });
      }
    } catch (err) {
      console.error("Fetch QR error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load QR payment records from backend. Please verify database connection."
      );
    } finally {
      setLoading(false);
    }
  }, [filters, customStart, customEnd]);

  useEffect(() => {
    fetchQrData();
  }, [filters.range]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilters = () => {
    fetchQrData();
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      qr_type: "all",
      payment_status: "all",
      min_amount: "",
      max_amount: "",
      start_date: "",
      end_date: "",
      range: "30d"
    });
    setCustomStart("");
    setCustomEnd("");
    setLoading(true);
    api
      .get("/admin/qr")
      .then((res) => {
        if (res.data?.success) {
          setData(res.data);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  // Quick Action Handlers
  const handleOpenCreateStatic = () => {
    setCreateInitialType("static");
    setCreateModalOpen(true);
  };

  const handleOpenCreateDynamic = () => {
    setCreateInitialType("dynamic");
    setCreateModalOpen(true);
  };

  const handleFilterPending = () => {
    setFilters((prev) => ({
      ...prev,
      payment_status: "pending"
    }));
    setActiveTab("requests");
    fetchQrData();
  };

  const handleViewTransactionsForQr = (qr) => {
    setFilters((prev) => ({
      ...prev,
      search: qr.qr_reference || String(qr.id)
    }));
    setActiveTab("requests");
    fetchQrData();
  };

  const handleToggleQrStatus = async (qr) => {
    try {
      const res = await api.patch(`/admin/qr/${qr.id}/status`, {
        status: qr.status === "active" ? "inactive" : "active"
      });
      if (res.data?.success) {
        fetchQrData();
      }
    } catch (err) {
      alert("Failed to update QR status: " + (err.response?.data?.message || err.message));
    }
  };

  const handlePayRequest = async (req) => {
    const confirm = window.confirm(`Authorize and settle payment for Request #${req.id} of ₹${req.amount}?`);
    if (!confirm) return;
    try {
      const res = await api.post(`/qr/requests/${req.reference_id}/pay`);
      if (res.data?.success) {
        fetchQrData();
      }
    } catch (err) {
      alert("Payment failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleCancelRequest = async (req) => {
    const confirm = window.confirm(`Cancel pending scan request #${req.id}?`);
    if (!confirm) return;
    try {
      const res = await api.post(`/qr/requests/${req.reference_id}/cancel`);
      if (res.data?.success) {
        fetchQrData();
      }
    } catch (err) {
      alert("Cancellation failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDownloadQr = (qr) => {
    if (!qr.qr_image) return;
    const a = document.createElement("a");
    a.href = qr.qr_image;
    a.download = `ApnaPay-QR-${qr.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // CSV Report Generator
  const handleExportCsv = () => {
    const rows = [
      ["Request ID", "QR ID", "Merchant Name", "Customer", "Amount", "Method", "Txn ID", "Status", "Date"]
    ];

    data.payment_requests.forEach((r) => {
      rows.push([
        r.id,
        r.qr_id,
        r.merchant_name || "",
        r.payer_name || "",
        r.amount,
        r.payment_method,
        r.transaction_reference || "",
        r.status,
        new Date(r.created_at).toISOString()
      ]);
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ApnaPay-QR-Report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      style={{
        padding: "24px 28px",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      {/* 1. Header Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          paddingBottom: "16px",
          borderBottom: "1px solid #16365C"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, rgba(8, 123, 255, 0.2) 0%, rgba(0, 213, 255, 0.1) 100%)",
                border: "1px solid rgba(0, 213, 255, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 15px rgba(0, 213, 255, 0.2)"
              }}
            >
              <QrCode size={22} color="#00D5FF" />
            </div>

            <div>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: "800",
                  color: "#FFFFFF",
                  margin: 0,
                  letterSpacing: "-0.3px"
                }}
              >
                Module 8: QR Payment Management
              </h1>
              <p
                style={{
                  fontSize: "13px",
                  color: "#8BA2C1",
                  margin: "4px 0 0 0"
                }}
              >
                Supervise merchant counter static QRs, dynamic invoice billing, and customer scan-to-pay requests.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Header Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {/* Create Static QR */}
          <button
            onClick={handleOpenCreateStatic}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 14px",
              borderRadius: "8px",
              background: "#087BFF",
              border: "none",
              color: "#FFFFFF",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            <Plus size={14} /> Create Static QR
          </button>

          {/* Create Dynamic QR */}
          <button
            onClick={handleOpenCreateDynamic}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 14px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #087BFF 0%, #00D5FF 100%)",
              border: "none",
              color: "#FFFFFF",
              fontSize: "12.5px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(0, 213, 255, 0.3)"
            }}
          >
            <Plus size={14} /> Create Dynamic QR
          </button>

          {/* Download CSV Report */}
          <button
            onClick={handleExportCsv}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 12px",
              borderRadius: "8px",
              background: "#0B1D35",
              border: "1px solid #16365C",
              color: "#00E599",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer"
            }}
            title="Download QR transactions CSV report"
          >
            <FileSpreadsheet size={14} /> Export Report
          </button>

          {/* Toggle Analytics */}
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 14px",
              borderRadius: "8px",
              background: showAnalytics ? "rgba(8, 123, 255, 0.15)" : "#071426",
              border: showAnalytics ? "1px solid #00D5FF" : "1px solid #16365C",
              color: showAnalytics ? "#00D5FF" : "#8BA2C1",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            <BarChart3 size={15} />
            <span>{showAnalytics ? "Hide Analytics" : "Show Analytics"}</span>
            {showAnalytics ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {/* Refresh Page */}
          <button
            onClick={fetchQrData}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 14px",
              borderRadius: "8px",
              background: "#071426",
              border: "1px solid #16365C",
              color: "#00D5FF",
              fontSize: "12.5px",
              fontWeight: "600",
              cursor: "pointer"
            }}
            title="Refresh QR Data"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Error banner if any */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "rgba(255, 77, 77, 0.12)",
            border: "1px solid rgba(255, 77, 77, 0.3)",
            borderRadius: "8px",
            color: "#FF6B6B",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Six Dashboard Statistics Cards */}
      <QrStats stats={data.stats} loading={loading} />

      {/* 4. Quick Actions Shortcuts Strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          padding: "12px 16px",
          background: "#0B1D35",
          border: "1px solid #16365C",
          borderRadius: "10px"
        }}
      >
        <span style={{ fontSize: "12px", color: "#8BA2C1", fontWeight: "700", textTransform: "uppercase" }}>
          Quick Navigation:
        </span>

        <button
          onClick={() => setActiveTab("all")}
          style={{
            padding: "5px 12px",
            borderRadius: "6px",
            background: activeTab === "all" ? "#087BFF" : "#071426",
            border: activeTab === "all" ? "1px solid #00D5FF" : "1px solid #16365C",
            color: activeTab === "all" ? "#FFFFFF" : "#8BA2C1",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          View All Modules
        </button>

        <button
          onClick={() => setActiveTab("qrs")}
          style={{
            padding: "5px 12px",
            borderRadius: "6px",
            background: activeTab === "qrs" ? "#087BFF" : "#071426",
            border: activeTab === "qrs" ? "1px solid #00D5FF" : "1px solid #16365C",
            color: activeTab === "qrs" ? "#FFFFFF" : "#8BA2C1",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          View All QR Codes ({data.qr_codes?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("requests")}
          style={{
            padding: "5px 12px",
            borderRadius: "6px",
            background: activeTab === "requests" ? "#087BFF" : "#071426",
            border: activeTab === "requests" ? "1px solid #00D5FF" : "1px solid #16365C",
            color: activeTab === "requests" ? "#FFFFFF" : "#8BA2C1",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          View QR Transactions ({data.payment_requests?.length || 0})
        </button>

        <button
          onClick={handleFilterPending}
          style={{
            padding: "5px 12px",
            borderRadius: "6px",
            background: filters.payment_status === "pending" ? "#FFB020" : "#071426",
            border: filters.payment_status === "pending" ? "1px solid #FFAA00" : "1px solid #16365C",
            color: filters.payment_status === "pending" ? "#050D1B" : "#FFB020",
            fontSize: "12px",
            fontWeight: "700",
            cursor: "pointer"
          }}
        >
          View Pending Payments ({data.stats?.pending_payments || 0})
        </button>
      </div>

      {/* 5. QR Analytics Section (Collapsible) */}
      {showAnalytics && (
        <QrAnalytics
          analytics={data.analytics}
          range={filters.range}
          onRangeChange={(r) => handleFilterChange("range", r)}
          customStart={customStart}
          customEnd={customEnd}
          onCustomStartChange={setCustomStart}
          onCustomEndChange={setCustomEnd}
          onApplyCustomRange={fetchQrData}
          onRefresh={fetchQrData}
          loading={loading}
        />
      )}

      {/* 6. Universal Search & Filter Bar */}
      <QrFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        onRefresh={fetchQrData}
        loading={loading}
        totalQrs={data.qr_codes?.length || 0}
        totalRequests={data.payment_requests?.length || 0}
      />

      {/* 7. Tables Section */}
      {(activeTab === "all" || activeTab === "qrs") && (
        <QrCodesTable
          qrCodes={data.qr_codes}
          loading={loading}
          onViewQr={(qr) => setSelectedQr(qr)}
          onDownloadQr={handleDownloadQr}
          onViewTransactions={handleViewTransactionsForQr}
          onToggleStatus={handleToggleQrStatus}
        />
      )}

      {(activeTab === "all" || activeTab === "requests") && (
        <QrRequestsTable
          paymentRequests={data.payment_requests}
          loading={loading}
          onPayRequest={handlePayRequest}
          onCancelRequest={handleCancelRequest}
          onViewRequest={(req) => setSelectedRequest(req)}
        />
      )}

      {/* 8. Modals */}
      <CreateQrModal
        isOpen={createModalOpen}
        initialType={createInitialType}
        onClose={() => setCreateModalOpen(false)}
        onQrCreated={fetchQrData}
      />

      <QrDetailsModal
        qr={selectedQr}
        isOpen={Boolean(selectedQr)}
        onClose={() => setSelectedQr(null)}
      />

      <QrRequestDetailsModal
        request={selectedRequest}
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        onPay={handlePayRequest}
        onCancel={handleCancelRequest}
      />
    </div>
  );
}
