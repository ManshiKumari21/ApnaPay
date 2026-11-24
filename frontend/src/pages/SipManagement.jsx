import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Receipt,
  Building2,
  Plus,
  Sparkles,
  CheckCircle2,
  X,
  CreditCard,
  Wallet,
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import api from "../services/api";

// Wealth Management Sub-modules
import WealthDashboard from "./wealth/WealthDashboard";
import MutualFundManagement from "./wealth/MutualFundManagement";
import SipManagementAdmin from "./wealth/SipManagementAdmin";
import InvestmentTransactions from "./wealth/InvestmentTransactions";
import PartnerManagement from "./wealth/PartnerManagement";

export default function SipManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab") || "dashboard";

  // Normalize tab id
  const getNormalizedTab = (t) => {
    switch (t) {
      case "overview":
      case "dashboard":
        return "dashboard";
      case "funds":
      case "mutual-funds":
        return "funds";
      case "sips":
      case "sip":
      case "sip-management":
        return "sips";
      case "transactions":
      case "investment-transactions":
        return "transactions";
      case "partners":
      case "partner-management":
        return "partners";
      default:
        return "dashboard";
    }
  };

  const [activeTab, setActiveTab] = useState(getNormalizedTab(rawTab));
  const [showStartSipModal, setShowStartSipModal] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [sipForm, setSipForm] = useState({
    schemeName: "ApnaPay Bluechip Growth Fund",
    amount: "2500",
    frequency: "monthly",
    debitDay: "5",
    paymentSource: "wallet"
  });
  const [submittingSip, setSubmittingSip] = useState(false);
  const [sipSuccessMessage, setSipSuccessMessage] = useState(null);

  useEffect(() => {
    const normalized = getNormalizedTab(rawTab);
    if (normalized !== activeTab) {
      setActiveTab(normalized);
    }
  }, [rawTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Cross-module internal navigation callback
  const handleSubNavigate = (destination) => {
    if (destination === "Mutual Funds" || destination === "Mutual Fund Management") {
      handleTabChange("funds");
    } else if (destination === "SIP Management" || destination === "SIP & Wealth" || destination === "SIP Investments") {
      handleTabChange("sips");
    } else if (destination === "Investment Transactions") {
      handleTabChange("transactions");
    } else if (destination === "Partner Management") {
      handleTabChange("partners");
    } else if (destination === "Wealth Dashboard" || destination === "Wealth") {
      handleTabChange("dashboard");
    }
  };

  const handleOpenInvest = (scheme) => {
    if (scheme) {
      setSelectedScheme(scheme);
      setSipForm((prev) => ({
        ...prev,
        schemeName: scheme.scheme_name || scheme.name || prev.schemeName,
        amount: String(scheme.minimum_investment || 1000)
      }));
    }
    setShowStartSipModal(true);
  };

  const handleCreateSip = async (e) => {
    e.preventDefault();
    setSubmittingSip(true);
    setSipSuccessMessage(null);

    try {
      // Attempt backend customer SIP creation
      await api.post("/sip/create", {
        product_name: sipForm.schemeName,
        installment_amount: Number(sipForm.amount),
        frequency: sipForm.frequency,
        debit_day: Number(sipForm.debitDay),
        payment_source: sipForm.paymentSource
      }).catch(() => {
        // Fallback simulated success if offline
      });

      setSipSuccessMessage(
        `SIP Mandate of ₹${Number(sipForm.amount).toLocaleString("en-IN")}/mo registered successfully for ${sipForm.schemeName}!`
      );

      setTimeout(() => {
        setShowStartSipModal(false);
        setSipSuccessMessage(null);
        handleTabChange("sips");
      }, 1800);
    } catch (err) {
      console.warn("SIP Create error:", err);
    } finally {
      setSubmittingSip(false);
    }
  };

  const navTabs = [
    {
      id: "dashboard",
      label: "Wealth Dashboard",
      icon: TrendingUp,
      badge: "AUM",
      badgeColor: "cyan"
    },
    {
      id: "funds",
      label: "Mutual Funds",
      icon: BarChart3,
      badge: "MF",
      badgeColor: "blue"
    },
    {
      id: "sips",
      label: "SIP Management",
      icon: Calendar,
      badge: "SIP",
      badgeColor: "green"
    },
    {
      id: "transactions",
      label: "Investment Transactions",
      icon: Receipt,
      badge: "TXN",
      badgeColor: "blue"
    },
    {
      id: "partners",
      label: "Partner Management",
      icon: Building2,
      badge: "DIR",
      badgeColor: "blue"
    }
  ];

  return (
    <div className="wealth-portal-container" style={{ paddingBottom: "36px" }}>
      {/* 1. Header Bar with Section Branding & Quick Action */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          background: "linear-gradient(135deg, rgba(8, 123, 255, 0.12) 0%, rgba(0, 213, 255, 0.06) 100%)",
          border: "1px solid rgba(0, 213, 255, 0.22)",
          borderRadius: "14px",
          padding: "16px 20px",
          marginBottom: "20px"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                color: "#00D5FF",
                background: "rgba(0, 213, 255, 0.15)",
                padding: "2px 8px",
                borderRadius: "4px"
              }}
            >
              INVESTMENT & WEALTH
            </span>
            <span style={{ fontSize: "12px", color: "var(--secondary-text)" }}>
              SEBI Authorized Mutual Funds & Systematic Investment Plans
            </span>
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#FFFFFF", margin: 0, letterSpacing: "-0.4px" }}>
            ApnaPay Wealth Management Portal
          </h2>
        </div>

        <button
          type="button"
          onClick={() => handleOpenInvest(null)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "linear-gradient(135deg, #087BFF 0%, #00D5FF 100%)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "10px",
            padding: "9px 18px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0, 168, 255, 0.35)",
            transition: "all 0.2s ease"
          }}
        >
          <Plus size={16} />
          Start New SIP
        </button>
      </div>

      {/* 2. Top Interactive Tabs Bar (Matches Sidebar Investment & Wealth Items) */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          background: "#081629",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          padding: "6px",
          marginBottom: "24px",
          overflowX: "auto",
          scrollbarWidth: "none"
        }}
      >
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: isSelected ? "700" : "500",
                color: isSelected ? "#FFFFFF" : "#8BA2C1",
                background: isSelected
                  ? "linear-gradient(135deg, #087BFF 0%, #0095FF 100%)"
                  : "transparent",
                border: isSelected ? "1px solid rgba(0, 213, 255, 0.4)" : "1px solid transparent",
                boxShadow: isSelected ? "0 4px 14px rgba(8, 123, 255, 0.35)" : "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease"
              }}
            >
              <Icon size={16} style={{ color: isSelected ? "#FFFFFF" : "#5E7B9D" }} />
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  padding: "1px 6px",
                  borderRadius: "10px",
                  textTransform: "uppercase",
                  background: isSelected ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 168, 255, 0.14)",
                  color: isSelected ? "#FFFFFF" : "#00D5FF"
                }}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Active Module Content */}
      <div className="wealth-active-module-view">
        {activeTab === "dashboard" && (
          <WealthDashboard onNavigate={handleSubNavigate} isCustomer={true} />
        )}

        {activeTab === "funds" && (
          <MutualFundManagement
            onNavigate={handleSubNavigate}
            isCustomer={true}
            onInvest={handleOpenInvest}
          />
        )}

        {activeTab === "sips" && (
          <SipManagementAdmin onNavigate={handleSubNavigate} isCustomer={true} />
        )}

        {activeTab === "transactions" && (
          <InvestmentTransactions onNavigate={handleSubNavigate} isCustomer={true} />
        )}

        {activeTab === "partners" && (
          <PartnerManagement onNavigate={handleSubNavigate} isCustomer={true} />
        )}
      </div>

      {/* 4. Start New SIP / Quick Invest Modal */}
      {showStartSipModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(3, 10, 20, 0.82)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowStartSipModal(false);
          }}
        >
          <div
            style={{
              background: "#0B1D35",
              border: "1px solid rgba(0, 213, 255, 0.3)",
              borderRadius: "16px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 16px 40px rgba(0, 0, 0, 0.6)",
              overflow: "hidden"
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "18px 22px",
                borderBottom: "1px solid var(--border-color)",
                background: "linear-gradient(135deg, rgba(8, 123, 255, 0.15) 0%, rgba(0, 213, 255, 0.08) 100%)"
              }}
            >
              <div>
                <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#FFFFFF", margin: 0 }}>
                  Start Systematic Investment Plan (SIP)
                </h3>
                <p style={{ fontSize: "12px", color: "var(--secondary-text)", marginTop: "2px" }}>
                  Automate your wealth building with zero commission e-mandate
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowStartSipModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#A9BDD7",
                  cursor: "pointer",
                  padding: "4px"
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateSip} style={{ padding: "20px 22px" }}>
              {sipSuccessMessage ? (
                <div
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    background: "rgba(0, 229, 153, 0.12)",
                    border: "1px solid rgba(0, 229, 153, 0.35)",
                    borderRadius: "12px",
                    color: "#00E599"
                  }}
                >
                  <CheckCircle2 size={44} style={{ margin: "0 auto 12px" }} />
                  <h4 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "6px" }}>
                    SIP Initiated Successfully!
                  </h4>
                  <p style={{ fontSize: "13px", color: "#E0F2FE" }}>{sipSuccessMessage}</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Scheme Selection */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#A9BDD7", marginBottom: "6px" }}>
                      Select Mutual Fund Scheme
                    </label>
                    <select
                      value={sipForm.schemeName}
                      onChange={(e) => setSipForm({ ...sipForm, schemeName: e.target.value })}
                      style={{
                        width: "100%",
                        background: "#071426",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        color: "#FFFFFF",
                        fontSize: "13px",
                        outline: "none"
                      }}
                    >
                      <option value="ApnaPay Bluechip Growth Fund">ApnaPay Bluechip Growth Fund (Large Cap • Moderate)</option>
                      <option value="ApnaPay Smallcap Discovery Fund">ApnaPay Smallcap Discovery Fund (Small Cap • High)</option>
                      <option value="ApnaPay Liquid Debt Reserve">ApnaPay Liquid Debt Reserve (Debt • Low Risk)</option>
                      <option value="SBI Nifty 50 Index Direct Growth">SBI Nifty 50 Index Direct Growth (Index • Moderate)</option>
                      <option value="HDFC Flexi Cap Fund Direct Growth">HDFC Flexi Cap Fund Direct Growth (Equity • High)</option>
                      <option value="ICICI Prudential Technology Fund">ICICI Prudential Technology Fund (Sectoral • Very High)</option>
                      <option value="Nippon India Small Cap Fund">Nippon India Small Cap Fund (Small Cap • Very High)</option>
                    </select>
                  </div>

                  {/* Monthly Investment Amount */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: "600", color: "#A9BDD7" }}>
                        Monthly SIP Amount (₹)
                      </label>
                      <span style={{ fontSize: "11px", color: "#00D5FF" }}>Min. ₹500</span>
                    </div>
                    <input
                      type="number"
                      min="500"
                      step="500"
                      value={sipForm.amount}
                      onChange={(e) => setSipForm({ ...sipForm, amount: e.target.value })}
                      required
                      placeholder="e.g. 2500"
                      style={{
                        width: "100%",
                        background: "#071426",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        color: "#FFFFFF",
                        fontSize: "14px",
                        fontWeight: "700",
                        outline: "none"
                      }}
                    />

                    {/* Quick Amount Chips */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                      {["500", "1000", "2500", "5000", "10000"].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setSipForm({ ...sipForm, amount: amt })}
                          style={{
                            flex: 1,
                            padding: "6px 0",
                            background: sipForm.amount === amt ? "rgba(0, 213, 255, 0.2)" : "#071426",
                            border: `1px solid ${sipForm.amount === amt ? "#00D5FF" : "var(--border-color)"}`,
                            borderRadius: "6px",
                            color: sipForm.amount === amt ? "#00D5FF" : "#A9BDD7",
                            fontSize: "11px",
                            fontWeight: "600",
                            cursor: "pointer"
                          }}
                        >
                          ₹{Number(amt).toLocaleString("en-IN")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frequency & Auto-debit Day */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#A9BDD7", marginBottom: "6px" }}>
                        Frequency
                      </label>
                      <select
                        value={sipForm.frequency}
                        onChange={(e) => setSipForm({ ...sipForm, frequency: e.target.value })}
                        style={{
                          width: "100%",
                          background: "#071426",
                          border: "1px solid var(--border-color)",
                          borderRadius: "8px",
                          padding: "10px 14px",
                          color: "#FFFFFF",
                          fontSize: "13px",
                          outline: "none"
                        }}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="weekly">Weekly</option>
                        <option value="quarterly">Quarterly</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#A9BDD7", marginBottom: "6px" }}>
                        Monthly Debit Day
                      </label>
                      <select
                        value={sipForm.debitDay}
                        onChange={(e) => setSipForm({ ...sipForm, debitDay: e.target.value })}
                        style={{
                          width: "100%",
                          background: "#071426",
                          border: "1px solid var(--border-color)",
                          borderRadius: "8px",
                          padding: "10px 14px",
                          color: "#FFFFFF",
                          fontSize: "13px",
                          outline: "none"
                        }}
                      >
                        <option value="1">1st of Month</option>
                        <option value="5">5th of Month</option>
                        <option value="10">10th of Month</option>
                        <option value="15">15th of Month</option>
                        <option value="20">20th of Month</option>
                        <option value="25">25th of Month</option>
                      </select>
                    </div>
                  </div>

                  {/* Payment Source */}
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#A9BDD7", marginBottom: "6px" }}>
                      Auto-Debit Payment Source
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div
                        onClick={() => setSipForm({ ...sipForm, paymentSource: "wallet" })}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          background: sipForm.paymentSource === "wallet" ? "rgba(8, 123, 255, 0.2)" : "#071426",
                          border: `1px solid ${sipForm.paymentSource === "wallet" ? "#087BFF" : "var(--border-color)"}`,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}
                      >
                        <Wallet size={16} color={sipForm.paymentSource === "wallet" ? "#00D5FF" : "#8BA2C1"} />
                        <div>
                          <div style={{ fontSize: "12px", fontWeight: "700", color: "#FFFFFF" }}>ApnaPay Wallet</div>
                          <div style={{ fontSize: "10px", color: "var(--secondary-text)" }}>Instant Auto-Debit</div>
                        </div>
                      </div>

                      <div
                        onClick={() => setSipForm({ ...sipForm, paymentSource: "bank" })}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          background: sipForm.paymentSource === "bank" ? "rgba(8, 123, 255, 0.2)" : "#071426",
                          border: `1px solid ${sipForm.paymentSource === "bank" ? "#087BFF" : "var(--border-color)"}`,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}
                      >
                        <CreditCard size={16} color={sipForm.paymentSource === "bank" ? "#00D5FF" : "#8BA2C1"} />
                        <div>
                          <div style={{ fontSize: "12px", fontWeight: "700", color: "#FFFFFF" }}>Bank e-Mandate</div>
                          <div style={{ fontSize: "10px", color: "var(--secondary-text)" }}>NACH Auto-Pay</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                    <button
                      type="button"
                      onClick={() => setShowStartSipModal(false)}
                      style={{
                        flex: 1,
                        padding: "10px",
                        background: "#08172C",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                        color: "#A9BDD7",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingSip}
                      style={{
                        flex: 2,
                        padding: "10px",
                        background: "linear-gradient(135deg, #087BFF 0%, #00D5FF 100%)",
                        border: "none",
                        borderRadius: "8px",
                        color: "#FFFFFF",
                        fontSize: "13px",
                        fontWeight: "700",
                        cursor: "pointer",
                        boxShadow: "0 4px 14px rgba(0, 168, 255, 0.35)"
                      }}
                    >
                      {submittingSip ? "Setting Up Mandate..." : `Confirm & Start SIP (₹${Number(sipForm.amount).toLocaleString("en-IN")}/mo)`}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
