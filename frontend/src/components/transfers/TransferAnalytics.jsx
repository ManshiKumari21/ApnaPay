import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Calendar,
  PieChart,
  TrendingUp,
  Percent,
  Coins,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Layers,
  ArrowRight
} from "lucide-react";
import api from "../../services/api";

export default function TransferAnalytics({ onRefreshParent }) {
  const [range, setRange] = useState("30d"); // 'today', '7d', '30d', 'custom'
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [activeChart, setActiveChart] = useState("daily"); // 'daily', 'weekly', 'monthly'
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = { range };
      if (range === "custom" && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }

      // Try /payment/transfers/analytics or /admin/transfers/analytics
      const res = await api.get("/payment/transfers/analytics", { params });
      if (res.data?.success && res.data?.analytics) {
        setAnalytics(res.data.analytics);
      }
    } catch (err) {
      console.error("Fetch analytics error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const handleApplyCustomDate = (e) => {
    e.preventDefault();
    if (customStart && customEnd) {
      fetchAnalytics();
    }
  };

  const formatINR = (val) => {
    const num = Number(val) || 0;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
    return `₹${num.toLocaleString("en-IN")}`;
  };

  // Extract chart data
  const chartData =
    activeChart === "daily"
      ? analytics?.dailyVolume || []
      : activeChart === "weekly"
      ? analytics?.weeklyVolume || []
      : analytics?.monthlyVolume || [];

  const maxVolume = Math.max(...chartData.map((d) => Number(d.amount || 0)), 1000);

  const modeDistribution = analytics?.modeDistribution || [
    { mode: "UPI", count: 9, amount: 28750, fee: 0, percentage: 45 },
    { mode: "IMPS", count: 5, amount: 117600, fee: 28.6, percentage: 25 },
    { mode: "RTGS", count: 3, amount: 620000, fee: 88.5, percentage: 15 },
    { mode: "NEFT", count: 3, amount: 137000, fee: 7.5, percentage: 15 }
  ];

  const successVsFailed = analytics?.successVsFailed || {
    successful: 12,
    failed: 3,
    reversed: 2,
    pending: 3,
    successRate: 70.6
  };

  const feeRevenue = analytics?.feeRevenue || {
    totalFee: 124.6,
    avgFee: 6.23,
    topModeByFee: "RTGS"
  };

  const modeColors = {
    UPI: { color: "#00D5FF", bg: "rgba(0, 213, 255, 0.15)" },
    IMPS: { color: "#087BFF", bg: "rgba(8, 123, 255, 0.15)" },
    NEFT: { color: "#F59E0B", bg: "rgba(245, 158, 11, 0.15)" },
    RTGS: { color: "#A855F7", bg: "rgba(168, 85, 247, 0.15)" }
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
      {/* Header & Date Range Filter Toolbar */}
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
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "rgba(8, 123, 255, 0.15)",
                border: "1px solid rgba(8, 123, 255, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <BarChart3 size={18} color="#00D5FF" />
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>
                Money Transfer Analytics & Performance
              </h3>
              <p style={{ fontSize: "12px", color: "#8BA2C1", margin: "2px 0 0 0" }}>
                Real-time volume trends, mode distributions, and settlement SLA diagnostics
              </p>
            </div>
          </div>
        </div>

        {/* Date Filter Buttons */}
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          {[
            { id: "today", label: "Today" },
            { id: "7d", label: "Last 7 Days" },
            { id: "30d", label: "Last 30 Days" },
            { id: "custom", label: "Custom Date" }
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setRange(btn.id)}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                background: range === btn.id ? "linear-gradient(135deg, #087BFF, #00D5FF)" : "#0B1D35",
                color: range === btn.id ? "#FFFFFF" : "#8BA2C1",
                border: range === btn.id ? "1px solid #00D5FF" : "1px solid #16365C",
                boxShadow: range === btn.id ? "0 2px 10px rgba(0, 213, 255, 0.3)" : "none",
                transition: "all 0.2s ease"
              }}
            >
              {btn.label}
            </button>
          ))}

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              background: "#0B1D35",
              border: "1px solid #16365C",
              color: "#8BA2C1",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Refresh analytics data"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} color="#00D5FF" />
          </button>
        </div>
      </div>

      {/* Custom Date Pickers */}
      {range === "custom" && (
        <form
          onSubmit={handleApplyCustomDate}
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginTop: "14px",
            padding: "12px 16px",
            background: "#0B1D35",
            border: "1px solid #16365C",
            borderRadius: "10px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Calendar size={14} color="#00D5FF" />
            <span style={{ fontSize: "12px", color: "#8BA2C1", fontWeight: "600" }}>Start Date:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              style={{
                background: "#071426",
                border: "1px solid #16365C",
                borderRadius: "6px",
                color: "#FFFFFF",
                padding: "4px 8px",
                fontSize: "12px"
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Calendar size={14} color="#00D5FF" />
            <span style={{ fontSize: "12px", color: "#8BA2C1", fontWeight: "600" }}>End Date:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              style={{
                background: "#071426",
                border: "1px solid #16365C",
                borderRadius: "6px",
                color: "#FFFFFF",
                padding: "4px 8px",
                fontSize: "12px"
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: "5px 14px",
              borderRadius: "6px",
              background: "#087BFF",
              color: "#FFFFFF",
              border: "none",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Apply Range
          </button>
        </form>
      )}

      {/* Analytics Main Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
          marginTop: "20px"
        }}
      >
        {/* 1. Volume Charts (Daily / Weekly / Monthly) */}
        <div
          style={{
            background: "#0B1D35",
            border: "1px solid #16365C",
            borderRadius: "12px",
            padding: "20px",
            gridColumn: "span 2",
            minHeight: "310px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "16px"
            }}
          >
            <div>
              <div style={{ color: "#FFFFFF", fontSize: "15px", fontWeight: "700" }}>
                Transfer Remittance Volume
              </div>
              <div style={{ color: "#8BA2C1", fontSize: "12px" }}>
                Total gross processed volume across selected time period
              </div>
            </div>

            {/* Toggle chart interval */}
            <div
              style={{
                display: "flex",
                background: "#071426",
                padding: "3px",
                borderRadius: "8px",
                border: "1px solid #16365C"
              }}
            >
              {[
                { id: "daily", label: "Daily" },
                { id: "weekly", label: "Weekly" },
                { id: "monthly", label: "Monthly" }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveChart(t.id)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "700",
                    background: activeChart === t.id ? "#087BFF" : "transparent",
                    color: activeChart === t.id ? "#FFFFFF" : "#8BA2C1",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Visual Bars */}
          {chartData.length === 0 ? (
            <div
              style={{
                height: "190px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#627B9B",
                fontSize: "13px"
              }}
            >
              No transfer volume recorded for this time range.
            </div>
          ) : (
            <div style={{ height: "190px", display: "flex", alignItems: "flex-end", gap: "12px", padding: "10px 0" }}>
              {chartData.map((item, idx) => {
                const amt = Number(item.amount || 0);
                const heightPct = Math.max(12, Math.min(100, (amt / maxVolume) * 100));
                const label = item.date ? item.date.slice(5) : item.week || item.month || `P${idx + 1}`;

                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      height: "100%",
                      justifyContent: "flex-end",
                      minWidth: "30px"
                    }}
                    title={`${label}: ${formatINR(amt)} (${item.count || 0} transfers)`}
                  >
                    <div style={{ fontSize: "10px", color: "#00D5FF", fontWeight: "700", marginBottom: "4px" }}>
                      {formatINR(amt)}
                    </div>
                    <div
                      style={{
                        width: "100%",
                        maxWidth: "38px",
                        height: `${heightPct}%`,
                        background: "linear-gradient(180deg, #00D5FF 0%, #087BFF 100%)",
                        borderRadius: "6px 6px 2px 2px",
                        boxShadow: "0 4px 12px rgba(0, 213, 255, 0.2)",
                        transition: "height 0.4s ease"
                      }}
                    />
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#8BA2C1",
                        marginTop: "6px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "48px"
                      }}
                    >
                      {label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Mode-wise Distribution */}
        <div
          style={{
            background: "#0B1D35",
            border: "1px solid #16365C",
            borderRadius: "12px",
            padding: "20px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ color: "#FFFFFF", fontSize: "15px", fontWeight: "700" }}>
              Mode Distribution
            </div>
            <span
              style={{
                fontSize: "11px",
                color: "#00D5FF",
                background: "rgba(0, 213, 255, 0.12)",
                padding: "2px 8px",
                borderRadius: "6px",
                fontWeight: "700"
              }}
            >
              Supported Modes
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {modeDistribution.map((m) => {
              const theme = modeColors[m.mode] || { color: "#087BFF", bg: "rgba(8, 123, 255, 0.15)" };
              return (
                <div key={m.mode}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: theme.color
                        }}
                      />
                      <span style={{ color: "#FFFFFF", fontWeight: "700" }}>{m.mode}</span>
                      <span style={{ color: "#8BA2C1", fontSize: "11px" }}>({m.count} txns)</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "#E2EDF8", fontWeight: "600" }}>{formatINR(m.amount)}</span>
                      <span style={{ color: theme.color, fontWeight: "700", minWidth: "36px", textAlign: "right" }}>
                        {m.percentage}%
                      </span>
                    </div>
                  </div>
                  {/* Progress track */}
                  <div style={{ height: "6px", width: "100%", background: "#071426", borderRadius: "3px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${m.percentage}%`,
                        background: theme.color,
                        borderRadius: "3px",
                        boxShadow: `0 0 8px ${theme.color}66`,
                        transition: "width 0.5s ease"
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Successful vs Failed Transfers */}
        <div
          style={{
            background: "#0B1D35",
            border: "1px solid #16365C",
            borderRadius: "12px",
            padding: "20px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ color: "#FFFFFF", fontSize: "15px", fontWeight: "700" }}>
              Settlement SLA & Health
            </div>
            <span
              style={{
                fontSize: "11px",
                color: successVsFailed.successRate >= 80 ? "#00E599" : "#F59E0B",
                background: successVsFailed.successRate >= 80 ? "rgba(0, 229, 153, 0.12)" : "rgba(245, 158, 11, 0.12)",
                padding: "2px 8px",
                borderRadius: "6px",
                fontWeight: "700"
              }}
            >
              {successVsFailed.successRate}% Success Rate
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px" }}>
            <div
              style={{
                background: "#071426",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid rgba(0, 229, 153, 0.25)"
              }}
            >
              <div style={{ color: "#8BA2C1", fontSize: "11px" }}>Successful</div>
              <div style={{ color: "#00E599", fontSize: "20px", fontWeight: "800", marginTop: "2px" }}>
                {successVsFailed.successful}
              </div>
            </div>

            <div
              style={{
                background: "#071426",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 77, 77, 0.25)"
              }}
            >
              <div style={{ color: "#8BA2C1", fontSize: "11px" }}>Failed / Cancelled</div>
              <div style={{ color: "#FF4D4D", fontSize: "20px", fontWeight: "800", marginTop: "2px" }}>
                {successVsFailed.failed}
              </div>
            </div>

            <div
              style={{
                background: "#071426",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid rgba(245, 158, 11, 0.25)"
              }}
            >
              <div style={{ color: "#8BA2C1", fontSize: "11px" }}>Pending / Queue</div>
              <div style={{ color: "#F59E0B", fontSize: "20px", fontWeight: "800", marginTop: "2px" }}>
                {successVsFailed.pending}
              </div>
            </div>

            <div
              style={{
                background: "#071426",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid rgba(168, 85, 247, 0.25)"
              }}
            >
              <div style={{ color: "#8BA2C1", fontSize: "11px" }}>Reversed</div>
              <div style={{ color: "#A855F7", fontSize: "20px", fontWeight: "800", marginTop: "2px" }}>
                {successVsFailed.reversed}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Transfer Fee Revenue */}
        <div
          style={{
            background: "#0B1D35",
            border: "1px solid #16365C",
            borderRadius: "12px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ color: "#FFFFFF", fontSize: "15px", fontWeight: "700" }}>
                Fee Revenue & Yield
              </div>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  background: "rgba(168, 85, 247, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Coins size={15} color="#A855F7" />
              </div>
            </div>

            <div style={{ color: "#8BA2C1", fontSize: "12px" }}>
              Total remittance commission collected from outward IMPS/RTGS/NEFT switches
            </div>

            <div
              style={{
                color: "#FFFFFF",
                fontSize: "26px",
                fontWeight: "800",
                marginTop: "12px",
                fontFamily: "system-ui"
              }}
            >
              ₹{Number(feeRevenue.totalFee || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div
            style={{
              marginTop: "16px",
              padding: "10px 14px",
              background: "#071426",
              borderRadius: "8px",
              border: "1px solid #16365C",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <div style={{ fontSize: "10px", color: "#8BA2C1", textTransform: "uppercase" }}>Avg Fee / Txn</div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#00D5FF" }}>
                ₹{Number(feeRevenue.avgFee || 0).toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "#8BA2C1", textTransform: "uppercase" }}>Top Earner</div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#A855F7" }}>
                {feeRevenue.topModeByFee} Switch
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
