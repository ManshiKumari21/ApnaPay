import React from "react";
import {
  Smartphone,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Percent,
  Signal,
  ArrowUpRight,
  Zap
} from "lucide-react";

export default function RechargeStats({ stats = {}, loading = false }) {
  const formatINR = (val) => {
    const num = Number(val) || 0;
    return (
      "₹" +
      num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    );
  };

  const statCards = [
    {
      id: "total_orders",
      title: "Total Recharge Orders",
      value: loading ? "..." : (stats.total_orders || 0).toLocaleString(),
      subtitle: "Telecom & DTH order requests",
      icon: Smartphone,
      color: "#087BFF",
      glowColor: "rgba(8, 123, 255, 0.25)",
      bgGradient: "linear-gradient(135deg, rgba(8, 123, 255, 0.12) 0%, rgba(5, 13, 27, 0.6) 100%)",
      badge: "Orders"
    },
    {
      id: "successful_orders",
      title: "Successful Recharges",
      value: loading ? "..." : (stats.successful_orders || 0).toLocaleString(),
      subtitle: `${stats.total_orders > 0 ? (((stats.successful_orders || 0) / stats.total_orders) * 100).toFixed(1) : 100}% fulfillment rate`,
      icon: CheckCircle2,
      color: "#00E599",
      glowColor: "rgba(0, 229, 153, 0.25)",
      bgGradient: "linear-gradient(135deg, rgba(0, 229, 153, 0.12) 0%, rgba(5, 13, 27, 0.6) 100%)",
      badge: "Completed"
    },
    {
      id: "pending_orders",
      title: "Pending Recharges",
      value: loading ? "..." : (stats.pending_orders || 0).toLocaleString(),
      subtitle: "In operator switch processing",
      icon: Clock,
      color: "#FFB020",
      glowColor: "rgba(255, 176, 32, 0.25)",
      bgGradient: "linear-gradient(135deg, rgba(255, 176, 32, 0.12) 0%, rgba(5, 13, 27, 0.6) 100%)",
      badge: "In Flight"
    },
    {
      id: "failed_orders",
      title: "Failed Recharges",
      value: loading ? "..." : (stats.failed_orders || 0).toLocaleString(),
      subtitle: "Operator timeout or circle failure",
      icon: XCircle,
      color: "#FF4D4D",
      glowColor: "rgba(255, 77, 77, 0.25)",
      bgGradient: "linear-gradient(135deg, rgba(255, 77, 77, 0.12) 0%, rgba(5, 13, 27, 0.6) 100%)",
      badge: "Failed"
    },
    {
      id: "total_volume",
      title: "Total Recharge Volume",
      value: loading ? "..." : formatINR(stats.total_volume),
      subtitle: "Settled recharge turnover",
      icon: TrendingUp,
      color: "#00D5FF",
      glowColor: "rgba(0, 213, 255, 0.25)",
      bgGradient: "linear-gradient(135deg, rgba(0, 213, 255, 0.12) 0%, rgba(5, 13, 27, 0.6) 100%)",
      badge: "GMV"
    },
    {
      id: "total_commission",
      title: "Total Commission Earned",
      value: loading ? "..." : formatINR(stats.total_commission),
      subtitle: "Net platform revenue @ 2.5%",
      icon: Percent,
      color: "#A855F7",
      glowColor: "rgba(168, 85, 247, 0.25)",
      bgGradient: "linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(5, 13, 27, 0.6) 100%)",
      badge: "Revenue"
    }
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
        gap: "16px",
        marginBottom: "24px"
      }}
    >
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            style={{
              background: "#071426",
              backgroundImage: card.bgGradient,
              border: "1px solid #16365C",
              borderRadius: "14px",
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.35)",
              position: "relative",
              overflow: "hidden",
              transition: "transform 0.18s ease, border-color 0.18s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.borderColor = card.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "#16365C";
            }}
          >
            {/* Top Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "12px"
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#8BA2C1",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}
                >
                  {card.title}
                </span>
              </div>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  background: card.glowColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${card.color}40`,
                  boxShadow: `0 0 12px ${card.glowColor}`
                }}
              >
                <Icon size={19} color={card.color} />
              </div>
            </div>

            {/* Value Counter */}
            <div>
              <div
                style={{
                  fontSize: "23px",
                  fontWeight: "800",
                  color: "#FFFFFF",
                  letterSpacing: "-0.5px",
                  lineHeight: "1.2"
                }}
              >
                {card.value}
              </div>

              {/* Subtitle with Pill */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "8px",
                  gap: "6px"
                }}
              >
                <span
                  style={{
                    fontSize: "11.5px",
                    color: "#8BA2C1",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}
                >
                  {card.subtitle}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    color: card.color,
                    background: `${card.color}18`,
                    border: `1px solid ${card.color}40`,
                    padding: "1px 6px",
                    borderRadius: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    flexShrink: 0
                  }}
                >
                  {card.badge}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
