import React, { useEffect, useState } from "react";
import { Receipt, CheckCircle2, Clock, Zap, Droplets, Flame, Search, RefreshCw } from "lucide-react";
import api from "../services/api";

export default function BillPaymentManagement() {
  const [bills, setBills] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/bills");
      const list = res.data.bills || [];
      setBills(list);
      setFiltered(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    let res = [...bills];
    if (categoryFilter !== "all") {
      res = res.filter(b => b.category_name && b.category_name.toLowerCase().includes(categoryFilter.toLowerCase()));
    }
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(b =>
        (b.biller_name && b.biller_name.toLowerCase().includes(q)) ||
        (b.full_name && b.full_name.toLowerCase().includes(q)) ||
        (b.consumer_number && b.consumer_number.toLowerCase().includes(q))
      );
    }
    setFiltered(res);
  }, [categoryFilter, search, bills]);

  const totalBillVolume = bills.reduce((acc, b) => acc + Number(b.amount || 0), 0);

  return (
    <div className="dashboard-content">
      <div className="page-heading">
        <div>
          <h1>Module 11: Bill Payment Management (BBPS)</h1>
          <p>Oversee Bharat Bill Payment System (BBPS) transactions for Electricity, Water, Piped Gas, and Municipal taxes.</p>
        </div>
        <button className="refresh-btn" onClick={fetchBills}>
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Bills
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card blue">
          <div className="stat-top">
            <span className="stat-title">BBPS Bill Volume</span>
            <div className="stat-icon"><Receipt size={20} /></div>
          </div>
          <h2>₹{totalBillVolume.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
          <small>{bills.length} total utility bills settled</small>
        </div>

        <div className="stat-card green">
          <div className="stat-top">
            <span className="stat-title">BBPS Gateway</span>
            <div className="stat-icon"><CheckCircle2 size={20} /></div>
          </div>
          <h2>CONNECTED</h2>
          <small>NPCI Central Unit (BBPCU) Linked</small>
        </div>

        <div className="stat-card purple">
          <div className="stat-top">
            <span className="stat-title">Supported Categories</span>
            <div className="stat-icon"><Zap size={20} /></div>
          </div>
          <h2>Electricity, Gas, Water</h2>
          <small>Instant fetch & pay enabled</small>
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search Biller, Consumer ID, or Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {["all", "Electricity", "Gas", "Water"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  background: categoryFilter === cat ? "#087cff" : "#0d1b33",
                  color: categoryFilter === cat ? "#fff" : "#94a3b8",
                  border: "1px solid #1a2f52",
                  padding: "8px 14px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  cursor: "pointer"
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Consumer / User</th>
                <th>Biller Name</th>
                <th>Category</th>
                <th>Consumer No</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td><strong>#BILL-{b.id}</strong></td>
                  <td><strong>{b.full_name || `User #${b.user_id}`}</strong></td>
                  <td>{b.biller_name}</td>
                  <td>
                    <span style={{ fontSize: "11px", background: "#132847", padding: "4px 8px", borderRadius: "4px", color: "#60a5fa" }}>
                      {b.category_name}
                    </span>
                  </td>
                  <td><code>{b.consumer_number || "N/A"}</code></td>
                  <td>
                    <strong style={{ color: "#38bdf8" }}>₹{Number(b.amount).toFixed(2)}</strong>
                  </td>
                  <td>
                    <span className="badge-pill verified">PAID</span>
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
