import React, { useState, useEffect, useCallback } from "react";
import {
  Send,
  RefreshCw,
  BarChart3,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import api from "../../services/api";
import TransferStats from "../../components/transfers/TransferStats";
import TransferAnalytics from "../../components/transfers/TransferAnalytics";
import TransfersFilterBar from "../../components/transfers/TransfersFilterBar";
import TransfersTable from "../../components/transfers/TransfersTable";
import TransferDetailsDrawer from "../../components/transfers/TransferDetailsDrawer";

export default function MoneyTransfers() {
  const [transfers, setTransfers] = useState([]);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Statistics state
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    pending: 0,
    failed: 0,
    totalAmount: 0,
    totalFees: 0
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // Filters state
  const [filters, setFilters] = useState({
    search: "",
    mode: "all",
    status: "all",
    transfer_id: "",
    user_id: "",
    reference_id: "",
    beneficiary_name: "",
    min_amount: "",
    max_amount: "",
    start_date: "",
    end_date: ""
  });

  // Fetch transfers with all filters and pagination
  const fetchTransfers = useCallback(
    async (overridePage = null, overrideLimit = null) => {
      setLoading(true);
      setError(null);

      const targetPage = overridePage !== null ? overridePage : pagination.page;
      const targetLimit = overrideLimit !== null ? overrideLimit : pagination.limit;

      const queryParams = {
        page: targetPage,
        limit: targetLimit
      };

      if (filters.search?.trim()) queryParams.search = filters.search.trim();
      if (filters.mode && filters.mode !== "all") queryParams.mode = filters.mode;
      if (filters.status && filters.status !== "all") queryParams.status = filters.status;
      if (filters.transfer_id) queryParams.transfer_id = filters.transfer_id;
      if (filters.user_id) queryParams.user_id = filters.user_id;
      if (filters.reference_id?.trim()) queryParams.reference_id = filters.reference_id.trim();
      if (filters.beneficiary_name?.trim())
        queryParams.beneficiary_name = filters.beneficiary_name.trim();
      if (filters.min_amount) queryParams.min_amount = filters.min_amount;
      if (filters.max_amount) queryParams.max_amount = filters.max_amount;
      if (filters.start_date) queryParams.start_date = filters.start_date;
      if (filters.end_date) queryParams.end_date = filters.end_date;

      try {
        const res = await api.get("/payment/transfers", { params: queryParams });
        if (res.data?.success) {
          setTransfers(res.data.transfers || []);
          if (res.data.pagination) {
            setPagination({
              page: res.data.pagination.page || targetPage,
              limit: res.data.pagination.limit || targetLimit,
              total: res.data.pagination.total || 0,
              totalPages: res.data.pagination.totalPages || 1
            });
          }
          if (res.data.stats) {
            setStats(res.data.stats);
          }
        }
      } catch (err) {
        console.error("Fetch transfers error:", err);
        setError(
          err.response?.data?.message ||
            "Unable to connect to money transfers database. Please verify backend service."
        );
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.page, pagination.limit]
  );

  // Fetch on mount
  useEffect(() => {
    fetchTransfers(1);
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilters = () => {
    fetchTransfers(1);
  };

  const handleClearFilters = () => {
    const cleared = {
      search: "",
      mode: "all",
      status: "all",
      transfer_id: "",
      user_id: "",
      reference_id: "",
      beneficiary_name: "",
      min_amount: "",
      max_amount: "",
      start_date: "",
      end_date: ""
    };
    setFilters(cleared);
    // Fetch with cleared filters
    setLoading(true);
    api
      .get("/payment/transfers", { params: { page: 1, limit: pagination.limit } })
      .then((res) => {
        if (res.data?.success) {
          setTransfers(res.data.transfers || []);
          if (res.data.pagination) setPagination(res.data.pagination);
          if (res.data.stats) setStats(res.data.stats);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handlePageChange = (newPage) => {
    fetchTransfers(newPage, pagination.limit);
  };

  const handleLimitChange = (newLimit) => {
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
    fetchTransfers(1, newLimit);
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
      {/* 1. Page Header */}
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
              <Send size={22} color="#00D5FF" />
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
                Money Transfer Management
              </h1>
              <p
                style={{
                  fontSize: "13px",
                  color: "#8BA2C1",
                  margin: "4px 0 0 0"
                }}
              >
                Supervise and audit outward remittances across UPI, IMPS, NEFT, and RTGS with live SLA tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Analytics Toggle */}
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
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
            onClick={() => fetchTransfers()}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #087BFF 0%, #00D5FF 100%)",
              border: "none",
              color: "#FFFFFF",
              fontSize: "12.5px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(0, 213, 255, 0.3)"
            }}
            title="Refresh Money Transfers data"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>Refresh Transfers</span>
          </button>
        </div>
      </div>

      {/* 2. Summary Statistics Cards */}
      <TransferStats stats={stats} loading={loading} />

      {/* 3. Analytics Section (Collapsible) */}
      {showAnalytics && <TransferAnalytics onRefreshParent={() => fetchTransfers()} />}

      {/* 4. Advanced Filters Toolbar */}
      <TransfersFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        onRefresh={() => fetchTransfers()}
        loading={loading}
        totalRecords={pagination.total}
      />

      {/* 5. Money Transfer Records Table */}
      <TransfersTable
        transfers={transfers}
        loading={loading}
        error={error}
        pagination={pagination}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onViewDetails={(item) => setSelectedTransfer(item)}
      />

      {/* 6. Transaction Details Drawer (Slide-over Modal) */}
      <TransferDetailsDrawer
        transfer={selectedTransfer}
        isOpen={Boolean(selectedTransfer)}
        onClose={() => setSelectedTransfer(null)}
        onStatusUpdated={() => fetchTransfers()}
      />
    </div>
  );
}
