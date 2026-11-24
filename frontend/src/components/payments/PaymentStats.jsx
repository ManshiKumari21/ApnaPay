import React from "react";
import {
  CreditCard, CheckCircle2, Clock, XCircle,
  TrendingUp, RotateCcw
} from "lucide-react";
import StatCard from "../StatCard";

export default function PaymentStats({ stats, loading }) {
  const formatINR = (val) => {
    const num = Number(val) || 0;
    return "₹" + num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        gap: "16px",
        marginBottom: "24px"
      }}
    >
      {/* 1. Total Payments */}
      <StatCard
        title="Total Payments"
        value={loading ? "..." : (stats.total || 0).toLocaleString()}
        icon={CreditCard}
        color="blue"
        subtitle="Across all gateways & methods"
      />

      {/* 2. Successful Payments */}
      <StatCard
        title="Successful"
        value={loading ? "..." : (stats.successful || 0).toLocaleString()}
        icon={CheckCircle2}
        color="green"
        subtitle={
          stats.total > 0
            ? `${(((stats.successful || 0) / stats.total) * 100).toFixed(1)}% settlement rate`
            : "100% SLA compliant"
        }
      />

      {/* 3. Pending Payments */}
      <StatCard
        title="Pending Payments"
        value={loading ? "..." : (stats.pending || 0).toLocaleString()}
        icon={Clock}
        color="orange"
        subtitle="Awaiting webhook confirmation"
      />

      {/* 4. Failed Payments */}
      <StatCard
        title="Failed Payments"
        value={loading ? "..." : (stats.failed || 0).toLocaleString()}
        icon={XCircle}
        color="red"
        subtitle="Gateway or auth declines"
      />

      {/* 5. Total Payment Volume */}
      <StatCard
        title="Total Payment Volume"
        value={loading ? "..." : formatINR(stats.totalAmount)}
        icon={TrendingUp}
        color="purple"
        subtitle="Gross processed transaction value"
      />

      {/* 6. Total Refund Volume */}
      <StatCard
        title="Total Refund Amount"
        value={loading ? "..." : formatINR(stats.refundAmount)}
        icon={RotateCcw}
        color="blue"
        subtitle="Processed merchant refunds"
      />
    </div>
  );
}
