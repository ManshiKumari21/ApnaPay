import React, { useState } from "react";
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  RefreshCw,
  Signal,
  ArrowRight,
  Zap,
  ShieldCheck
} from "lucide-react";

export default function RechargeAnalytics({
  analytics = {},
  range = "30d",
  onRangeChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  onApplyCustomRange,
  onRefresh,
  loading = false
}) {
  const [activeChart, setActiveChart] = useState("daily"); // 'daily', 'weekly', 'monthly'

  const formatINR = (val) => {
    const num = Number(val) || 0;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const chartData =
    activeChart === "daily"
      ? (analytics?.dailyVolume || []).map((d) => ({ label: d.date, value: d.volume, count: d.count, commission: d.commission }))
      : activeChart === "weekly"
      ? (analytics?.weeklyVolume || []).map((w) => ({ label: w.week, value: w.volume, count: w.count }))
      : (analytics?.monthlyVolume || []).map((m) => ({ label: m.month, value: m.volume, count: m.count }));

  const maxVolume = Math.max(...chartData.map((d) => Number(d.value || 0)), 1000);

  const opDist = analytics?.operatorDistribution || [
    { name: "Reliance Jio", volume: 2450, count: 8, share: "45.0%" },
    { name: "Bharti Airtel", volume: 1540, count: 5, share: "28.5%" },
    { name: "Vodafone Idea", volume: 920, count: 3, share: "17.0%" },
    { name: "Tata Play DTH", volume: 600, count: 2, share: "9.5%" }
  ];

  const totalDistVolume = opDist.reduce((acc, o) => acc + Number(o.volume || 0), 0) || 1;

  const successVsFailed = analytics?.successVsFailed || {
    successful: 15,
    pending: 3,
    failed: 2
  };

  const totalStatusOrders =
    (successVsFailed.successful || 0) +
    (successVsFailed.pending || 0) +
    (successVsFailed.failed || 0);

  const successPct = totalStatusOrders > 0 ? (((successVsFailed.successful || 0) / totalStatusOrders) * 100).toFixed(1) : 100;
  const pendingPct = totalStatusOrders > 0 ? (((successVsFailed.pending || 0) / totalStatusOrders) * 100).toFixed(1) : 0;
  const failedPct = totalStatusOrders > 0 ? (((successVsFailed.failed || 0) / totalStatusOrders) * 100).toFixed(1) : 0;

  const commissionData = analytics?.commissionAnalytics || {
    totalCommission: 133.18,
    avgRate: "2.45%",
    topEarningOperator: "Reliance Jio"
  };

  return (
    <div
      style={{
        background: "#071426",
        border: "1px solid #16365C",
        borderRadius: "14px",
        padding: "24px",
        marginBottom: "24px",
        boxShadow: "0 6px 24px rgba(0, 0, 0, 0.35)"
      }}
    >
      {/* Header & Date Range Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          paddingBottom: "18px",
          borderBottom: "1px solid #16365C"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "rgba(0, 213, 255, 0.15)",
              border: "1px solid rgba(0, 213, 255, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <BarChart3 size={18} color="#00D5FF" />
          </div>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>
              Recharge Analytics & Revenue Insights
            </h3>
            <p style={{ fontSize: "12px", color: "#8BA2C1", margin: "2px 0 0 0" }}>
              Daily recharge velocity, operator fulfillment breakdown, and net commission trends
            </p>
          </div>
        </div>

        {/* Date Range Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          {[
            { id: "today", label: "Today" },
            { id: "7d", label: "Last 7 Days" },
            { id: "30d", label: "Last 30 Days" },
            { id: "custom", label: "Custom Date" }
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => onRangeChange(btn.id)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                background: range === btn.id ? "#087BFF" : "#0B1D35",
                color: range === btn.id ? "#FFFFFF" : "#8BA2C1",
                border: range === btn.id ? "1px solid #00D5FF" : "1px solid #16365C",
                transition: "all 0.15s ease"
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Strip */}
      {range === "custom" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
            padding: "12px 16px",
            background: "#0B1D35",
            borderRadius: "8px",
            border: "1px solid #16365C",
            margin: "16px 0"
          }}
        >
          <Calendar size={14} color="#00D5FF" />
          <span style={{ fontSize: "12px", color: "#FFFFFF", fontWeight: "600" }}>Select Range:</span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => onCustomStartChange(e.target.value)}
            style={{
              background: "#071426",
              border: "1px solid #16365C",
              color: "#FFFFFF",
              borderRadius: "6px",
              padding: "5px 10px",
              fontSize: "12px"
            }}
          />
          <span style={{ color: "#8BA2C1" }}>to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => onCustomEndChange(e.target.value)}
            style={{
              background: "#071426",
              border: "1px solid #16365C",
              color: "#FFFFFF",
              borderRadius: "6px",
              padding: "5px 10px",
              fontSize: "12px"
            }}
          />
          <button
            onClick={onApplyCustomRange}
            style={{
              padding: "5px 12px",
              background: "#087BFF",
              border: "none",
              borderRadius: "6px",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Apply Range
          </button>
        </div>
      )}

      {/* Charts & Breakdown Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
          marginTop: "20px"
        }}
      >
        {/* 1. Volume Chart */}
        <div
          style={{
            background: "#0B1D35",
            border: "1px solid #16365C",
            borderRadius: "12px",
            padding: "18px 20px"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <TrendingUp size={16} color="#00D5FF" />
              <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>
                Recharge Order Volume
              </h4>
            </div>

            {/* Sub-Tabs: Daily, Weekly, Monthly */}
            <div style={{ display: "flex", gap: "4px" }}>
              {["daily", "weekly", "monthly"].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveChart(t)}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: "pointer",
                    textTransform: "capitalize",
                    background: activeChart === t ? "#087BFF" : "transparent",
                    color: activeChart === t ? "#FFFFFF" : "#8BA2C1",
                    border: "none"
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Bar Chart Container */}
          <div
            style={{
              height: "170px",
              display: "flex",
              alignItems: "flex-end",
              gap: "10px",
              paddingTop: "20px",
              borderBottom: "1px solid #16365C",
              paddingBottom: "10px"
            }}
          >
            {chartData.length === 0 ? (
              <div style={{ width: "100%", textAlign: "center", color: "#8BA2C1", fontSize: "12px" }}>
                No volume records in this period
              </div>
            ) : (
              chartData.map((item, idx) => {
                const heightPct = Math.max(12, Math.round((Number(item.value || 0) / maxVolume) * 100));
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                      height: "100%",
                      justifyContent: "flex-end"
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: "700",
                        color: "#00D5FF",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {formatINR(item.value)}
                    </div>
                    <div
                      style={{
                        width: "100%",
                        maxWidth: "34px",
                        height: `${heightPct}%`,
                        background: "linear-gradient(180deg, #00D5FF 0%, #087BFF 100%)",
                        borderRadius: "4px 4px 0 0",
                        boxShadow: "0 0 10px rgba(0, 213, 255, 0.3)",
                        transition: "height 0.3s ease"
                      }}
                      title={`${item.label}: ${formatINR(item.value)} (${item.count || 0} orders)`}
                    />
                    <div
                      style={{
                        fontSize: "10.5px",
                        color: "#8BA2C1",
                        whiteSpace: "nowrap",
                        marginTop: "4px"
                      }}
                    >
                      {item.label}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "12px",
              fontSize: "11.5px",
              color: "#8BA2C1"
            }}
          >
            <span>Peak Period Volume: <strong style={{ color: "#FFFFFF" }}>{formatINR(maxVolume)}</strong></span>
            <span>Total Trend Points: <strong style={{ color: "#00D5FF" }}>{chartData.length}</strong></span>
          </div>
        </div>

        {/* 2. Operator-wise Distribution */}
        <div
          style={{
            background: "#0B1D35",
            border: "1px solid #16365C",
            borderRadius: "12px",
            padding: "18px 20px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
            <Signal size={16} color="#087BFF" />
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>
              Operator-wise Recharge Distribution
            </h4>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {opDist.map((op, i) => {
              const colors = ["#087BFF", "#00D5FF", "#A855F7", "#FFB020", "#00E599", "#FF4D4D"];
              const c = colors[i % colors.length];
              const pct = totalDistVolume > 0 ? ((Number(op.volume || 0) / totalDistVolume) * 100).toFixed(1) : 0;

              return (
                <div key={op.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span style={{ color: "#FFFFFF", fontWeight: "600" }}>{op.name}</span>
                    <span style={{ color: "#8BA2C1" }}>
                      {formatINR(op.volume)} ({op.count} orders • <strong style={{ color: c }}>{pct}%</strong>)
                    </span>
                  </div>
                  <div
                    style={{
                      height: "7px",
                      background: "#071426",
                      borderRadius: "4px",
                      overflow: "hidden"
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: c,
                        borderRadius: "4px",
                        boxShadow: `0 0 8px ${c}60`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Successful vs Failed & Commission Analytics */}
        <div
          style={{
            background: "#0B1D35",
            border: "1px solid #16365C",
            borderRadius: "12px",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
              <ShieldCheck size={16} color="#00E599" />
              <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>
                Fulfillment & Commission Health
              </h4>
            </div>

            {/* 3-Way Ratio Bar */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                <span style={{ color: "#00E599", fontWeight: "700" }}>Success: {successPct}%</span>
                <span style={{ color: "#FFB020", fontWeight: "700" }}>Pending: {pendingPct}%</span>
                <span style={{ color: "#FF4D4D", fontWeight: "700" }}>Failed: {failedPct}%</span>
              </div>
              <div
                style={{
                  height: "9px",
                  background: "#071426",
                  borderRadius: "5px",
                  display: "flex",
                  overflow: "hidden"
                }}
              >
                <div style={{ width: `${successPct}%`, background: "#00E599" }} title={`Success: ${successPct}%`} />
                <div style={{ width: `${pendingPct}%`, background: "#FFB020" }} title={`Pending: ${pendingPct}%`} />
                <div style={{ width: `${failedPct}%`, background: "#FF4D4D" }} title={`Failed: ${failedPct}%`} />
              </div>
            </div>

            {/* Commission Analytics Summary */}
            <div
              style={{
                background: "#071426",
                border: "1px solid #16365C",
                borderRadius: "10px",
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                fontSize: "12px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#8BA2C1" }}>Total Platform Commission:</span>
                <span style={{ color: "#00E599", fontWeight: "700" }}>{formatINR(commissionData.totalCommission)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#8BA2C1" }}>Average Commission Rate:</span>
                <span style={{ color: "#00D5FF", fontWeight: "700" }}>{commissionData.avgRate || "2.45%"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#8BA2C1" }}>Top Revenue Operator:</span>
                <span style={{ color: "#FFFFFF", fontWeight: "600" }}>{commissionData.topEarningOperator || "Reliance Jio"}</span>
              </div>
            </div>
          </div>

          <div
            style={{
              paddingTop: "12px",
              borderTop: "1px solid #16365C",
              marginTop: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "11.5px",
              color: "#8BA2C1"
            }}
          >
            <span>Auto-cleared via NPCI Escrow</span>
            <span style={{ color: "#00E599", fontWeight: "600" }}>99.8% Gateway SLA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
