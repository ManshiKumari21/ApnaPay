import React, { useEffect, useState, useCallback } from "react";
import {
  Smartphone,
  CheckCircle2,
  XCircle,
  Clock,
  Signal,
  RefreshCw,
  Plus,
  Download,
  Filter,
  BarChart3,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  AlertCircle,
  Layers,
  Zap,
  Activity
} from "lucide-react";
import api from "../services/api";
import RechargeStats from "../components/recharge/RechargeStats";
import OperatorGatewayTable from "../components/recharge/OperatorGatewayTable";
import RechargeOrdersTable from "../components/recharge/RechargeOrdersTable";
import RechargePlansCatalog from "../components/recharge/RechargePlansCatalog";
import RechargeFilterBar from "../components/recharge/RechargeFilterBar";
import RechargeAnalytics from "../components/recharge/RechargeAnalytics";
import RechargeDetailsModal from "../components/recharge/RechargeDetailsModal";

export default function RechargeManagement() {
  const [data, setData] = useState({
    stats: {
      total_orders: 0,
      successful_orders: 0,
      pending_orders: 0,
      failed_orders: 0,
      total_volume: 0,
      total_commission: 0
    },
    operators: [],
    recharge_orders: [],
    plans: [],
    analytics: {
      dailyVolume: [],
      weeklyVolume: [],
      monthlyVolume: [],
      operatorDistribution: [],
      successVsFailed: { successful: 0, pending: 0, failed: 0 },
      commissionAnalytics: { totalCommission: 0, avgRate: "2.5%", topEarningOperator: "Reliance Jio" }
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'orders', 'gateways', 'plans'

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Filters state
  const [filters, setFilters] = useState({
    search: "",
    operator_id: "all",
    service_type: "all",
    status: "all",
    min_amount: "",
    max_amount: "",
    start_date: "",
    end_date: "",
    range: "30d"
  });

  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const fetchRechargeData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.search?.trim()) params.search = filters.search.trim();
      if (filters.operator_id && filters.operator_id !== "all") params.operator_id = filters.operator_id;
      if (filters.service_type && filters.service_type !== "all") params.service_type = filters.service_type;
      if (filters.status && filters.status !== "all") params.status = filters.status;
      if (filters.min_amount) params.min_amount = filters.min_amount;
      if (filters.max_amount) params.max_amount = filters.max_amount;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.range) params.range = filters.range;
      if (filters.range === "custom" && customStart && customEnd) {
        params.start_date = customStart;
        params.end_date = customEnd;
      }

      // Try primary admin endpoint first, then fallback to public overview alias
      let res;
      try {
        res = await api.get("/admin/recharge", { params });
      } catch (_) {
        res = await api.get("/recharge/admin/overview", { params });
      }

      if (res.data?.success) {
        setData({
          stats: res.data.stats || data.stats,
          operators: res.data.operators || [],
          recharge_orders: res.data.recharge_orders || [],
          plans: res.data.plans || [],
          analytics: res.data.analytics || data.analytics
        });
      }
    } catch (err) {
      console.error("Fetch Recharge error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load recharge management records from backend. Please verify database connection."
      );
    } finally {
      setLoading(false);
    }
  }, [filters, customStart, customEnd]);

  useEffect(() => {
    fetchRechargeData();
  }, [filters.range]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilters = () => {
    fetchRechargeData();
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      operator_id: "all",
      service_type: "all",
      status: "all",
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
      .get("/admin/recharge")
      .then((res) => {
        if (res.data?.success) {
          setData(res.data);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  const handleUpdateOperatorStatus = async (op, newStatus) => {
    try {
      const res = await api.patch(`/admin/recharge/operator/${op.id}/status`, {
        status: newStatus
      });
      if (res.data?.success) {
        fetchRechargeData();
      }
    } catch (err) {
      alert("Failed to update operator status: " + (err.response?.data?.message || err.message));
    }
  };

  const handleViewOperatorPlans = (op) => {
    setActiveTab("plans");
  };

  const handleFilterPending = () => {
    setFilters((prev) => ({
      ...prev,
      status: "pending"
    }));
    setActiveTab("orders");
    fetchRechargeData();
  };

  // CSV Report Generator
  const handleExportCsv = () => {
    const rows = [
      [
        "Order ID",
        "User ID",
        "Customer Name",
        "Mobile Number",
        "Operator",
        "Service Type",
        "Amount (INR)",
        "Commission (INR)",
        "Transaction ID",
        "Status",
        "Date Time"
      ]
    ];

    data.recharge_orders.forEach((o) => {
      rows.push([
        o.id,
        o.user_id,
        o.user_name || "",
        o.mobile_number,
        o.operator_name,
        o.service_type,
        o.amount,
        o.commission,
        o.transaction_id || "",
        o.status,
        new Date(o.created_at).toISOString()
      ]);
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ApnaPay-Recharge-Report-${new Date().toISOString().slice(0, 10)}.csv`);
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
              <Smartphone size={22} color="#00D5FF" />
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
                Module 10: Recharge Management
              </h1>
              <p
                style={{
                  fontSize: "13px",
                  color: "#8BA2C1",
                  margin: "4px 0 0 0"
                }}
              >
                Supervise telecom & DTH operator gateways, browse tariff catalogs, track recharge fulfillment and commission revenue.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Header Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
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
            title="Download recharge transactions CSV report"
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
            onClick={fetchRechargeData}
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
            title="Refresh Recharge Data"
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
      <RechargeStats stats={data.stats} loading={loading} />

      {/* 4. Quick Actions / Navigation Strip */}
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
          Module Views:
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
          Overview & All Tables
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          style={{
            padding: "5px 12px",
            borderRadius: "6px",
            background: activeTab === "orders" ? "#087BFF" : "#071426",
            border: activeTab === "orders" ? "1px solid #00D5FF" : "1px solid #16365C",
            color: activeTab === "orders" ? "#FFFFFF" : "#8BA2C1",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          Recharge Orders ({data.recharge_orders?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("gateways")}
          style={{
            padding: "5px 12px",
            borderRadius: "6px",
            background: activeTab === "gateways" ? "#087BFF" : "#071426",
            border: activeTab === "gateways" ? "1px solid #00D5FF" : "1px solid #16365C",
            color: activeTab === "gateways" ? "#FFFFFF" : "#8BA2C1",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          Operator Gateways ({data.operators?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("plans")}
          style={{
            padding: "5px 12px",
            borderRadius: "6px",
            background: activeTab === "plans" ? "#087BFF" : "#071426",
            border: activeTab === "plans" ? "1px solid #00D5FF" : "1px solid #16365C",
            color: activeTab === "plans" ? "#FFFFFF" : "#8BA2C1",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          Plan Catalog ({data.plans?.length || 0})
        </button>

        <button
          onClick={handleFilterPending}
          style={{
            padding: "5px 12px",
            borderRadius: "6px",
            background: filters.status === "pending" ? "#FFB020" : "#071426",
            border: filters.status === "pending" ? "1px solid #FFAA00" : "1px solid #16365C",
            color: filters.status === "pending" ? "#050D1B" : "#FFB020",
            fontSize: "12px",
            fontWeight: "700",
            cursor: "pointer"
          }}
        >
          View Pending ({data.stats?.pending_orders || 0})
        </button>
      </div>

      {/* 5. Recharge Analytics Section (Collapsible) */}
      {showAnalytics && (
        <RechargeAnalytics
          analytics={data.analytics}
          range={filters.range}
          onRangeChange={(r) => handleFilterChange("range", r)}
          customStart={customStart}
          customEnd={customEnd}
          onCustomStartChange={setCustomStart}
          onCustomEndChange={setCustomEnd}
          onApplyCustomRange={fetchRechargeData}
          onRefresh={fetchRechargeData}
          loading={loading}
        />
      )}

      {/* 6. Universal Search & Filter Bar */}
      <RechargeFilterBar
        filters={filters}
        operators={data.operators}
        onFilterChange={handleFilterChange}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        onRefresh={fetchRechargeData}
        loading={loading}
        totalOrders={data.recharge_orders?.length || 0}
      />

      {/* 7. Operator Gateway Status Table */}
      {(activeTab === "all" || activeTab === "gateways") && (
        <OperatorGatewayTable
          operators={data.operators}
          loading={loading}
          onRefresh={fetchRechargeData}
          onUpdateStatus={handleUpdateOperatorStatus}
          onViewOperatorPlans={handleViewOperatorPlans}
        />
      )}

      {/* 8. Recharge Orders Management Table */}
      {(activeTab === "all" || activeTab === "orders") && (
        <RechargeOrdersTable
          orders={data.recharge_orders}
          loading={loading}
          onViewOrder={(order) => setSelectedOrder(order)}
        />
      )}

      {/* 9. Recharge Plans Catalog Section */}
      {(activeTab === "all" || activeTab === "plans") && (
        <RechargePlansCatalog
          plans={data.plans}
          loading={loading}
        />
      )}

      {/* 10. Recharge Details Modal */}
      <RechargeDetailsModal
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}
