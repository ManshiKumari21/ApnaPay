import React from "react";
import { ShieldCheck, Clock, CheckCircle2, XCircle, AlertCircle, Smartphone } from "lucide-react";
import StatCard from "../StatCard";

export default function KYCStats({ stats, loading }) {
  const data = stats || {
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    under_review: 0,
    mobile_not_verified: 0
  };

  return (
    <div className="stats-grid" style={{ marginBottom: "24px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
      {/* 1. Total Applications */}
      <StatCard
        title="Total KYC Applications"
        value={loading ? "..." : (data.total ?? 0)}
        icon={ShieldCheck}
        color="blue"
        subtitle="All customer submissions"
      />

      {/* 2. Pending KYC */}
      <StatCard
        title="Pending KYC"
        value={loading ? "..." : (data.pending ?? 0)}
        icon={Clock}
        color="orange"
        subtitle="Awaiting compliance review"
      />

      {/* 3. Verified KYC */}
      <StatCard
        title="Verified KYC"
        value={loading ? "..." : (data.verified ?? 0)}
        icon={CheckCircle2}
        color="green"
        subtitle="Identity verified & active"
      />

      {/* 4. Rejected KYC */}
      <StatCard
        title="Rejected KYC"
        value={loading ? "..." : (data.rejected ?? 0)}
        icon={XCircle}
        color="red"
        subtitle="Re-upload or appeals required"
      />

      {/* 5. Under Review KYC */}
      <StatCard
        title="Under Review KYC"
        value={loading ? "..." : (data.under_review ?? 0)}
        icon={AlertCircle}
        color="purple"
        subtitle="Resubmission requested"
      />

      {/* 6. Mobile Not Verified */}
      <StatCard
        title="Mobile Not Verified"
        value={loading ? "..." : (data.mobile_not_verified ?? 0)}
        icon={Smartphone}
        color="yellow"
        subtitle="Pending SMS OTP verification"
      />
    </div>
  );
}
