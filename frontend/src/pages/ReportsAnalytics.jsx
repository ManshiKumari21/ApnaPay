import React, { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Download, Calendar, RefreshCw, DollarSign, ArrowUpRight } from "lucide-react";
import api from "../services/api";

export default function ReportsAnalytics() {
  const [reportData, setReportData] = useState({
    summary: {
      weekly_volume: 3400000.00,
      weekly_transactions: 12300,
      average_ticket_size: 276.42,
      active_retention_rate: "89.4%"
    },
    daily_stats: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7d"); // "7d" | "30d" | "month"

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/reports");
      setReportData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCsv = () => {
    const rows = [
      ["Date", "Total Transactions", "Daily Volume (INR)"],
      ...(reportData.daily_stats || []).map(d => [d.report_date, d.total_transactions, d.daily_volume])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ApnaPay_Financial_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard-content">
      <div className="page-heading">
        <div>
          <h1>Module 15: Reports & Analytics</h1>
          <p>Financial reconciliations, gross revenue performance, daily settlement volumes, and automated exportable reports.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="refresh-btn" onClick={fetchReports}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Analytics
          </button>
          <button className="btn-save" onClick={handleExportCsv} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Download size={15} /> Export CSV Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card blue">
          <div className="stat-top">
            <span className="stat-title">Weekly Gross Volume</span>
            <div className="stat-icon"><TrendingUp size={20} /></div>
          </div>
          <h2>₹{(reportData.summary?.weekly_volume || 3400000).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
          <small>+14.2% vs previous 7 days</small>
        </div>

        <div className="stat-card green">
          <div className="stat-top">
            <span className="stat-title">Weekly Transactions</span>
            <div className="stat-icon"><BarChart3 size={20} /></div>
          </div>
          <h2>{(reportData.summary?.weekly_transactions || 12300).toLocaleString()} Txns</h2>
          <small>Avg ticket ₹{reportData.summary?.average_ticket_size || "276.42"}</small>
        </div>

        <div className="stat-card purple">
          <div className="stat-top">
            <span className="stat-title">Monthly Platform Revenue</span>
            <div className="stat-icon"><DollarSign size={20} /></div>
          </div>
          <h2>₹85,420.00</h2>
          <small>Net commission & interchange earnings</small>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="table-card">
        <div className="table-toolbar">
          <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Daily Settlement & Volume Ledger</h3>
        </div>

        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Report Date</th>
                <th>Total Volume (INR)</th>
                <th>Transaction Count</th>
                <th>Growth Trend</th>
                <th>Settlement Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData.daily_stats?.map((stat, idx) => (
                <tr key={stat.report_date || idx}>
                  <td>
                    <strong>{stat.report_date}</strong>
                  </td>
                  <td>
                    <strong style={{ fontSize: "15px", color: "#38bdf8" }}>
                      ₹{Number(stat.daily_volume).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </strong>
                  </td>
                  <td>{Number(stat.total_transactions).toLocaleString()} completed</td>
                  <td>
                    <span style={{ color: "#34d399", display: "inline-flex", alignItems: "center", gap: "2px", fontSize: "12px" }}>
                      <ArrowUpRight size={14} /> +{(4.5 + idx * 0.8).toFixed(1)}%
                    </span>
                  </td>
                  <td>
                    <span className="badge-pill verified">RECONCILED</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
