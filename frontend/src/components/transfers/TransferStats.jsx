import React from "react";
import {
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Percent,
  Coins,
  ArrowUpRight
} from "lucide-react";

export default function TransferStats({ stats = {}, loading = false }) {
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
      id: "total",
      title: "Total Transfers",
      value: loading ? "..." : (stats.total || 0).toLocaleString(),
      subtitle: "Outward remitted transactions",
      icon: Send,
      color: "#087BFF",
      glowColor: "rgba(8, 123, 255, 0.25)",
      bgGradient: "linear-gradient(135deg, rgba(8, 123, 255, 0.12) 0%, rgba(5, 13, 27, 0.6) 100%)",
      badge: "Platform"
    },
    {
      id: "successful",
      title: "Successful Transfers",
      value: loading ? "..." : (stats.successful || 0).toLocaleString(),
      subtitle:
        stats.total > 0
          ? `${(((stats.successful || 0) / stats.total) * 100).toFixed(1)}% instant settlement`
          : "100% SLA compliant",
      icon: CheckCircle2,
      color: "#00E599",
      glowColor: "rgba(0, 229, 153, 0.25)",
      bgGradient: "linear-gradient(135deg, rgba(0, 229, 153, 0.12) 0%, rgba(5, 13, 27, 0.6) 100%)",
      badge: "Settled"
    },
    {
      id: "pending",
      title: "Pending Transfers",
      value: loading ? "..." : (stats.pending || 0).toLocaleString(),
      subtitle: "Switch queue & processing",
      icon: Clock,
      color: "#F59E0B",
      glowColor: "rgba(245, 158, 11, 0.25)",
      bgGradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(5, 13, 27, 0.6) 100%)",
      badge: "In Flight"
    },
    {
      id: "failed",
      title: "Failed Transfers",
      value: loading ? "..." : (stats.failed || 0).toLocaleString(),
      subtitle: "Host timeout or reversals",
      icon: XCircle,
      color: "#FF4D4D",
      glowColor: "rgba(255, 77, 77, 0.25)",
      bgGradient: "linear-gradient(135deg, rgba(255, 77, 77, 0.12) 0%, rgba(5, 13, 27, 0.6) 100%)",
      badge: "Attention"
    },
    {
      id: "amount",
      title: "Total Transfer Amount",
      value: loading ? "..." : formatINR(stats.totalAmount),
      subtitle: "Gross outward remit volume",
      icon: TrendingUp,
      color: "#00D5FF",
      glowColor: "rgba(0, 213, 255, 0.25)",
      bgGradient: "linear-gradient(135deg, rgba(0, 213, 255, 0.12) 0%, rgba(5, 13, 27, 0.6) 100%)",
      badge: "Gross Volume"
    },
    {
      id: "fees",
      title: "Total Transfer Fees",
      value: loading ? "..." : formatINR(stats.totalFees),
      subtitle: "IMPS/NEFT revenue generated",
      icon: Coins,
      color: "#A855F7",
      glowColor: "rgba(168, 85, 247, 0.25)",
      bgGradient: "linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(5, 13, 27, 0.6) 100%)",
      badge: "Fee Revenue"
    }
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
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
              border: "1px solid #16365C",
              borderRadius: "14px",
              padding: "20px",
              position: "relative",
              overflow: "hidden",
              transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.borderColor = card.color;
              e.currentTarget.style.boxShadow = `0 8px 24px ${card.glowColor}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "#16365C";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.3)";
            }}
          >
            {/* Top decorative glow */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: `linear-gradient(90deg, transparent, ${card.color}, transparent)`
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "12px"
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  background: card.bgGradient,
                  border: `1px solid ${card.color}33`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 2px 10px ${card.glowColor}`
                }}
              >
                <Icon size={20} color={card.color} />
              </div>

              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: card.color,
                  background: `${card.color}18`,
                  border: `1px solid ${card.color}44`,
                  padding: "3px 8px",
                  borderRadius: "20px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}
              >
                {card.badge}
              </span>
            </div>

            <div
              style={{
                color: "#8BA2C1",
                fontSize: "13px",
                fontWeight: "500",
                marginBottom: "6px"
              }}
            >
              {card.title}
            </div>

            <div
              style={{
                color: "#FFFFFF",
                fontSize: "24px",
                fontWeight: "800",
                letterSpacing: "-0.5px",
                lineHeight: "1.2",
                marginBottom: "6px",
                fontFamily: "system-ui, -apple-system, sans-serif"
              }}
            >
              {card.value}
            </div>

            <div
              style={{
                color: "#627B9B",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <ArrowUpRight size={13} color={card.color} />
              {card.subtitle}
            </div>
          </div>
        );
      })}
    </div>
  );
}
