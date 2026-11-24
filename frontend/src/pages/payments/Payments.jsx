import React, { useState, useEffect } from "react";
import { CreditCard, RefreshCw } from "lucide-react";
import api from "../../services/api";
import PaymentStats from "../../components/payments/PaymentStats";
import PaymentsTable from "../../components/payments/PaymentsTable";
import PaymentDetails from "./PaymentDetails";

export default function Payments() {
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    pending: 0,
    failed: 0,
    totalAmount: 0,
    refundAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch payments list and dashboard financial statistics
  const fetchPaymentsData = async () => {
    setLoading(true);
    setError(null);

    let fetchedList = [];
    let fetchedStats = null;
    let fetchedFinancials = null;

    // 1. Fetch payments list from /admin/transactions
    try {
      const res = await api.get("/admin/transactions");
      if (res.data?.success && Array.isArray(res.data.transactions)) {
        fetchedList = res.data.transactions;
        setPayments(fetchedList);
      }
    } catch (err) {
      console.error("Fetch payments error:", err);
      setError("Failed to load payments from database.");
    }

    // 2. Fetch dashboard transaction statistics from /admin/dashboard/transactions
    try {
      const resStats = await api.get("/admin/dashboard/transactions");
      if (resStats.data?.success && resStats.data?.data) {
        fetchedStats = resStats.data.data;
      }
    } catch (err) {
      console.log("Dashboard transaction stats fetch info:", err.message);
    }

    // 3. Fetch financial statistics from /admin/dashboard/financials
    try {
      const resFin = await api.get("/admin/dashboard/financials");
      if (resFin.data?.success && resFin.data?.data) {
        fetchedFinancials = resFin.data.data;
      }
    } catch (err) {
      console.log("Financial stats fetch info:", err.message);
    }

    // 4. Compute accurate live stats from actual data
    const totalCount = fetchedStats?.total_payments || fetchedStats?.total_transactions || fetchedList.length;
    const successCount = fetchedStats?.successful || fetchedList.filter((p) =>
      ["success", "successful", "succeeded"].includes(String(p.status || "").toLowerCase())
    ).length;
    const pendingCount = fetchedList.filter((p) =>
      ["pending", "initiated", "processing"].includes(String(p.status || "").toLowerCase())
    ).length;
    const failedCount = fetchedStats?.failed || fetchedList.filter((p) =>
      ["failed", "declined", "cancelled"].includes(String(p.status || "").toLowerCase())
    ).length;
    const totalVol = fetchedStats?.total_payment_volume ||
      fetchedFinancials?.total_payment_volume ||
      fetchedList.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const refundVol = fetchedFinancials?.total_refund_volume || 0;

    setStats({
      total: totalCount,
      successful: successCount,
      pending: pendingCount,
      failed: failedCount,
      totalAmount: totalVol,
      refundAmount: refundVol
    });

    setLoading(false);
  };

  useEffect(() => {
    fetchPaymentsData();
  }, []);

  return (
    <div className="dashboard-content">
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <CreditCard size={28} color="#087cff" /> Payment Management
          </h1>
          <p>
            Monitor real-time customer checkouts, gateway settlements, transaction statuses, and merchant refunds.
          </p>
        </div>

        {!selectedPayment && (
          <button
            className="refresh-btn"
            onClick={fetchPaymentsData}
            disabled={loading}
            title="Refresh payment records from database"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Payments
          </button>
        )}
      </div>

      {/* Main View Switching */}
      {!selectedPayment ? (
        <>
          {/* KPI Statistics Cards */}
          <PaymentStats stats={stats} loading={loading} />

          {/* Master Payments Data Table */}
          <PaymentsTable
            payments={payments}
            loading={loading}
            error={error}
            onRefresh={fetchPaymentsData}
            onViewDetails={(item) => setSelectedPayment(item)}
          />
        </>
      ) : (
        /* Detailed Payment Inspection & Actions View */
        <PaymentDetails
          payment={selectedPayment}
          onBack={() => {
            setSelectedPayment(null);
            fetchPaymentsData();
          }}
          onStatusUpdated={fetchPaymentsData}
        />
      )}
    </div>
  );
}
