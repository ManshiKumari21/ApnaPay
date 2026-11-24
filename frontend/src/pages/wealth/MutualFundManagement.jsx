import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Layers,
  ArrowUpRight,
  Shield,
  X
} from "lucide-react";
import wealthService from "../../services/wealthService";

export default function MutualFundManagement({ onNavigate, isCustomer = false, onInvest }) {
  const [funds, setFunds] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [risk, setRisk] = useState("All");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const recordsPerPage = 5;

  // Modals
  const [selectedFund, setSelectedFund] = useState(null);
  const [performanceFund, setPerformanceFund] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchFunds = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await wealthService.getMutualFunds({
        category,
        risk,
        status,
        search
      });
      if (res?.success) {
        setFunds(res.funds || []);
        setStats(res.stats || {});
      } else {
        setError(res?.message || "Failed to fetch mutual fund schemes");
      }
    } catch (err) {
      setError(err?.message || "Error connecting to mutual fund service");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunds();
  }, [category, risk, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFunds();
  };

  const handleToggleStatus = async (fund) => {
    setUpdatingId(fund.id);
    const newStatus = fund.status === "active" ? "inactive" : "active";
    try {
      const res = await wealthService.updateMutualFundStatus(fund.id, newStatus);
      if (res?.success) {
        setFunds(prev => prev.map(f => f.id === fund.id ? { ...f, status: newStatus } : f));
      }
    } catch (err) {
      alert("Failed to update status: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const exportCSV = () => {
    if (!funds.length) return;
    const headers = ["Fund ID", "Product Name", "AMC Name", "Category", "Risk Level", "NAV", "1Y Return", "3Y Return", "Min Investment", "Status"];
    const rows = funds.map(f => [
      f.fund_code || f.id,
      `"${f.product_name}"`,
      `"${f.amc_name}"`,
      `"${f.category}"`,
      f.risk_level,
      f.current_nav,
      `${f.returns_1yr}%`,
      `${f.returns_3yr}%`,
      f.minimum_investment,
      f.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ApnaPay_Mutual_Funds_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination
  const totalPages = Math.ceil(funds.length / recordsPerPage) || 1;
  const paginatedFunds = funds.slice((page - 1) * recordsPerPage, page * recordsPerPage);

  return (
    <div className="dashboard-content">
      {/* Page Heading */}
      <div className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "-0.5px" }}>
            Mutual Fund Management
          </h1>
          <p style={{ color: "var(--secondary-text)", fontSize: "13.5px", marginTop: "4px" }}>
            Manage approved mutual fund catalogs, monitor live NAV valuations, and review AMC fund performance.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={exportCSV}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(0, 213, 255, 0.12)",
              border: "1px solid rgba(0, 213, 255, 0.3)",
              color: "var(--cyan-highlight)",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            type="button"
            className="refresh-btn"
            onClick={fetchFunds}
            disabled={loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(8, 123, 255, 0.15)",
              border: "1px solid var(--border-color)",
              color: "var(--cyan-highlight)",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(255, 77, 77, 0.12)", border: "1px solid rgba(255, 77, 77, 0.3)", padding: "14px 18px", borderRadius: "10px", color: "#FF6B6B", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {/* 5 KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Total Schemes</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", marginTop: "4px" }}>{stats.totalSchemes || funds.length}</div>
          <span style={{ fontSize: "11px", color: "var(--cyan-highlight)" }}>SEBI registered catalogs</span>
        </div>

        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Active Schemes</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#00E599", marginTop: "4px" }}>{stats.activeSchemes || funds.filter(f => f.status === "active").length}</div>
          <span style={{ fontSize: "11px", color: "#00E599" }}>Live for customer SIP/Lumpsum</span>
        </div>

        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Total Investors</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#00D5FF", marginTop: "4px" }}>{(stats.totalInvestors || 1955).toLocaleString()}</div>
          <span style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Unique folios on platform</span>
        </div>

        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Total AUM Book</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", marginTop: "4px" }}>₹{(Number(stats.totalAum || 202000000) / 10000000).toFixed(2)} Cr</div>
          <span style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Net asset under management</span>
        </div>

        <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 18px" }}>
          <span style={{ fontSize: "11.5px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Total Transactions</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", marginTop: "4px" }}>{stats.totalTransactions || 8}</div>
          <span style={{ fontSize: "11px", color: "#00E599" }}>Settled & in-progress</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <div style={{ flex: "1 1 240px", position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted-text)" }} />
            <input
              type="text"
              placeholder="Search scheme name, AMC, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                background: "#071426",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                padding: "8px 12px 8px 36px",
                color: "#FFFFFF",
                fontSize: "13px",
                outline: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px", color: "#FFFFFF", fontSize: "13px" }}
            >
              <option value="All">All Categories</option>
              <option value="Equity">Equity</option>
              <option value="Large Cap">Large Cap</option>
              <option value="Small Cap">Small Cap</option>
              <option value="Flexi Cap">Flexi Cap</option>
              <option value="Tech">Sectoral Tech</option>
            </select>

            <select
              value={risk}
              onChange={(e) => { setRisk(e.target.value); setPage(1); }}
              style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px", color: "#FFFFFF", fontSize: "13px" }}
            >
              <option value="All">All Risk Levels</option>
              <option value="Low">Low</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
              <option value="Very High">Very High</option>
            </select>

            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 12px", color: "#FFFFFF", fontSize: "13px" }}
            >
              <option value="All">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              type="submit"
              style={{ background: "#087BFF", border: "none", color: "#FFFFFF", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Table Card */}
      <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#071426", borderBottom: "1px solid var(--border-color)", color: "var(--secondary-text)" }}>
                <th style={{ padding: "12px 16px" }}>Fund Code</th>
                <th style={{ padding: "12px 16px" }}>Scheme & AMC</th>
                <th style={{ padding: "12px 16px" }}>Category</th>
                <th style={{ padding: "12px 16px" }}>Risk Level</th>
                <th style={{ padding: "12px 16px" }}>NAV</th>
                <th style={{ padding: "12px 16px" }}>1Y Return</th>
                <th style={{ padding: "12px 16px" }}>3Y CAGR</th>
                <th style={{ padding: "12px 16px" }}>Min Investment</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ padding: "40px", textAlign: "center", color: "var(--secondary-text)" }}>
                    <RefreshCw size={20} className="spin" style={{ margin: "0 auto 10px" }} />
                    Loading mutual fund catalogs...
                  </td>
                </tr>
              ) : paginatedFunds.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: "40px", textAlign: "center", color: "var(--secondary-text)" }}>
                    No mutual fund schemes found matching the criteria.
                  </td>
                </tr>
              ) : (
                paginatedFunds.map((fund) => (
                  <tr key={fund.id} style={{ borderBottom: "1px solid rgba(23, 56, 93, 0.5)", transition: "background 0.15s" }}>
                    <td style={{ padding: "14px 16px", color: "var(--cyan-highlight)", fontWeight: "700" }}>
                      {fund.fund_code || `#MF-${fund.id}`}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: "700", color: "#FFFFFF" }}>{fund.product_name}</div>
                      <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>{fund.amc_name || "Authorized AMC"}</div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--secondary-text)" }}>
                      {fund.category}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background: fund.risk_level?.toLowerCase().includes("high") ? "rgba(255, 77, 77, 0.15)" : fund.risk_level?.toLowerCase().includes("mod") ? "rgba(245, 158, 11, 0.15)" : "rgba(0, 229, 153, 0.15)",
                          color: fund.risk_level?.toLowerCase().includes("high") ? "#FF6B6B" : fund.risk_level?.toLowerCase().includes("mod") ? "#F59E0B" : "#00E599"
                        }}
                      >
                        {fund.risk_level}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: "700", color: "#FFFFFF" }}>
                      ₹{Number(fund.current_nav).toFixed(2)}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: "700", color: "#00E599" }}>
                      +{fund.returns_1yr}%
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: "700", color: "#00D5FF" }}>
                      +{fund.returns_3yr}%
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--secondary-text)" }}>
                      ₹{Number(fund.minimum_investment).toFixed(0)}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "3px 8px",
                          borderRadius: "999px",
                          background: fund.status === "active" ? "rgba(0, 229, 153, 0.15)" : "rgba(107, 135, 168, 0.15)",
                          color: fund.status === "active" ? "#00E599" : "#6B87A8",
                          textTransform: "uppercase"
                        }}
                      >
                        {fund.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                        <button
                          type="button"
                          onClick={() => setSelectedFund(fund)}
                          title="View Details"
                          style={{ background: "rgba(8, 123, 255, 0.15)", border: "1px solid var(--border-color)", color: "#00D5FF", padding: "5px 8px", borderRadius: "6px", cursor: "pointer" }}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPerformanceFund(fund)}
                          title="Performance & Returns"
                          style={{ background: "rgba(0, 229, 153, 0.15)", border: "1px solid rgba(0, 229, 153, 0.3)", color: "#00E599", padding: "5px 8px", borderRadius: "6px", cursor: "pointer" }}
                        >
                          <BarChart3 size={14} />
                        </button>
                        {isCustomer && onInvest ? (
                          <button
                            type="button"
                            onClick={() => onInvest(fund)}
                            title="Start SIP in this Fund"
                            style={{
                              background: "linear-gradient(135deg, #087BFF 0%, #00D5FF 100%)",
                              border: "none",
                              color: "#FFFFFF",
                              padding: "5px 10px",
                              borderRadius: "6px",
                              fontSize: "11.5px",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              boxShadow: "0 2px 8px rgba(0, 168, 255, 0.3)"
                            }}
                          >
                            <TrendingUp size={12} />
                            Invest
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(fund)}
                            disabled={updatingId === fund.id}
                            title={fund.status === "active" ? "Disable Fund" : "Activate Fund"}
                            style={{
                              background: fund.status === "active" ? "rgba(255, 77, 77, 0.15)" : "rgba(0, 229, 153, 0.15)",
                              border: `1px solid ${fund.status === "active" ? "rgba(255, 77, 77, 0.3)" : "rgba(0, 229, 153, 0.3)"}`,
                              color: fund.status === "active" ? "#FF6B6B" : "#00E599",
                              padding: "5px 8px",
                              borderRadius: "6px",
                              cursor: "pointer"
                            }}
                          >
                            {fund.status === "active" ? <XCircle size={14} /> : <CheckCircle size={14} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid var(--border-color)", background: "#071426" }}>
          <span style={{ fontSize: "12px", color: "var(--secondary-text)" }}>
            Showing page {page} of {totalPages} ({funds.length} total schemes)
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              style={{ background: "#0B1B32", border: "1px solid var(--border-color)", color: "#FFFFFF", padding: "4px 12px", borderRadius: "6px", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.5 : 1 }}
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              style={{ background: "#0B1B32", border: "1px solid var(--border-color)", color: "#FFFFFF", padding: "4px 12px", borderRadius: "6px", cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Fund Details Modal */}
      {selectedFund && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(5, 13, 27, 0.8)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "16px", maxWidth: "560px", width: "100%", padding: "24px", boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--cyan-highlight)", fontWeight: "700" }}>{selectedFund.fund_code}</span>
                <h2 style={{ fontSize: "18px", color: "#FFFFFF", marginTop: "2px" }}>{selectedFund.product_name}</h2>
                <div style={{ fontSize: "12px", color: "var(--secondary-text)" }}>{selectedFund.amc_name}</div>
              </div>
              <button type="button" onClick={() => setSelectedFund(null)} style={{ background: "transparent", border: "none", color: "#A9BDD7", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#071426", padding: "16px", borderRadius: "10px", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Current NAV</div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#FFFFFF" }}>₹{Number(selectedFund.current_nav).toFixed(2)}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Scheme AUM</div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#00D5FF" }}>₹{(Number(selectedFund.aum || 42500000) / 10000000).toFixed(2)} Cr</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Expense Ratio</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#FFFFFF" }}>{selectedFund.expense_ratio || 0.65}%</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Risk Category</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#F59E0B" }}>{selectedFund.risk_level}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Min Installment</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#FFFFFF" }}>₹{selectedFund.minimum_investment}</div>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Platform Status</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: selectedFund.status === "active" ? "#00E599" : "#6B87A8", textTransform: "capitalize" }}>{selectedFund.status}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedFund(null)}
              style={{ width: "100%", background: "#087BFF", border: "none", color: "#FFFFFF", padding: "10px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* Fund Performance Modal */}
      {performanceFund && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(5, 13, 27, 0.8)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "16px", maxWidth: "560px", width: "100%", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
              <div>
                <h2 style={{ fontSize: "18px", color: "#FFFFFF" }}>Performance Analysis</h2>
                <div style={{ fontSize: "12px", color: "var(--secondary-text)" }}>{performanceFund.product_name}</div>
              </div>
              <button type="button" onClick={() => setPerformanceFund(null)} style={{ background: "transparent", border: "none", color: "#A9BDD7", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              <div style={{ background: "#071426", padding: "14px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>1-Year Return</div>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#00E599", marginTop: "4px" }}>+{performanceFund.returns_1yr}%</div>
              </div>
              <div style={{ background: "#071426", padding: "14px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>3-Year CAGR</div>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#00D5FF", marginTop: "4px" }}>+{performanceFund.returns_3yr}%</div>
              </div>
              <div style={{ background: "#071426", padding: "14px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Morningstar Rating</div>
                <div style={{ fontSize: "18px", fontWeight: "800", color: "#F59E0B", marginTop: "4px" }}>{"★".repeat(performanceFund.rating || 5)}</div>
              </div>
            </div>

            <p style={{ fontSize: "12px", color: "var(--secondary-text)", marginBottom: "20px" }}>
              Mutual fund investments are subject to market risks. Historical returns do not guarantee future compounding outcomes. NAV updated daily via BSE StAR MF feed.
            </p>

            <button
              type="button"
              onClick={() => setPerformanceFund(null)}
              style={{ width: "100%", background: "#087BFF", border: "none", color: "#FFFFFF", padding: "10px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
