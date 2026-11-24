import React, { useEffect, useState } from "react";
import {
  Users, ArrowLeftRight, CreditCard, Wallet,
  ShieldCheck, RefreshCcw, AlertCircle, TrendingUp,
  ChevronRight, Calendar, Activity, CheckCircle2,
  BarChart3, FileText, Zap, Smartphone, Tv,
  Receipt, Car, Phone, ShieldAlert, FileDown,
  ArrowUpRight, RefreshCw
} from "lucide-react";
import api from "../services/api";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function Dashboard({ onNavigate, setActive }) {
  const { admin } = useAdminAuth() || {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [txnRange, setTxnRange] = useState("Today");
  const [revRange, setRevRange] = useState("7D");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activePointIndex, setActivePointIndex] = useState(3); // default 4th point

  // Live ticking date/time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navigateTab = (tab) => {
    if (typeof onNavigate === "function") {
      onNavigate(tab);
    } else if (typeof setActive === "function") {
      setActive(tab);
    }
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/admin/dashboard");
      setData(response.data?.data || null);
    } catch (err) {
      console.warn("Live API stats fallback:", err?.message);
      setError("Unable to load live dashboard stats. Reconnecting...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const adminName = admin?.fullName || admin?.full_name || admin?.name || "Manshi Gupta";

  const formattedDateTime = currentTime.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }) + ", " + currentTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  // Dynamic KPI Metrics
  const totalUsers = data?.users?.total !== undefined ? Number(data.users.total).toLocaleString("en-IN") : "8,432";
  const totalTransactions = data?.transactions?.total !== undefined ? Number(data.transactions.total).toLocaleString("en-IN") : "42,567";
  const totalVolume = data?.payments?.total_amount !== undefined
    ? "₹ " + Number(data.payments.total_amount).toLocaleString("en-IN")
    : "₹ 1,24,50,680";
  const totalRevenue = (data?.revenue?.total !== undefined || data?.wallet?.total_balance !== undefined)
    ? "₹ " + Number(data?.revenue?.total ?? data?.wallet?.total_balance ?? 0).toLocaleString("en-IN")
    : "₹ 2,48,520";

  const userGrowth = data?.users?.growth_pct ? `↑ ${data.users.growth_pct}%` : "↑ 12.5%";
  const txnGrowth = data?.transactions?.growth_pct ? `↑ ${data.transactions.growth_pct}%` : "↑ 18.2%";
  const volumeGrowth = data?.payments?.growth_pct ? `↑ ${data.payments.growth_pct}%` : "↑ 22.4%";
  const revenueGrowth = data?.revenue?.growth_pct ? `↑ ${data.revenue.growth_pct}%` : "↑ 16.8%";

  // Status Alert Metrics
  const pendingKyc = data?.kyc?.pending ?? 12;
  const pendingRefunds = data?.refunds?.total_count ?? 7;
  const failedTxns = data?.transactions?.failed ?? 5;
  const activeSip = data?.sip?.active_accounts ?? 843;
  const pendingComplaints = data?.complaints?.pending ?? 4;

  // Donut Chart Success Rate Calculations
  const successCount = data?.transactions?.successful ?? 40987;
  const pendingCount = data?.transactions?.pending ?? 892;
  const failedCount = data?.transactions?.failed ?? 645;
  const totalTxnCount = successCount + pendingCount + failedCount || 1;
  const successPct = ((successCount / totalTxnCount) * 100).toFixed(1);
  const pendingPct = ((pendingCount / totalTxnCount) * 100).toFixed(1);
  const failedPct = ((failedCount / totalTxnCount) * 100).toFixed(1);

  // Donut circumference: 2 * Math.PI * 48 = 301.59
  const circ = 301.59;
  const successDash = ((Number(successPct) / 100) * circ).toFixed(1);
  const pendingDash = ((Number(pendingPct) / 100) * circ).toFixed(1);
  const failedDash = ((Number(failedPct) / 100) * circ).toFixed(1);

  // Dynamic Transaction Overview Trends
  const trendPoints = data?.transaction_trends?.[txnRange] || [
    { label: "00:00", time: "00:00", amount: 1200, count: 2 },
    { label: "04:00", time: "04:00", amount: 850, count: 1 },
    { label: "08:00", time: "08:00", amount: 3200, count: 4 },
    { label: "10:00", time: "10:00", amount: 12450, count: 8 },
    { label: "12:00", time: "12:00", amount: 8900, count: 6 },
    { label: "16:00", time: "16:00", amount: 14200, count: 9 },
    { label: "20:00", time: "20:00", amount: 9500, count: 5 }
  ];

  const maxTrendVal = Math.max(...trendPoints.map((p) => p.amount || 0), 1000);
  const activePoint = trendPoints[activePointIndex] || trendPoints[trendPoints.length - 1];

  // Compute SVG curve points for Area Chart
  const svgWidth = 540;
  const svgLeft = 45;
  const svgRight = 515;
  const svgBottom = 160;
  const svgTop = 25;
  const pointSpread = (svgRight - svgLeft) / Math.max(1, trendPoints.length - 1);

  const coords = trendPoints.map((p, idx) => {
    const x = svgLeft + idx * pointSpread;
    const ratio = (p.amount || 0) / maxTrendVal;
    const y = svgBottom - ratio * (svgBottom - svgTop);
    return { x, y, ...p };
  });

  const pathD = coords.reduce((acc, pt, idx) => {
    if (idx === 0) return `M ${pt.x},${pt.y}`;
    const prev = coords[idx - 1];
    const cx1 = prev.x + (pt.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (pt.x - prev.x) / 2;
    const cy2 = pt.y;
    return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${pt.x},${pt.y}`;
  }, "");

  const areaD = coords.length > 0 ? `${pathD} L ${coords[coords.length - 1].x},${svgBottom} L ${coords[0].x},${svgBottom} Z` : "";

  // Dynamic Revenue Bars
  const revenueBars = data?.revenue_analytics?.[revRange] || [
    { label: "17 Nov", amount: 4350 },
    { label: "18 Nov", amount: 9000 },
    { label: "19 Nov", amount: 3116 },
    { label: "20 Nov", amount: 28200 },
    { label: "21 Nov", amount: 20000 },
    { label: "22 Nov", amount: 1349 },
    { label: "23 Nov", amount: 19499 }
  ];
  const maxBarAmount = Math.max(...revenueBars.map((b) => b.amount || 0), 1000);

  // Dynamic Recent Transactions
  const recentTransactions = data?.recent_transactions && data.recent_transactions.length > 0
    ? data.recent_transactions
    : [
        { id: "TXN1002487", user_name: "Rohit Sharma", type: "Money Transfer", amount: 5000, status: "success", time: "10:32 AM" },
        { id: "TXN1002486", user_name: "Priya Verma", type: "Mobile Recharge", amount: 299, status: "success", time: "10:21 AM" },
        { id: "TXN1002485", user_name: "Amit Kumar", type: "Bill Payment", amount: 1250, status: "pending", time: "10:15 AM" },
        { id: "TXN1002484", user_name: "Neha Singh", type: "SIP Investment", amount: 10000, status: "success", time: "09:58 AM" },
        { id: "TXN1002483", user_name: "Sandeep Yadav", type: "Money Transfer", amount: 2500, status: "failed", time: "09:42 AM" }
      ];

  // Dynamic Top Services
  const topServices = data?.top_services || [
    { name: "Mobile Recharge", loc: "Delhi", count: 12845, growth: "↑ 16%", icon: "Smartphone" },
    { name: "DTH Recharge", loc: "Delhi", count: 3256, growth: "↑ 12%", icon: "Tv" },
    { name: "Electricity Bill", loc: "Delhi", count: 2487, growth: "↑ 5%", icon: "Zap" },
    { name: "FASTag Recharge", loc: "Delhi", count: 1250, growth: "↑ 6%", icon: "Car" },
    { name: "Landline Bill", loc: "Delhi", count: 842, growth: "↑ 4%", icon: "Phone" }
  ];

  const getServiceIcon = (iconName) => {
    switch (iconName) {
      case "Smartphone": return <Smartphone size={16} />;
      case "Tv": return <Tv size={16} />;
      case "Zap": return <Zap size={16} />;
      case "Car": return <Car size={16} />;
      case "Phone": return <Phone size={16} />;
      case "TrendingUp": return <TrendingUp size={16} />;
      default: return <ArrowLeftRight size={16} />;
    }
  };

  const handleDownloadReport = () => {
    try {
      window.open("http://localhost:5000/api/transactions/export?format=csv", "_blank");
    } catch (_) {
      navigateTab("Reports & Analytics");
    }
  };

  return (
    <div className="fintech-dashboard-wrapper">
      {/* 1. Top Hero: Personalized Enterprise Admin Greeting & Revenue Card */}
      <div className="overview-hero-row">
        {/* Welcome Greeting Banner */}
        <div className="hero-banner">
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '60px',
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0, 213, 255, 0.3) 0%, transparent 70%)',
              pointerEvents: 'none'
            }}
          />

          <div className="hero-banner-content">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.15)', padding: '4px 12px', borderRadius: '16px', marginBottom: '10px' }}>
              <span className="minimal-pulse-dot" style={{ width: '6px', height: '6px', background: '#00F2FE' }} />
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                Enterprise Admin Console • Live
              </span>
            </div>
            <h1 className="hero-title">
              Welcome back, {adminName.split(' ')[0]}!
            </h1>
            <p className="hero-subtitle">
              Real-time payment settlements, escrow vault management, compliance KYC approvals, and system audit logs.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigateTab("KYC Management")}
                className="hero-cta-btn"
                title="View KYC Applications"
              >
                <ShieldCheck size={15} />
                <span>KYC Queue ({pendingKyc})</span>
              </button>
              <button
                onClick={() => navigateTab("Transactions")}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '700',
                  padding: '9px 18px',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <ArrowLeftRight size={15} />
                <span>Transactions</span>
              </button>
              <button
                onClick={fetchDashboard}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '700',
                  padding: '9px 18px',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <RefreshCw size={14} className={loading ? "spin" : ""} />
                <span>Sync Metrics</span>
              </button>
            </div>
          </div>

          {/* 3D Phone Mockup Graphic */}
          <div className="hero-graphic-wrap">
            <div className="phone-mockup-3d">
              <div className="phone-notch" />
              <div style={{ marginTop: '12px', textAlign: 'center' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #087BFF, #00D5FF)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontWeight: '900',
                    fontSize: '17px',
                    margin: '0 auto 4px auto'
                  }}
                >
                  A
                </div>
                <div className="phone-screen-logo">ApnaPay</div>
              </div>
              <div className="phone-screen-badge">
                <ShieldCheck size={22} />
              </div>
              <div style={{ fontSize: '9px', color: '#00E599', fontWeight: '800', marginTop: '6px', letterSpacing: '0.5px' }}>
                ADMIN CONSOLE
              </div>
            </div>
          </div>
        </div>

        {/* Live Escrow & Revenue Vault Card */}
        <div className="quick-wallet-card">
          <div>
            <div className="quick-wallet-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="wallet-card-label">RBI Escrow Vault Balance</span>
              </div>
              <div className="wallet-3d-icon-box">
                <Wallet size={22} />
              </div>
            </div>

            <div className="wallet-card-balance">
              {totalRevenue}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#00E599', fontWeight: '600', marginTop: '4px' }}>
              <span className="minimal-pulse-dot" style={{ width: '6px', height: '6px' }} />
              <span>Real-Time Escrow Ledger</span>
            </div>
          </div>

          <div className="wallet-card-actions">
            <button
              onClick={() => navigateTab("Wallet Management")}
              className="wallet-add-btn"
              title="Inspect Platform Wallet Limits"
            >
              <span>Manage Escrow</span>
            </button>
            <button
              onClick={() => navigateTab("Payment Management")}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#00D5FF',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px'
              }}
            >
              <span>View Gateways →</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Row 1: KPI Metric Cards (4 cards with sparklines) */}
      <div className="fintech-kpi-grid">
        {/* Total Users */}
        <div className="fintech-kpi-card kpi-blue" onClick={() => navigateTab("User Management")} style={{ cursor: "pointer" }}>
          <div className="fintech-kpi-header">
            <div className="fintech-kpi-icon icon-blue">
              <Users size={19} />
            </div>
            <ArrowUpRight size={17} className="fintech-kpi-corner-icon" />
          </div>
          <div className="fintech-kpi-label">Total Users</div>
          <div className="fintech-kpi-val">{totalUsers}</div>
          <div className="fintech-kpi-footer">
            <span className="fintech-trend-green">{userGrowth}</span>
            <span className="fintech-trend-sub">vs last 7 days</span>
          </div>
          <svg className="fintech-kpi-sparkline" viewBox="0 0 110 42" fill="none">
            <defs>
              <linearGradient id="blueGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00D5FF" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#00D5FF" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M 5,34 C 25,32 35,38 50,26 C 65,14 75,28 90,16 C 98,10 102,8 106,6" stroke="#00D5FF" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 5,34 C 25,32 35,38 50,26 C 65,14 75,28 90,16 C 98,10 102,8 106,6 L 106,42 L 5,42 Z" fill="url(#blueGlow)" />
          </svg>
        </div>

        {/* Total Transactions */}
        <div className="fintech-kpi-card kpi-green" onClick={() => navigateTab("Transactions")} style={{ cursor: "pointer" }}>
          <div className="fintech-kpi-header">
            <div className="fintech-kpi-icon icon-green">
              <ArrowLeftRight size={19} />
            </div>
            <ArrowUpRight size={17} className="fintech-kpi-corner-icon" />
          </div>
          <div className="fintech-kpi-label">Total Transactions</div>
          <div className="fintech-kpi-val">{totalTransactions}</div>
          <div className="fintech-kpi-footer">
            <span className="fintech-trend-green">{txnGrowth}</span>
            <span className="fintech-trend-sub">vs last 7 days</span>
          </div>
          <svg className="fintech-kpi-sparkline" viewBox="0 0 110 42" fill="none">
            <defs>
              <linearGradient id="greenGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00E599" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#00E599" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M 5,36 C 22,34 38,36 52,22 C 68,8 78,24 92,14 C 98,9 103,7 106,5" stroke="#00E599" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 5,36 C 22,34 38,36 52,22 C 68,8 78,24 92,14 C 98,9 103,7 106,5 L 106,42 L 5,42 Z" fill="url(#greenGlow)" />
          </svg>
        </div>

        {/* Total Payment Volume */}
        <div className="fintech-kpi-card kpi-purple" onClick={() => navigateTab("Payment Management")} style={{ cursor: "pointer" }}>
          <div className="fintech-kpi-header">
            <div className="fintech-kpi-icon icon-purple">
              <CreditCard size={19} />
            </div>
            <ArrowUpRight size={17} className="fintech-kpi-corner-icon" />
          </div>
          <div className="fintech-kpi-label">Total Payment Volume</div>
          <div className="fintech-kpi-val">{totalVolume}</div>
          <div className="fintech-kpi-footer">
            <span className="fintech-trend-green">{volumeGrowth}</span>
            <span className="fintech-trend-sub">vs last 7 days</span>
          </div>
          <svg className="fintech-kpi-sparkline" viewBox="0 0 110 42" fill="none">
            <defs>
              <linearGradient id="purpleGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A855F7" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M 5,35 C 24,35 36,39 52,24 C 66,12 76,26 90,14 C 98,8 102,6 106,5" stroke="#A855F7" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 5,35 C 24,35 36,39 52,24 C 66,12 76,26 90,14 C 98,8 102,6 106,5 L 106,42 L 5,42 Z" fill="url(#purpleGlow)" />
          </svg>
        </div>

        {/* Total Revenue */}
        <div className="fintech-kpi-card kpi-gold" onClick={() => navigateTab("Wallet Management")} style={{ cursor: "pointer" }}>
          <div className="fintech-kpi-header">
            <div className="fintech-kpi-icon icon-gold">
              <Wallet size={19} />
            </div>
            <ArrowUpRight size={17} className="fintech-kpi-corner-icon" />
          </div>
          <div className="fintech-kpi-label">Total Revenue</div>
          <div className="fintech-kpi-val">{totalRevenue}</div>
          <div className="fintech-kpi-footer">
            <span className="fintech-trend-green">{revenueGrowth}</span>
            <span className="fintech-trend-sub">vs last 7 days</span>
          </div>
          <svg className="fintech-kpi-sparkline" viewBox="0 0 110 42" fill="none">
            <defs>
              <linearGradient id="goldGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M 5,35 C 20,33 34,36 48,25 C 64,12 76,25 90,15 C 97,9 102,7 106,5" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 5,35 C 20,33 34,36 48,25 C 64,12 76,25 90,15 C 97,9 102,7 106,5 L 106,42 L 5,42 Z" fill="url(#goldGlow)" />
          </svg>
        </div>
      </div>

      {/* 3. Row 2: Status / Alert Cards (4 compact horizontal cards) */}
      <div className="fintech-alert-grid">
        <div className="fintech-alert-card" onClick={() => navigateTab("KYC Management")}>
          <div className="fintech-alert-left">
            <div className="fintech-alert-icon icon-blue">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="fintech-alert-title">Pending KYC</div>
              <div className="fintech-alert-num">{pendingKyc}</div>
            </div>
          </div>
          <ChevronRight size={18} className="fintech-alert-arrow" />
        </div>

        <div className="fintech-alert-card" onClick={() => navigateTab("Refund Management")}>
          <div className="fintech-alert-left">
            <div className="fintech-alert-icon icon-gold">
              <RefreshCcw size={18} />
            </div>
            <div>
              <div className="fintech-alert-title">Pending Refunds</div>
              <div className="fintech-alert-num">{pendingRefunds}</div>
            </div>
          </div>
          <ChevronRight size={18} className="fintech-alert-arrow" />
        </div>

        <div className="fintech-alert-card" onClick={() => navigateTab("Transactions")}>
          <div className="fintech-alert-left">
            <div className="fintech-alert-icon icon-red">
              <AlertCircle size={18} />
            </div>
            <div>
              <div className="fintech-alert-title">Failed Transactions</div>
              <div className="fintech-alert-num">{failedTxns}</div>
            </div>
          </div>
          <ChevronRight size={18} className="fintech-alert-arrow" />
        </div>

        <div className="fintech-alert-card" onClick={() => navigateTab("SIP Management")}>
          <div className="fintech-alert-left">
            <div className="fintech-alert-icon icon-purple">
              <TrendingUp size={18} />
            </div>
            <div>
              <div className="fintech-alert-title">Active SIP Accounts</div>
              <div className="fintech-alert-num">{activeSip}</div>
            </div>
          </div>
          <ChevronRight size={18} className="fintech-alert-arrow" />
        </div>
      </div>

      {/* 4. Row 3: Analytics Visualizations (3 cards) */}
      <div className="fintech-viz-grid">
        {/* Viz 1: Transaction Overview Area Chart */}
        <div className="fintech-viz-card viz-chart-wide">
          <div className="fintech-viz-header">
            <div className="fintech-viz-title">
              <Calendar size={16} style={{ color: "#00D5FF" }} />
              <span>Transaction Overview</span>
            </div>
            <div className="fintech-filter-pills">
              {["Today", "7 Days", "30 Days", "Custom"].map((tab) => (
                <button
                  key={tab}
                  className={`fintech-pill-btn ${txnRange === tab ? "active" : ""}`}
                  onClick={() => setTxnRange(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic SVG Area Chart */}
          <div className="fintech-svg-chart-container">
            <svg viewBox="0 0 540 190" className="fintech-area-svg">
              <defs>
                <linearGradient id="txnGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00D5FF" stopOpacity="0.38" />
                  <stop offset="100%" stopColor="#00D5FF" stopOpacity="0.0" />
                </linearGradient>
                <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Y Axis Grid & Labels */}
              <g className="fintech-chart-grid" stroke="#16365C" strokeDasharray="3 3">
                <line x1="45" y1="25" x2="515" y2="25" />
                <line x1="45" y1="60" x2="515" y2="60" />
                <line x1="45" y1="95" x2="515" y2="95" />
                <line x1="45" y1="130" x2="515" y2="130" />
                <line x1="45" y1="160" x2="515" y2="160" strokeDasharray="none" stroke="#214C7C" />
              </g>

              {/* Y Labels */}
              <text x="35" y="29" className="chart-label">₹{(maxTrendVal / 1000).toFixed(0)}K</text>
              <text x="35" y="64" className="chart-label">₹{((maxTrendVal * 0.75) / 1000).toFixed(0)}K</text>
              <text x="35" y="99" className="chart-label">₹{((maxTrendVal * 0.5) / 1000).toFixed(0)}K</text>
              <text x="35" y="134" className="chart-label">₹{((maxTrendVal * 0.25) / 1000).toFixed(0)}K</text>
              <text x="35" y="163" className="chart-label">0</text>

              {/* Dynamic Area Under Curve */}
              {areaD && <path d={areaD} fill="url(#txnGradient)" />}

              {/* Dynamic Main Glowing Curve */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#00D5FF"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  filter="url(#glowEffect)"
                />
              )}

              {/* Interactive Connecting Dots */}
              {coords.map((pt, idx) => (
                <g key={idx} style={{ cursor: "pointer" }} onClick={() => setActivePointIndex(idx)}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={idx === activePointIndex ? 5.5 : 3.5}
                    fill="#00D5FF"
                    stroke={idx === activePointIndex ? "#FFFFFF" : "none"}
                    strokeWidth={idx === activePointIndex ? 2.5 : 0}
                  />
                  {/* Invisible larger hit area for hover/click */}
                  <circle cx={pt.x} cy={pt.y} r={14} fill="transparent" />
                </g>
              ))}

              {/* Active Marker Line & Tooltip */}
              {coords[activePointIndex] && (
                <>
                  <line
                    x1={coords[activePointIndex].x}
                    y1={coords[activePointIndex].y}
                    x2={coords[activePointIndex].x}
                    y2={160}
                    stroke="#00D5FF"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                  />
                  <g
                    transform={`translate(${Math.max(
                      10,
                      Math.min(450, coords[activePointIndex].x - 45)
                    )}, ${Math.max(5, coords[activePointIndex].y - 42)})`}
                  >
                    <rect width="90" height="34" rx="6" fill="#050D1B" stroke="#00D5FF" strokeWidth="1" />
                    <polygon points="45,34 40,38 50,38" fill="#00D5FF" />
                    <text x="45" y="16" textAnchor="middle" fill="#FFFFFF" fontWeight="700" fontSize="11">
                      ₹ {Number(coords[activePointIndex].amount).toLocaleString("en-IN")}
                    </text>
                    <text x="45" y="28" textAnchor="middle" fill="#00D5FF" fontWeight="600" fontSize="9">
                      {coords[activePointIndex].label || coords[activePointIndex].time}
                    </text>
                  </g>
                </>
              )}

              {/* Dynamic X Labels */}
              {coords.map((pt, idx) => (
                <text key={idx} x={pt.x} y="178" className="chart-label" textAnchor="middle">
                  {pt.label || pt.time}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* Viz 2: Payment Success Rate (Donut Chart) */}
        <div className="fintech-viz-card viz-donut-card">
          <div className="fintech-viz-header">
            <div className="fintech-viz-title">
              <CheckCircle2 size={16} style={{ color: "#00E599" }} />
              <span>Payment Success Rate</span>
            </div>
          </div>

          <div className="fintech-donut-content">
            {/* SVG Donut */}
            <div className="fintech-donut-wrapper">
              <svg viewBox="0 0 130 130" className="fintech-donut-svg">
                <circle cx="65" cy="65" r="48" fill="none" stroke="#16365C" strokeWidth="12" />
                {/* Green Success */}
                <circle
                  cx="65"
                  cy="65"
                  r="48"
                  fill="none"
                  stroke="#00E599"
                  strokeWidth="12"
                  strokeDasharray={`${successDash} ${circ}`}
                  strokeDashoffset="75"
                  strokeLinecap="round"
                />
                {/* Orange Pending */}
                <circle
                  cx="65"
                  cy="65"
                  r="48"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="12"
                  strokeDasharray={`${pendingDash} ${circ}`}
                  strokeDashoffset={`-${75 + Number(successDash)}`}
                  strokeLinecap="round"
                />
                {/* Red Failed */}
                <circle
                  cx="65"
                  cy="65"
                  r="48"
                  fill="none"
                  stroke="#FF4D4D"
                  strokeWidth="12"
                  strokeDasharray={`${failedDash} ${circ}`}
                  strokeDashoffset={`-${75 + Number(successDash) + Number(pendingDash)}`}
                  strokeLinecap="round"
                />
              </svg>

              {/* Donut Center Text */}
              <div className="fintech-donut-center">
                <span className="donut-center-pct">{successPct}%</span>
                <span className="donut-center-label">Success Rate</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="fintech-donut-legend">
              <div className="legend-row">
                <div className="legend-left">
                  <span className="legend-dot dot-green" />
                  <div>
                    <div className="legend-name">Successful</div>
                    <div className="legend-count">({successCount.toLocaleString("en-IN")})</div>
                  </div>
                </div>
                <div className="legend-pct">{successPct}%</div>
              </div>

              <div className="legend-row">
                <div className="legend-left">
                  <span className="legend-dot dot-orange" />
                  <div>
                    <div className="legend-name">Pending</div>
                    <div className="legend-count">({pendingCount.toLocaleString("en-IN")})</div>
                  </div>
                </div>
                <div className="legend-pct">{pendingPct}%</div>
              </div>

              <div className="legend-row">
                <div className="legend-left">
                  <span className="legend-dot dot-red" />
                  <div>
                    <div className="legend-name">Failed</div>
                    <div className="legend-count">({failedCount.toLocaleString("en-IN")})</div>
                  </div>
                </div>
                <div className="legend-pct">{failedPct}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Viz 3: Revenue Analytics (Bar Chart) */}
        <div className="fintech-viz-card viz-bar-card">
          <div className="fintech-viz-header">
            <div className="fintech-viz-title">
              <BarChart3 size={16} style={{ color: "#00D5FF" }} />
              <span>Revenue Analytics</span>
            </div>
            <div className="fintech-filter-pills">
              {["7D", "30D", "3M"].map((tab) => (
                <button
                  key={tab}
                  className={`fintech-pill-btn ${revRange === tab ? "active" : ""}`}
                  onClick={() => setRevRange(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Dynamic Bar Chart */}
          <div className="fintech-svg-chart-container">
            <svg viewBox="0 0 310 190" className="fintech-bar-svg">
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00D5FF" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
              </defs>

              {/* Y Grid */}
              <g stroke="#16365C" strokeDasharray="3 3">
                <line x1="38" y1="25" x2="300" y2="25" />
                <line x1="38" y1="60" x2="300" y2="60" />
                <line x1="38" y1="95" x2="300" y2="95" />
                <line x1="38" y1="130" x2="300" y2="130" />
                <line x1="38" y1="160" x2="300" y2="160" strokeDasharray="none" stroke="#214C7C" />
              </g>

              {/* Y Labels */}
              <text x="30" y="29" className="chart-label" textAnchor="end">₹{(maxBarAmount / 1000).toFixed(0)}K</text>
              <text x="30" y="64" className="chart-label" textAnchor="end">₹{((maxBarAmount * 0.75) / 1000).toFixed(0)}K</text>
              <text x="30" y="99" className="chart-label" textAnchor="end">₹{((maxBarAmount * 0.5) / 1000).toFixed(0)}K</text>
              <text x="30" y="134" className="chart-label" textAnchor="end">₹{((maxBarAmount * 0.25) / 1000).toFixed(0)}K</text>
              <text x="30" y="163" className="chart-label" textAnchor="end">0</text>

              {/* Dynamic Bars */}
              {revenueBars.map((bar, idx) => {
                const totalBars = revenueBars.length;
                const availableWidth = 260;
                const barSpacing = availableWidth / totalBars;
                const barWidth = Math.min(18, Math.max(8, barSpacing - 12));
                const x = 45 + idx * barSpacing + (barSpacing - barWidth) / 2;
                const barHeight = Math.max(8, Math.round(((bar.amount || 0) / maxBarAmount) * 135));
                const y = 160 - barHeight;

                return (
                  <g key={idx} className="fintech-bar-group">
                    <title>{`${bar.label}: ₹${Number(bar.amount).toLocaleString("en-IN")}`}</title>
                    <rect x={x} y={y} width={barWidth} height={barHeight} rx="3" fill="url(#barGradient)" />
                    <text x={x + barWidth / 2} y="176" className="chart-label" textAnchor="middle">
                      {bar.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* 5. Row 4: Bottom Grid (3 sections) */}
      <div className="fintech-bottom-grid">
        {/* Section 1: Recent Transactions */}
        <div className="fintech-bottom-card recent-txns-section">
          <div className="fintech-viz-header">
            <div className="fintech-viz-title">
              <FileText size={16} style={{ color: "#00D5FF" }} />
              <span>Recent Transactions</span>
            </div>
            <button className="fintech-view-all-btn" onClick={() => navigateTab("Transactions")}>
              View All →
            </button>
          </div>

          <div className="fintech-table-responsive">
            <table className="fintech-transactions-table">
              <thead>
                <tr>
                  <th>Txn ID</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.slice(0, 5).map((txn, idx) => {
                  const statusKey = String(txn.status || "").toLowerCase();
                  const isSuccess = statusKey === "success" || statusKey === "succeeded";
                  const isPending = statusKey === "pending" || statusKey === "initiated";

                  return (
                    <tr key={idx}>
                      <td>
                        <div className="txn-id-cell">
                          <ArrowLeftRight size={13} style={{ color: isSuccess ? "#00D5FF" : isPending ? "#F59E0B" : "#FF4D4D" }} />
                          <span>{txn.id}</span>
                        </div>
                      </td>
                      <td className="user-name-cell">{txn.user_name}</td>
                      <td className="type-cell">{txn.type}</td>
                      <td className="amount-cell">₹ {Number(txn.amount).toLocaleString("en-IN")}</td>
                      <td>
                        <span className={`fintech-status-pill ${isSuccess ? "pill-success" : isPending ? "pill-pending" : "pill-failed"}`}>
                          ● {isSuccess ? "Success" : isPending ? "Pending" : "Failed"}
                        </span>
                      </td>
                      <td className="time-cell">{txn.time}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Quick Actions (2x2 Grid) */}
        <div className="fintech-bottom-card quick-actions-section">
          <div className="fintech-viz-header">
            <div className="fintech-viz-title">
              <Zap size={16} style={{ color: "#00D5FF" }} />
              <span>Quick Actions</span>
            </div>
          </div>

          <div className="fintech-qa-grid">
            {/* QA 1: View Pending KYC */}
            <div className="fintech-qa-card qa-blue" onClick={() => navigateTab("KYC Management")}>
              <div className="qa-icon icon-blue">
                <Users size={17} />
              </div>
              <div className="qa-info">
                <div className="qa-title">View Pending KYC</div>
                <div className="qa-sub">{pendingKyc} Requests</div>
              </div>
            </div>

            {/* QA 2: View Refund Requests */}
            <div className="fintech-qa-card qa-green" onClick={() => navigateTab("Refund Management")}>
              <div className="qa-icon icon-green">
                <RefreshCcw size={17} />
              </div>
              <div className="qa-info">
                <div className="qa-title">View Refund Requests</div>
                <div className="qa-sub">{pendingRefunds} Requests</div>
              </div>
            </div>

            {/* QA 3: View Disputes */}
            <div className="fintech-qa-card qa-purple" onClick={() => navigateTab("Dispute Management")}>
              <div className="qa-icon icon-purple">
                <ShieldAlert size={17} />
              </div>
              <div className="qa-info">
                <div className="qa-title">View Disputes</div>
                <div className="qa-sub">{pendingComplaints} Open</div>
              </div>
            </div>

            {/* QA 4: Download Reports */}
            <div className="fintech-qa-card qa-cyan" onClick={handleDownloadReport}>
              <div className="qa-icon icon-cyan">
                <FileDown size={17} />
              </div>
              <div className="qa-info">
                <div className="qa-title">Download Reports</div>
                <div className="qa-sub">Financial & Analytics</div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Top Services */}
        <div className="fintech-bottom-card top-services-section">
          <div className="fintech-viz-header">
            <div className="fintech-viz-title">
              <span>Top Services</span>
            </div>
            <button className="fintech-view-all-btn" onClick={() => navigateTab("Recharge & Bills")}>
              View All →
            </button>
          </div>

          <div className="fintech-services-list">
            {topServices.map((srv, idx) => (
              <div key={idx} className="fintech-service-item">
                <div className="service-left">
                  <div className={`service-icon ${idx === 0 ? "icon-green" : idx === 1 ? "icon-blue" : idx === 2 ? "icon-gold" : idx === 3 ? "icon-purple" : "icon-cyan"}`}>
                    {getServiceIcon(srv.icon)}
                  </div>
                  <div>
                    <div className="service-title">{srv.name}</div>
                    <div className="service-loc">{srv.loc}</div>
                  </div>
                </div>
                <div className="service-right">
                  <div className="service-count">{Number(srv.count).toLocaleString("en-IN")}</div>
                  <div className="service-growth">{srv.growth}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
