import React from "react";
import {
  QrCode,
  CheckCircle2,
  TrendingUp,
  Smartphone,
  Clock,
  XCircle,
  ArrowUpRight
} from "lucide-react";

export default function QrStats({ stats = {}, loading = false }) {
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
      id: "total_qrs",
      title: "Total QR Codes",
      value: loading ? "..." : (stats.total_qrs || 0).toLocaleString(),
      subtitle: "Static & Dynamic Merchant QRs",
      icon: QrCode,
      color: "#087BFF",
      glowColor: "rgba(8, 123, 255, 0.25)",
      bgGradient: "linear-gradient(135deg, rgba(8, 123, 255, 0.12) 0%, rgba(5, 13, 27, 0.6) 100%)",
      badge: "Registry"
    },
    {
      id: "active_qrs",
      title: "Active QR Codes",
      value: loading ? "..." : (stats.active_qrs || 0).toLocaleString(),
      subtitle: `${stats.total_qrs > 0 ? (((stats.active_qrs || 0) / stats.total_qrs) * 100).toFixed(1) : 100}% operational rate`,
      icon: CheckCircle2,
      color: "#00E599",
      glowColor: "rgba(0, 229, 153, 0.25)",
      bgGradient: "linear-gradient(135deg, rgba(0, 229, 153, 0.12) 0%, rgba(5, 13, 27, 0.6) 100%)",
      badge: "Active"
    },
    {
      id: "total_collection",
      title: "Total QR Collection",
      value: loading ? "..." : formatINR(stats.total_collection),
      subtitle: "Settled payments via QR scans",
      icon: TrendingUp,
      color: "#00D5FF",
      glowColor: "rgba(0, 213, 255, 0.25)",
      bgGradient: "linear-gradient(135deg, rgba(0, 213, 255, 0.12) 0%, rgba(5, 13, 27, 0.6) 100%)",
      badge: "Collection"
    },
    {
      id: "total_requests",
      title: "Total Scan Requests",
      value: loading ? "..." : (stats.total_requests || 0).toLocaleString(),
      subtitle: "Customer scan & pay attempts",
      icon: Smartphone,
      color: "#A855F7",
      glowColor: "rgba(168, 85, 247, 0.25)",
      bgGradient: "linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(5, 13, 27, 0.6) 100%)",
      badge: "Activity"
    },
    {
      id: "pending_payments",
      title: "Pending Payments",
      value: loading ? "..." : (stats.pending_payments || 0).toLocaleString(),
      subtitle: "Awaiting customer authorization",
      icon: Clock,
      color: "#FFB020",
      glowColor: "rgba(255, 176, 32, 0.25)",
      bgGradient: "linear-gradient(135deg, rgba(255, 176, 32, 0.12) 0%, rgba(5, 13, 27, 0.6) 100%)",
      badge: "In Flight"
    },
    {
      id: "failed_payments",
      title: "Failed Payments",
      value: loading ? "..." : (stats.failed_payments || 0).toLocaleString(),
      subtitle: "Timed out or cancelled scans",
      icon: XCircle,
      color: "#FF4D4D",
      glowColor: "rgba(255, 77, 77, 0.25)",
      bgGradient: "linear-gradient(135deg, rgba(255, 77, 77, 0.12) 0%, rgba(5, 13, 27, 0.6) 100%)",
      badge: "Attention"
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
