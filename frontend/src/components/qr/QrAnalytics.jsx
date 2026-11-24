import React, { useState } from "react";
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Store,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ArrowRight
} from "lucide-react";

export default function QrAnalytics({
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
      ? analytics?.dailyCollection || []
      : activeChart === "weekly"
      ? analytics?.weeklyCollection || []
      : analytics?.monthlyCollection || [];

  const maxVolume = Math.max(...chartData.map((d) => Number(d.amount || 0)), 1000);

  const typeUsage = analytics?.typeUsage || [
    { type: "STATIC", qr_count: 7, scan_count: 14, total_amount: 22000 },
    { type: "DYNAMIC", qr_count: 5, scan_count: 4, total_amount: 6920 }
  ];

  const totalTypeAmount = typeUsage.reduce((acc, t) => acc + Number(t.total_amount || 0), 0) || 1;

  const topMerchants = analytics?.merchantCollection || [
    { merchant_name: "Manshi", paid_count: 4, collection_amount: 6200 },
    { merchant_name: "Amit Kumar Verma", paid_count: 3, collection_amount: 6050 },
    { merchant_name: "Gopal Parmar", paid_count: 2, collection_amount: 8600 },
    { merchant_name: "Priya Patel", paid_count: 3, collection_amount: 4670 }
  ];

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
            <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>
              QR Payment Analytics & Insights
            </h3>
            <p style={{ fontSize: "12px", color: "#8BA2C1", margin: "2px 0 0 0" }}>
              Collection volumes, static vs dynamic distribution, and merchant rankings
            </p>
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
              onClick={() => onRangeChange(btn.id)}
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

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              style={{
                padding: "6px 10px",
                borderRadius: "8px",
                background: "#0B1D35",
                border: "1px solid #16365C",
                color: "#00D5FF",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              title="Refresh analytics"
            >
              <RefreshCw size={14} className={loading ? "spin" : ""} />
            </button>
          )}
        </div>
      </div>

      {/* Custom Date Pickers */}
      {range === "custom" && (
        <div
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
              onChange={(e) => onCustomStartChange(e.target.value)}
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
              onChange={(e) => onCustomEndChange(e.target.value)}
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
            onClick={onApplyCustomRange}
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
        </div>
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
        {/* 1. Collection Volume Charts (Daily / Weekly / Monthly) */}
        <div
          style={{
            background: "#0B1D35",
            border: "1px solid #16365C",
            borderRadius: "12px",
            padding: "20px",
            gridColumn: "span 2",
            minHeight: "300px",
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
                QR Collection Volume Trends
              </div>
              <div style={{ color: "#8BA2C1", fontSize: "12px" }}>
                Paid settlement volume across merchant QR codes
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

          {/* SVG Bars Visualization */}
          {chartData.length === 0 ? (
            <div
              style={{
                height: "180px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#627B9B",
                fontSize: "13px"
              }}
            >
              No QR collection volume recorded for this time range.
            </div>
          ) : (
            <div style={{ height: "180px", display: "flex", alignItems: "flex-end", gap: "10px", padding: "10px 0" }}>
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
                      minWidth: "28px"
                    }}
                    title={`${label}: ${formatINR(amt)} (${item.count || 0} scans)`}
                  >
                    <div style={{ fontSize: "10px", color: "#00D5FF", fontWeight: "700", marginBottom: "4px" }}>
                      {formatINR(amt)}
                    </div>
                    <div
                      style={{
                        width: "100%",
                        maxWidth: "34px",
                        height: `${heightPct}%`,
                        background: "linear-gradient(180deg, #00D5FF 0%, #087BFF 100%)",
                        borderRadius: "6px 6px 2px 2px",
                        boxShadow: "0 4px 12px rgba(0, 213, 255, 0.2)",
                        transition: "height 0.4s ease"
                      }}
                    />
                    <div
                      style={{
                        fontSize: "10.5px",
                        color: "#8BA2C1",
                        marginTop: "6px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "44px"
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

        {/* 2. Static vs Dynamic QR Usage */}
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
              Static vs Dynamic QRs
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
              QR Architecture
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {typeUsage.map((item) => {
              const isStatic = item.type.toUpperCase() === "STATIC";
              const color = isStatic ? "#087BFF" : "#00D5FF";
              const pct = Number(((Number(item.total_amount || 0) / totalTypeAmount) * 100).toFixed(1));

              return (
                <div key={item.type}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: "6px" }}>
                    <div>
                      <span style={{ color: "#FFFFFF", fontWeight: "700" }}>
                        {isStatic ? "Merchant Static QRs" : "Dynamic Invoice QRs"}
                      </span>
                      <div style={{ color: "#8BA2C1", fontSize: "11px" }}>
                        {item.qr_count} registered • {item.scan_count} scan attempts
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: color, fontWeight: "700" }}>{formatINR(item.total_amount)}</div>
                      <div style={{ color: "#8BA2C1", fontSize: "11px" }}>{pct}% volume</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: "6px", width: "100%", background: "#071426", borderRadius: "3px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: color,
                        borderRadius: "3px",
                        boxShadow: `0 0 8px ${color}66`,
                        transition: "width 0.5s ease"
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Merchant-wise QR Collection */}
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
              Top Merchant Collections
            </div>
            <Store size={16} color="#087BFF" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {topMerchants.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  background: "#071426",
                  borderRadius: "8px",
                  border: "1px solid #16365C"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: idx === 0 ? "rgba(0, 229, 153, 0.2)" : "rgba(8, 123, 255, 0.2)",
                      color: idx === 0 ? "#00E599" : "#087BFF",
                      fontSize: "11px",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    #{idx + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#FFFFFF" }}>
                      {m.merchant_name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#8BA2C1" }}>
                      {m.paid_count} settled transactions
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: "13px", fontWeight: "700", color: "#00D5FF" }}>
                  {formatINR(m.collection_amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
