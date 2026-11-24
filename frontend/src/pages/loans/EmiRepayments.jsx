import React, { useState, useEffect } from "react";
import {
  Calculator,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  DollarSign,
  TrendingUp,
  CreditCard
} from "lucide-react";
import wealthService from "../../services/wealthService";

export default function EmiRepayments() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // all, upcoming, paid, overdue

  // Interactive EMI Calculator State
  const [calcAmount, setCalcAmount] = useState(500000);
  const [calcRate, setCalcRate] = useState(10.5);
  const [calcTenure, setCalcTenure] = useState(36);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await wealthService.getLoanRepayments();
      if (res?.success) {
        setData(res);
      } else {
        setError(res?.message || "Failed to load repayment ledger");
      }
    } catch (err) {
      setError(err?.message || "Error connecting to repayments service");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate EMI: P * r * (1 + r)^n / ((1 + r)^n - 1)
  const calculateEmi = () => {
    const P = Number(calcAmount);
    const r = Number(calcRate) / 12 / 100;
    const n = Number(calcTenure);
    if (!P || !r || !n) return 0;
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
  };

  const monthlyEmi = calculateEmi();
  const totalRepayment = monthlyEmi * calcTenure;
  const totalInterest = totalRepayment - calcAmount;

  const stats = data?.stats || {};
  const repayments = data?.repayments || [];
  const upcoming = data?.upcoming || [];
  const paid = data?.paid || [];
  const overdue = data?.overdue || [];

  const displayedRecords = 
    activeTab === "upcoming" ? upcoming :
    activeTab === "paid" ? paid :
    activeTab === "overdue" ? overdue : repayments;

  return (
    <div className="dashboard-content">
      {/* Page Heading */}
      <div className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "-0.5px" }}>
            EMI & Repayments Management
          </h1>
          <p style={{ color: "var(--secondary-text)", fontSize: "13.5px", marginTop: "4px" }}>
            Track recurring borrower EMI debits, reconcile bank settlements, monitor upcoming collections, and simulate loan amortization.
          </p>
        </div>
        <button
          type="button"
          className="refresh-btn"
          onClick={fetchData}
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

      {error && (
        <div style={{ background: "rgba(255, 77, 77, 0.12)", border: "1px solid rgba(255, 77, 77, 0.3)", padding: "14px 18px", borderRadius: "10px", color: "#FF6B6B", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {/* Interactive EMI Calculator Card */}
      <div style={{ background: "linear-gradient(135deg, #0B1E38 0%, #071426 100%)", border: "1px solid rgba(0, 213, 255, 0.3)", borderRadius: "16px", padding: "24px", marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(0, 213, 255, 0.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00D5FF" }}>
            <Calculator size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#FFFFFF" }}>Instant Loan EMI & Amortization Calculator</h3>
            <p style={{ fontSize: "12px", color: "var(--secondary-text)" }}>Simulate monthly installment, total interest component, and net repayment schedule</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", alignItems: "center" }}>
          {/* Sliders */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                <span style={{ color: "var(--secondary-text)" }}>Loan Amount:</span>
                <span style={{ fontWeight: "800", color: "#00D5FF" }}>₹{Number(calcAmount).toLocaleString("en-IN")}</span>
              </div>
              <input
                type="range"
                min={25000}
                max={5000000}
                step={25000}
                value={calcAmount}
                onChange={(e) => setCalcAmount(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#00D5FF", cursor: "pointer" }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                <span style={{ color: "var(--secondary-text)" }}>Interest Rate (% p.a.):</span>
                <span style={{ fontWeight: "800", color: "#00E599" }}>{calcRate}%</span>
              </div>
              <input
                type="range"
                min={8.0}
                max={24.0}
                step={0.25}
                value={calcRate}
                onChange={(e) => setCalcRate(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#00E599", cursor: "pointer" }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                <span style={{ color: "var(--secondary-text)" }}>Tenure (Months):</span>
                <span style={{ fontWeight: "800", color: "#FFFFFF" }}>{calcTenure} Mo ({Math.round(calcTenure / 12)} Yrs)</span>
              </div>
              <input
                type="range"
                min={6}
                max={120}
                step={6}
                value={calcTenure}
                onChange={(e) => setCalcTenure(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#087BFF", cursor: "pointer" }}
              />
            </div>
          </div>

          {/* Results Badge */}
          <div style={{ background: "#071426", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ gridColumn: "1 / -1", textAlign: "center", borderBottom: "1px solid rgba(23, 56, 93, 0.6)", paddingBottom: "14px" }}>
              <span style={{ fontSize: "11px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700" }}>Monthly Payable EMI</span>
              <div style={{ fontSize: "28px", fontWeight: "900", color: "#00D5FF", marginTop: "2px" }}>
                ₹{monthlyEmi.toLocaleString("en-IN")}
              </div>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Principal Amount</span>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#FFFFFF", marginTop: "2px" }}>
                ₹{Number(calcAmount).toLocaleString("en-IN")}
              </div>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Total Interest</span>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#F59E0B", marginTop: "2px" }}>
                ₹{totalInterest.toLocaleString("en-IN")}
              </div>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Total Repayment (Principal + Interest)</span>
              <div style={{ fontSize: "17px", fontWeight: "800", color: "#00E599", marginTop: "2px" }}>
                ₹{totalRepayment.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Records Tabs */}
      <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid var(--border-color)", marginBottom: "20px" }}>
        {[
          { key: "all", label: "All Repayments", count: repayments.length },
          { key: "paid", label: "Paid Installments", count: paid.length },
          { key: "upcoming", label: "Upcoming Dues", count: upcoming.length },
          { key: "overdue", label: "Overdue Exceptions", count: overdue.length }
        ].map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: activeTab === t.key ? "3px solid #087BFF" : "3px solid transparent",
              color: activeTab === t.key ? "#FFFFFF" : "var(--secondary-text)",
              padding: "10px 16px",
              fontSize: "13.5px",
              fontWeight: activeTab === t.key ? "700" : "500",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            {t.label}
            <span
              style={{
                fontSize: "10.5px",
                padding: "2px 6px",
                borderRadius: "999px",
                background: activeTab === t.key ? "rgba(8, 123, 255, 0.25)" : "rgba(23, 56, 93, 0.5)",
                color: activeTab === t.key ? "#00D5FF" : "var(--secondary-text)"
              }}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#071426", borderBottom: "1px solid var(--border-color)", color: "var(--secondary-text)" }}>
                <th style={{ padding: "12px 16px" }}>Loan App Ref</th>
                <th style={{ padding: "12px 16px" }}>Borrower Name</th>
                <th style={{ padding: "12px 16px" }}>Loan Type</th>
                <th style={{ padding: "12px 16px" }}>Instalment #</th>
                <th style={{ padding: "12px 16px" }}>EMI Amount</th>
                <th style={{ padding: "12px 16px" }}>Principal / Interest</th>
                <th style={{ padding: "12px 16px" }}>Due Date</th>
                <th style={{ padding: "12px 16px" }}>Payment Mode</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "var(--secondary-text)" }}>
                    <RefreshCw size={20} className="spin" style={{ margin: "0 auto 10px" }} />
                    Loading repayment records...
                  </td>
                </tr>
              ) : displayedRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "var(--secondary-text)" }}>
                    No repayment records found under this tab.
                  </td>
                </tr>
              ) : (
                displayedRecords.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid rgba(23, 56, 93, 0.5)" }}>
                    <td style={{ padding: "14px 16px", color: "var(--cyan-highlight)", fontWeight: "700" }}>
                      #LN-APP-880{r.loan_application_id}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: "700", color: "#FFFFFF" }}>
                      {r.applicant_name}
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--secondary-text)" }}>
                      {r.loan_type}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#FFFFFF" }}>
                      EMI #{r.installment_number}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: "700", color: "#00D5FF" }}>
                      ₹{Number(r.emi_amount).toFixed(2)}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "12px", color: "var(--secondary-text)" }}>
                      ₹{r.principal_amount} / ₹{r.interest_amount}
                    </td>
                    <td style={{ padding: "14px 16px", color: r.status === "paid" ? "var(--secondary-text)" : "#00E599", fontWeight: r.status === "paid" ? "normal" : "600" }}>
                      {r.due_date}
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--secondary-text)", fontSize: "12px" }}>
                      {r.payment_mode || "AutoDebit Scheduled"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "3px 8px",
                          borderRadius: "999px",
                          background: r.status === "paid" ? "rgba(0, 229, 153, 0.15)" : r.status === "overdue" ? "rgba(255, 77, 77, 0.15)" : "rgba(8, 123, 255, 0.15)",
                          color: r.status === "paid" ? "#00E599" : r.status === "overdue" ? "#FF6B6B" : "#00D5FF",
                          textTransform: "uppercase"
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
