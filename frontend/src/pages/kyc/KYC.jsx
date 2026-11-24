import React, { useState, useEffect } from "react";
import { ShieldCheck, RefreshCw } from "lucide-react";
import api from "../../services/api";
import KYCStats from "../../components/kyc/KYCStats";
import KYCTable from "../../components/kyc/KYCTable";
import KYCDetails from "./KYCDetails";

export default function KYC() {
  const [selectedKycId, setSelectedKycId] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    under_review: 0,
    mobile_not_verified: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch real database statistics from /admin/kyc/stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get("/admin/kyc/stats");
      if (res.data.success && res.data.data) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Fetch KYC stats error:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="dashboard-content">
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldCheck size={28} color="#087cff" /> KYC Management
          </h1>
          <p>
            Verify government identity submissions, manage compliance approvals, inspect uploaded ID documents, and track audit history.
          </p>
        </div>

        {!selectedKycId && (
          <button
            className="refresh-btn"
            onClick={fetchStats}
            title="Refresh statistics and data"
          >
            <RefreshCw size={14} className={loadingStats ? "spin" : ""} /> Refresh KYC Stats
          </button>
        )}
      </div>

      {/* When NO application is selected: Show Statistics & Applications Table */}
      {!selectedKycId ? (
        <>
          {/* Real Database 6 KPI Statistics Cards */}
          <KYCStats stats={stats} loading={loadingStats} />

          {/* Applications Master Table with Mobile OTP Status & Advanced Filters */}
          <KYCTable
            onViewDetails={(id) => setSelectedKycId(id)}
          />
        </>
      ) : (
        /* When an application is selected: Show Details, Documents & Admin Actions */
        <KYCDetails
          kycId={selectedKycId}
          onBack={() => {
            setSelectedKycId(null);
            fetchStats();
          }}
          onStatusUpdated={() => {
            fetchStats();
          }}
        />
      )}
    </div>
  );
}
