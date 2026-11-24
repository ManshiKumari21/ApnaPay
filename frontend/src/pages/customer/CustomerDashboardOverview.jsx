import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  ShieldIcon,
  UserIcon,
  WalletIcon,
  BankIcon,
  LandmarkIcon,
  SmartphoneIcon,
  ReceiptIcon,
  HistoryIcon,
  LayersIcon,
  BellIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  SearchIcon,
  ZapIcon,
  DropletIcon,
  FlameIcon,
  TvIcon,
  WifiIcon,
  MoreHorizontalIcon,
  ChevronRightIcon,
  TrendingUpIcon,
  InfoIcon,
  QrCodeIcon,
  SendIcon,
  CopyIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  RefreshCwIcon,
  XIcon,
  CreditCardIcon,
  SparklesIcon
} from '../../components/Icons';
import bankAccountService from '../../services/bankAccountService';
import upiService from '../../services/upiService';
import walletService from '../../services/walletService';
import transactionService from '../../services/transactionService';
import billService from '../../services/billService';
import landService from '../../services/landService';

const CustomerDashboardOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [walletOverview, setWalletOverview] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [upiHandles, setUpiHandles] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [txnsLoading, setTxnsLoading] = useState(true);
  const [activeBillCategory, setActiveBillCategory] = useState('electricity');
  const [billersList, setBillersList] = useState([]);
  const [billerSearch, setBillerSearch] = useState('');
  const [dataRefreshing, setDataRefreshing] = useState(false);

  // Modals state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [scanPayModalOpen, setScanPayModalOpen] = useState(false);
  const [addMoneyModalOpen, setAddMoneyModalOpen] = useState(false);
  const [infoModal, setInfoModal] = useState(null); // { title, content }
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [quickAmount, setQuickAmount] = useState('500');
  const [scanUpiInput, setScanUpiInput] = useState('');

  // Lock body scroll when any modal is open
  useEffect(() => {
    const hasActiveModal = Boolean(qrModalOpen || scanPayModalOpen || addMoneyModalOpen || infoModal);
    if (hasActiveModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [qrModalOpen, scanPayModalOpen, addMoneyModalOpen, infoModal]);

  // Handle Escape key to close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setQrModalOpen(false);
        setScanPayModalOpen(false);
        setAddMoneyModalOpen(false);
        setInfoModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Format currency helpers
  const formatINR = (val) => {
    const num = parseFloat(val) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Recent';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return String(dateStr);
    }
  };

  // Fetch all live overview data
  const loadOverviewData = useCallback(async () => {
    setDataRefreshing(true);
    try {
      const [walletRes, banksRes, upiRes, txnsRes, billersRes] = await Promise.all([
        walletService.getOverview().catch(() => ({ data: null })),
        bankAccountService.getLinkedAccounts().catch(() => ({ data: [] })),
        upiService.getUpiHandles().catch(() => ({ data: [] })),
        transactionService.getTransactions({ page: 1, limit: 5 }).catch(() => ({ data: { records: [] } })),
        billService.getBillers(activeBillCategory, 1, 10).catch(() => ({ data: { billers: [] } }))
      ]);

      if (walletRes?.data) setWalletOverview(walletRes.data);
      if (banksRes?.data) setBankAccounts(banksRes.data);
      if (upiRes?.data) setUpiHandles(upiRes.data);
      if (txnsRes?.data?.records) setRecentTransactions(txnsRes.data.records);

      const fetchedBillers = billersRes?.data?.billers || [];
      if (fetchedBillers.length > 0) {
        setBillersList(fetchedBillers);
      } else {
        setBillersList([
          { billerId: 'MPPKVVCL-W', billerName: 'MPPKVVCL - West Discom', state: 'Madhya Pradesh' },
          { billerId: 'BSES-RAJ', billerName: 'BSES Rajdhani Power Ltd', state: 'Delhi' },
          { billerId: 'TATA-PWR-MUM', billerName: 'Tata Power Electricity', state: 'Mumbai' },
          { billerId: 'ADANI-ELEC-MUM', billerName: 'Adani Electricity', state: 'Mumbai' }
        ]);
      }
    } catch (err) {
      console.warn('Overview load warning:', err.message);
    } finally {
      setWalletLoading(false);
      setTxnsLoading(false);
      setDataRefreshing(false);
    }
  }, [activeBillCategory]);

  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]);

  // Handle category switch in bill payments widget
  const handleCategoryChange = async (catKey) => {
    setActiveBillCategory(catKey);
    try {
      const res = await billService.getBillers(catKey, 1, 10);
      const list = res?.data?.billers || [];
      if (list.length > 0) {
        setBillersList(list);
      } else {
        if (catKey === 'water') {
          setBillersList([
            { billerId: 'DELHI-JAL-BOARD', billerName: 'Delhi Jal Board', state: 'Delhi' },
            { billerId: 'BWSSB-BLR', billerName: 'Bangalore Water Supply (BWSSB)', state: 'Karnataka' },
            { billerId: 'MCGM-WATER', billerName: 'MCGM Water Department', state: 'Mumbai' }
          ]);
        } else if (catKey === 'gas') {
          setBillersList([
            { billerId: 'IGL-GAS', billerName: 'Indraprastha Gas (IGL)', state: 'Delhi NCR' },
            { billerId: 'MGL-GAS', billerName: 'Mahanagar Gas Limited (MGL)', state: 'Mumbai' },
            { billerId: 'GUJ-GAS', billerName: 'Gujarat Gas Ltd', state: 'Gujarat' }
          ]);
        } else if (catKey === 'dth') {
          setBillersList([
            { billerId: 'TATA-PLAY', billerName: 'Tata Play (Sky)', state: 'National' },
            { billerId: 'AIRTEL-DTH', billerName: 'Airtel Digital TV', state: 'National' },
            { billerId: 'DISH-TV', billerName: 'Dish TV India', state: 'National' }
          ]);
        } else if (catKey === 'broadband') {
          setBillersList([
            { billerId: 'JIO-FIBER', billerName: 'JioFiber Broadband', state: 'All India' },
            { billerId: 'AIRTEL-XTREME', billerName: 'Airtel Xstream Fiber', state: 'All India' },
            { billerId: 'ACT-CORP', billerName: 'ACT Fibernet', state: 'Major Cities' }
          ]);
        } else if (catKey === 'mobile_postpaid') {
          setBillersList([
            { billerId: 'JIO-POSTPAID', billerName: 'Jio Postpaid Plus', state: 'All India' },
            { billerId: 'AIRTEL-POSTPAID', billerName: 'Airtel Postpaid', state: 'All India' },
            { billerId: 'VI-POSTPAID', billerName: 'Vi Postpaid', state: 'All India' }
          ]);
        } else {
          setBillersList([
            { billerId: 'MPPKVVCL-W', billerName: 'MPPKVVCL - West Discom', state: 'Madhya Pradesh' },
            { billerId: 'BSES-RAJ', billerName: 'BSES Rajdhani Power Ltd', state: 'Delhi' },
            { billerId: 'TATA-PWR-MUM', billerName: 'Tata Power Electricity', state: 'Mumbai' }
          ]);
        }
      }
    } catch (_) { }
  };

  // Filter billers in widget search
  const filteredBillers = billerSearch.trim()
    ? billersList.filter(
      (b) =>
        b.billerName.toLowerCase().includes(billerSearch.toLowerCase()) ||
        (b.state && b.state.toLowerCase().includes(billerSearch.toLowerCase()))
    )
    : billersList;

  // Primary UPI handle
  const primaryUpi = upiHandles.find((u) => u.isPrimary)?.upiId ||
    upiHandles[0]?.upiId ||
    `${user?.phone || '8602612434'}@apnapay`;

  // Primary Bank Account
  const primaryBank = bankAccounts.find((b) => b.isPrimary) || bankAccounts[0];

  // User Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const displayName = user?.full_name || 'Customer';
  const firstName = displayName.split(' ')[0] || 'User';

  const rawBalance = walletOverview?.available_balance ?? walletOverview?.balance ?? 5420;
  const displayWalletBal = walletOverview?.formattedBalance || formatINR(rawBalance);

  // Copy UPI Handle helper
  const handleCopyUpi = (text) => {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  return (
    <DashboardLayout
      title="Financial Dashboard"
      subtitle="Digital payments, escrow wallet balance, banking connections, and BBPS utility bills"
      onRefresh={loadOverviewData}
    >
      {/* ========================================================= */}
      {/* 1. TOP HERO: PERSONALIZED GREETING & STATUS BANNER       */}
      {/* ========================================================= */}
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
              <SparklesIcon size={14} style={{ color: '#00F2FE' }} />
              <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#FFFFFF', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                {getGreeting()}
              </span>
            </div>
            <h1 className="hero-title">
              Welcome back, {firstName}!
            </h1>
            <p className="hero-subtitle">
              Your digital payments, banking connections and utility settlements — all unified in one secure dashboard.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setScanPayModalOpen(true)}
                className="hero-cta-btn"
                title="Initiate Quick Payment"
              >
                <SendIcon size={15} />
                <span>Quick Pay</span>
              </button>
              <button
                onClick={() => setQrModalOpen(true)}
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
                <QrCodeIcon size={15} />
                <span>My QR Code</span>
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
                <ShieldCheckIcon size={22} />
              </div>
              <div style={{ fontSize: '9px', color: '#00E599', fontWeight: '800', marginTop: '6px', letterSpacing: '0.5px' }}>
                100% SECURE
              </div>
            </div>
          </div>
        </div>

        {/* Live Wallet Balance Card */}
        <div className="quick-wallet-card">
          <div>
            <div className="quick-wallet-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="wallet-card-label">Available Wallet Balance</span>
                <button
                  type="button"
                  onClick={() => setShowBalance(!showBalance)}
                  style={{ background: 'transparent', border: 'none', color: '#A9BDD7', cursor: 'pointer', padding: 0 }}
                  title={showBalance ? 'Hide Balance' : 'Show Balance'}
                  aria-label="Toggle wallet balance visibility"
                >
                  {showBalance ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </button>
              </div>
              <div className="wallet-3d-icon-box">
                <WalletIcon size={22} />
              </div>
            </div>

            <div className="wallet-card-balance">
              {walletLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#A9BDD7', fontSize: '18px' }}>
                  <RefreshCwIcon size={18} style={{ animation: 'spin 1s linear infinite', color: '#00A8FF' }} />
                  <span>Loading...</span>
                </div>
              ) : showBalance ? (
                displayWalletBal
              ) : (
                '₹ • • • • •'
              )}
            </div>

            <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00E599' }} />
              <span>Escrow Protected • Double-Entry Ledger</span>
            </div>
          </div>

          <div className="wallet-card-actions">
            <button
              onClick={() => setAddMoneyModalOpen(true)}
              className="wallet-add-btn"
            >
              <span>+ Add Money</span>
            </button>
            <button
              onClick={() => navigate('/app/wallet')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#00D5FF',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>View Ledger</span>
              <ArrowRightIcon size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. HIGH PRIORITY: PHONEPE-STYLE 4 TOP QUICK ACTIONS       */}
      {/* ========================================================= */}
      <div className="quick-actions-strip">
        {/* Action 1: Scan & Pay */}
        <div
          onClick={() => setScanPayModalOpen(true)}
          className="quick-action-btn"
          title="Scan QR Code or Enter UPI ID"
        >
          <div className="quick-action-icon-wrap" style={{ background: 'rgba(0, 168, 255, 0.15)', color: '#00A8FF' }}>
            <QrCodeIcon size={24} />
          </div>
          <div className="quick-action-label">Scan & Pay</div>
          <div className="quick-action-desc">QR & Instant UPI</div>
        </div>

        {/* Action 2: Send Money */}
        <div
          onClick={() => navigate('/app/upi')}
          className="quick-action-btn"
          title="Send to Mobile Number or UPI VPA"
        >
          <div className="quick-action-icon-wrap" style={{ background: 'rgba(0, 229, 153, 0.15)', color: '#00E599' }}>
            <SendIcon size={24} />
          </div>
          <div className="quick-action-label">Send Money</div>
          <div className="quick-action-desc">To Mobile or UPI</div>
        </div>

        {/* Action 3: Bank Transfer */}
        <div
          onClick={() => navigate('/app/banks')}
          className="quick-action-btn"
          title="Transfer funds to linked bank accounts"
        >
          <div className="quick-action-icon-wrap" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#C084FC' }}>
            <LandmarkIcon size={24} />
          </div>
          <div className="quick-action-label">Bank Transfer</div>
          <div className="quick-action-desc">Direct IMPS / NEFT</div>
        </div>

        {/* Action 4: My QR Code */}
        <div
          onClick={() => setQrModalOpen(true)}
          className="quick-action-btn"
          title="View your personal ApnaPay QR Code"
        >
          <div className="quick-action-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
            <QrCodeIcon size={24} />
          </div>
          <div className="quick-action-label">My QR Code</div>
          <div className="quick-action-desc">Receive UPI Money</div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. HIGH PRIORITY: RECHARGE & BILL PAYMENTS SECTION        */}
      {/* ========================================================= */}
      <div style={{ marginTop: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF', margin: 0, letterSpacing: '-0.3px' }}>
              Recharge & Bills
            </h2>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#00E599', background: 'rgba(0, 229, 153, 0.12)', border: '1px solid rgba(0, 229, 153, 0.3)', padding: '2px 8px', borderRadius: '12px' }}>
              BBPS Assured
            </span>
          </div>
          <button
            onClick={() => navigate('/app/bills')}
            style={{ background: 'transparent', border: 'none', color: '#00A8FF', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <span>View All Billers</span>
            <ArrowRightIcon size={14} />
          </button>
        </div>

        {/* 6 Category Tiles */}
        <div className="recharge-bills-grid">
          {[
            { id: 'mobile_postpaid', label: 'Mobile Recharge', icon: SmartphoneIcon, color: '#00A8FF', bg: 'rgba(0, 168, 255, 0.12)' },
            { id: 'electricity', label: 'Electricity Bill', icon: ZapIcon, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
            { id: 'water', label: 'Water Bill', icon: DropletIcon, color: '#00D5FF', bg: 'rgba(0, 213, 255, 0.12)' },
            { id: 'gas', label: 'Gas Cylinder', icon: FlameIcon, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
            { id: 'dth', label: 'DTH TV', icon: TvIcon, color: '#A855F7', bg: 'rgba(168, 85, 247, 0.12)' },
            { id: 'broadband', label: 'Broadband / Wifi', icon: WifiIcon, color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' }
          ].map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => {
                  handleCategoryChange(cat.id);
                  navigate(`/app/bills?category=${cat.id}`);
                }}
                className="recharge-bill-card"
                title={`Pay ${cat.label}`}
              >
                <div className="recharge-icon-bubble" style={{ background: cat.bg, color: cat.color }}>
                  <Icon size={20} />
                </div>
                <div className="recharge-card-name">{cat.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. TWO-COLUMN: INTERACTIVE BILL WIDGET & RECENT TXNS      */}
      {/* ========================================================= */}
      <div className="bottom-widgets-grid">
        {/* Left Column: Quick Biller Search & Interactive Pay */}
        <div className="widget-box">
          <div className="widget-box-header">
            <div className="widget-header-left">
              <div className="widget-icon-box">
                <ReceiptIcon size={20} />
              </div>
              <div>
                <h3 className="widget-title">Quick Bill Payment</h3>
                <p className="widget-subtitle">Select category or search operator</p>
              </div>
            </div>
            <div className="demo-mode-badge" title="Simulation mode enabled">
              <span>Demo Mode</span>
              <InfoIcon size={12} />
            </div>
          </div>

          <div className="bill-widget-body">
            {/* Column 1: Category Picker */}
            <div className="bill-categories-col">
              {[
                { id: 'electricity', label: 'Electricity', icon: ZapIcon },
                { id: 'water', label: 'Water', icon: DropletIcon },
                { id: 'gas', label: 'Gas', icon: FlameIcon },
                { id: 'dth', label: 'DTH', icon: TvIcon },
                { id: 'mobile_postpaid', label: 'Mobile', icon: SmartphoneIcon }
              ].map((c) => {
                const Icon = c.icon;
                const isActive = activeBillCategory === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleCategoryChange(c.id)}
                    className={`bill-cat-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={14} />
                    <span>{c.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Column 2: Biller List & Search */}
            <div className="bill-search-col">
              <div className="biller-search-input-wrap">
                <div style={{ position: 'absolute', left: '10px', color: '#6B87A8', display: 'flex' }}>
                  <SearchIcon size={13} />
                </div>
                <input
                  type="text"
                  value={billerSearch}
                  onChange={(e) => setBillerSearch(e.target.value)}
                  placeholder={`Search ${activeBillCategory} billers...`}
                  className="biller-search-input"
                />
              </div>

              <div className="biller-list-scroll">
                {filteredBillers.map((biller) => (
                  <div
                    key={biller.billerId}
                    onClick={() => navigate(`/app/bills?category=${activeBillCategory}&billerId=${biller.billerId}`)}
                    className="biller-item-pill"
                    title={`Pay ${biller.billerName}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <div className="biller-logo-badge">
                        {biller.billerName.slice(0, 3)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="biller-name-text">
                          {biller.billerName}
                        </div>
                        <div className="biller-state-text">
                          {biller.state || 'India'}
                        </div>
                      </div>
                    </div>
                    <ChevronRightIcon size={14} style={{ color: '#6B87A8', flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Quick Pay Promo Card */}
            <div
              onClick={() => navigate('/app/bills')}
              className="bill-promo-card"
              title="Click to Pay Bills"
            >
              <div className="bill-promo-icon">
                <ReceiptIcon size={24} />
              </div>
              <div className="bill-promo-title">
                Pay Bills Anytime, Anywhere
              </div>
              <div className="bill-promo-sub">
                Instant • Secure • Reliable
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Transactions Modern Card */}
        <div className="widget-box">
          <div className="widget-box-header">
            <div className="widget-header-left">
              <div className="widget-icon-box" style={{ background: 'rgba(0, 229, 153, 0.12)', color: '#00E599' }}>
                <HistoryIcon size={20} />
              </div>
              <div>
                <h3 className="widget-title">Recent Transactions</h3>
                <p className="widget-subtitle">Latest 5 financial ledger entries</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/app/transactions')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#00A8FF',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>View All</span>
              <ArrowRightIcon size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {txnsLoading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#A9BDD7' }}>
                <RefreshCwIcon size={20} style={{ animation: 'spin 1s linear infinite', color: '#00A8FF', marginBottom: '8px' }} />
                <div style={{ fontSize: '12px' }}>Loading transactions...</div>
              </div>
            ) : recentTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#A9BDD7' }}>
                <HistoryIcon size={32} style={{ color: '#334155', marginBottom: '8px' }} />
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF' }}>No Transactions Yet</div>
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                  Start by sending money or paying a utility bill.
                </div>
              </div>
            ) : (
              recentTransactions.slice(0, 5).map((txn) => {
                const isCredit = String(txn.transaction_type || txn.type).toLowerCase() === 'credit';
                const status = String(txn.status || 'completed').toLowerCase();
                const isSuccess = status === 'completed' || status === 'success';
                const isPending = status === 'pending';

                return (
                  <div
                    key={txn.id || txn.transaction_id || Math.random()}
                    onClick={() => navigate('/app/transactions')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: '#071426',
                      border: '1px solid #17385D',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#00A8FF';
                      e.currentTarget.style.background = '#0C2038';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#17385D';
                      e.currentTarget.style.background = '#071426';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        background: isCredit ? 'rgba(0, 229, 153, 0.12)' : 'rgba(0, 168, 255, 0.12)',
                        color: isCredit ? '#00E599' : '#00A8FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isCredit ? <ArrowDownLeftIcon size={16} /> : <ArrowUpRightIcon size={16} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {txn.description || (isCredit ? 'Received Money' : 'UPI Payment')}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>
                          {formatDateTime(txn.created_at || txn.date)}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: '800', color: isCredit ? '#00E599' : '#FFFFFF' }}>
                        {isCredit ? '+' : '-'} {formatINR(txn.amount)}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        color: isSuccess ? '#10B981' : isPending ? '#F59E0B' : '#EF4444',
                        marginTop: '2px'
                      }}>
                        {status}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. MEDIUM PRIORITY: LINKED BANK & UPI DUAL SECTION        */}
      {/* ========================================================= */}
      <div className="banking-summary-grid">
        {/* Linked Banks Card */}
        <div className="banking-summary-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0, 168, 255, 0.12)', color: '#00A8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LandmarkIcon size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                    Linked Bank Accounts
                  </h4>
                  <span style={{ fontSize: '11.5px', color: '#A9BDD7' }}>
                    {bankAccounts.length} Connected Account{bankAccounts.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate('/app/banks')}
                style={{ background: 'transparent', border: 'none', color: '#00A8FF', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                + Link New
              </button>
            </div>

            {primaryBank ? (
              <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>
                    {primaryBank.bankName || primaryBank.bank_name || 'Bank Account'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#A9BDD7', fontFamily: 'monospace', marginTop: '2px' }}>
                    •••• •••• {primaryBank.accountNumber ? primaryBank.accountNumber.slice(-4) : primaryBank.account_last4 || '1234'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                    IFSC: {primaryBank.ifscCode || primaryBank.ifsc_code || 'SBIN0011111'}
                  </div>
                </div>
                <span style={{ background: 'rgba(0, 229, 153, 0.15)', color: '#00E599', border: '1px solid rgba(0, 229, 153, 0.35)', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '10px' }}>
                  PRIMARY
                </span>
              </div>
            ) : (
              <div style={{ background: '#071426', border: '1px dashed #17385D', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#A9BDD7' }}>No bank accounts linked yet.</div>
                <button
                  onClick={() => navigate('/app/banks')}
                  className="auth-button"
                  style={{ width: 'auto', padding: '6px 14px', fontSize: '12px', height: '32px', marginTop: '8px' }}
                >
                  Link Bank Account
                </button>
              </div>
            )}
          </div>

          <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#64748B' }}>NPCI Verified Banking Sandbox</span>
            <button
              onClick={() => navigate('/app/banks')}
              style={{ background: 'transparent', border: 'none', color: '#00D5FF', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Manage Accounts</span>
              <ArrowRightIcon size={12} />
            </button>
          </div>
        </div>

        {/* UPI Handles Card */}
        <div className="banking-summary-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0, 229, 153, 0.12)', color: '#00E599', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldIcon size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                    UPI Services & VPAs
                  </h4>
                  <span style={{ fontSize: '11.5px', color: '#A9BDD7' }}>
                    {upiHandles.length || 1} Active VPA Handle{upiHandles.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setQrModalOpen(true)}
                style={{ background: 'transparent', border: 'none', color: '#00E599', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <QrCodeIcon size={14} />
                <span>Show QR</span>
              </button>
            </div>

            <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Primary UPI Address
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#00D5FF', fontFamily: 'monospace', marginTop: '2px' }}>
                  {primaryUpi}
                </div>
                <div style={{ fontSize: '11px', color: '#00E599', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00E599' }} />
                  <span>Ready for incoming UPI payments</span>
                </div>
              </div>
              <button
                onClick={() => handleCopyUpi(primaryUpi)}
                className="auth-button secondary"
                style={{ width: 'auto', padding: '0 10px', height: '32px', fontSize: '11px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Copy UPI Address"
              >
                {copiedUpi ? <CheckIcon size={13} style={{ color: '#00E599' }} /> : <CopyIcon size={13} />}
                <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#64748B' }}>@apnapay Verified Virtual Address</span>
            <button
              onClick={() => navigate('/app/upi')}
              style={{ background: 'transparent', border: 'none', color: '#00D5FF', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Manage UPI VPAs</span>
              <ArrowRightIcon size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. ALL SERVICES: ORGANIZED 10-SERVICE GRID                */}
      {/* ========================================================= */}
      <div style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF', margin: 0, letterSpacing: '-0.3px' }}>
              All Services
            </h2>
            <p style={{ fontSize: '12.5px', color: '#A9BDD7', margin: '3px 0 0' }}>
              Complete suite of payments, banking, investment assets & security tools
            </p>
          </div>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            10 Modules Active
          </span>
        </div>

        <div className="all-services-grid">
          {[
            { id: 'wallet', title: 'Wallet & Ledger', desc: 'Escrow balance & settlements', icon: WalletIcon, path: '/app/wallet', color: '#00D5FF' },
            { id: 'transfers', title: 'Money Transfers', desc: 'Instant P2P & bank payouts', icon: SendIcon, path: '/app/transfers', color: '#00A8FF' },
            { id: 'payments', title: 'Payments Gateway', desc: 'Manage checkout orders & logs', icon: CreditCardIcon, path: '/app/payments', color: '#A855F7' },
            { id: 'banks', title: 'Bank Accounts', desc: 'Link and manage accounts', icon: LandmarkIcon, path: '/app/banks', color: '#00E599' },
            { id: 'upi', title: 'UPI Services', desc: 'VPAs, QR and instant payments', icon: SmartphoneIcon, path: '/app/upi', color: '#00D5FF' },
            { id: 'qr', title: 'QR Payments', desc: 'Dynamic QR codes & scan & pay', icon: QrCodeIcon, path: '/app/qr', color: '#38BDF8' },
            { id: 'recharge', title: 'Mobile Recharge', desc: 'Prepaid, postpaid & DTH plans', icon: SmartphoneIcon, path: '/app/recharge', color: '#F59E0B' },
            { id: 'bills', title: 'Bill Payments', desc: 'Electricity, Gas, Water & Utility', icon: ReceiptIcon, path: '/app/bills', color: '#FB923C' },
            { id: 'sip', title: 'SIP & Wealth', desc: 'Systematic mutual fund investments', icon: TrendingUpIcon, path: '/app/sip', color: '#34D399' },
            { id: 'land', title: 'Digital Land', desc: 'Fractional land parcel units', icon: LayersIcon, path: '/app/land', color: '#E879F9' },
            { id: 'txns', title: 'Transaction History', desc: 'Audit statements & receipts', icon: HistoryIcon, path: '/app/transactions', color: '#818CF8' },
            { id: 'disputes', title: 'Disputes & Claims', desc: 'File claims & track resolution', icon: ShieldCheckIcon, path: '/app/disputes', color: '#FB7185' },
            { id: 'kyc', title: 'KYC Verification', desc: 'Government identity proof', icon: ShieldIcon, path: '/app/kyc', color: '#FCD34D' },
            { id: 'profile', title: 'Profile & Settings', desc: 'Security, limits and preferences', icon: UserIcon, path: '/app/profile', color: '#94A3B8' }
          ].map((srv) => {
            const Icon = srv.icon;
            return (
              <div
                key={srv.id}
                onClick={srv.onClick ? srv.onClick : () => navigate(srv.path)}
                className="all-service-card"
                title={`Open ${srv.title}`}
              >
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${srv.color}35`,
                  color: srv.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px'
                }}>
                  <Icon size={22} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF', marginBottom: '2px' }}>
                  {srv.title}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.3 }}>
                  {srv.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 7. INFORMATIONAL TRUST, SUPPORT & DISCLAIMER BANNER       */}
      {/* ========================================================= */}
      <div className="trust-security-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(0, 229, 153, 0.15)', color: '#00E599', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldCheckIcon size={24} />
          </div>
          <div>
            <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#FFFFFF' }}>
              ApnaPay 100% Secure Sandbox Payment Gateway
            </div>
            <div style={{ fontSize: '12px', color: '#A9BDD7', marginTop: '3px', lineHeight: 1.4 }}>
              ApnaPay is a demonstration application. Payments and financial services displayed here are simulated and are not real financial transactions. Bank-grade 256-bit SSL encryption • NPCI simulated UPI protocols • Instant settlement alerts.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/app/profile')}
            className="auth-button secondary"
            style={{ width: 'auto', height: '34px', padding: '0 14px', fontSize: '12px', margin: 0 }}
          >
            Profile & Settings
          </button>
          <button
            onClick={() => setInfoModal({
              title: 'ApnaPay Help & Support',
              content: 'For assistance with simulated payments, wallet escrow balances, or banking integrations in this demo environment, please review the Profile & KYC settings or contact support at support@apnapay.com.'
            })}
            className="auth-button secondary"
            style={{ width: 'auto', height: '34px', padding: '0 14px', fontSize: '12px', margin: 0 }}
          >
            Help & Support
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: MY QR CODE MODAL (REACT PORTAL)                  */}
      {/* ========================================================= */}
      {qrModalOpen && createPortal(
        <div
          className="admin-land-modal-overlay"
          onClick={() => setQrModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-land-modal-container"
            style={{ maxWidth: '420px', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-land-modal-header">
              <div className="admin-land-modal-header-title">
                <QrCodeIcon size={20} style={{ color: '#00A8FF' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  Receive Money via UPI QR
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="admin-land-modal-close-btn"
                title="Close"
              >
                <XIcon size={16} />
              </button>
            </div>

            <div className="admin-land-modal-body" style={{ alignItems: 'center', textAlign: 'center' }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '20px',
                display: 'inline-block',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
              }}>
                {/* SVG Stylized QR Mockup */}
                <div style={{ width: '180px', height: '180px', background: '#050D1B', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCodeIcon size={150} style={{ color: '#00D5FF' }} />
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: '800', color: '#071426' }}>
                  ApnaPay Bharat UPI
                </div>
              </div>

              <div style={{ marginTop: '14px' }}>
                <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Your Active UPI VPA
                </div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#00D5FF', fontFamily: 'monospace', marginTop: '2px' }}>
                  {primaryUpi}
                </div>
              </div>

              <p style={{ fontSize: '12px', color: '#A9BDD7', margin: '6px 0 0', lineHeight: 1.4 }}>
                Scan using any UPI App (Google Pay, PhonePe, Paytm, BHIM) to send funds directly to your ApnaPay account.
              </p>
            </div>

            <div className="admin-land-modal-footer" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => handleCopyUpi(primaryUpi)}
                className="auth-button"
                style={{ width: '100%', height: '38px', fontSize: '13px', margin: 0 }}
              >
                {copiedUpi ? '✓ UPI Address Copied' : 'Copy UPI Address'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL 2: SCAN & PAY MODAL (REACT PORTAL)                  */}
      {/* ========================================================= */}
      {scanPayModalOpen && createPortal(
        <div
          className="admin-land-modal-overlay"
          onClick={() => setScanPayModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-land-modal-container"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-land-modal-header">
              <div className="admin-land-modal-header-title">
                <SendIcon size={18} style={{ color: '#00A8FF' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  Scan & Pay / Quick Transfer
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setScanPayModalOpen(false)}
                className="admin-land-modal-close-btn"
                title="Close"
              >
                <XIcon size={16} />
              </button>
            </div>

            <div className="admin-land-modal-body">
              <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '14px' }}>
                <label style={{ fontSize: '12px', color: '#A9BDD7', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                  Receiver UPI ID or 10-Digit Mobile Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. merchant@apnapay or 9876543210"
                  value={scanUpiInput}
                  onChange={(e) => setScanUpiInput(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    background: '#0B1B32',
                    border: '1px solid #1E3A5F',
                    borderRadius: '8px',
                    padding: '0 12px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ marginTop: '12px' }}>
                <label style={{ fontSize: '12px', color: '#A9BDD7', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                  Quick Amount Presets
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {['100', '250', '500', '1000'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setQuickAmount(amt)}
                      style={{
                        padding: '8px 0',
                        borderRadius: '8px',
                        border: quickAmount === amt ? '1px solid #00A8FF' : '1px solid #17385D',
                        background: quickAmount === amt ? 'rgba(0, 168, 255, 0.15)' : '#071426',
                        color: quickAmount === amt ? '#00A8FF' : '#FFFFFF',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: 'rgba(0, 168, 255, 0.08)', border: '1px solid rgba(0, 168, 255, 0.2)', borderRadius: '8px', padding: '10px 12px', fontSize: '11.5px', color: '#A9BDD7', lineHeight: 1.4 }}>
                Instant settlement from your available balance ({displayWalletBal}). Simulated in demo mode.
              </div>
            </div>

            <div className="admin-land-modal-footer">
              <button
                type="button"
                onClick={() => setScanPayModalOpen(false)}
                className="auth-button secondary"
                style={{ width: 'auto', padding: '0 16px', height: '38px', fontSize: '13px', margin: 0 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setScanPayModalOpen(false);
                  navigate('/app/upi');
                }}
                className="auth-button"
                style={{ width: 'auto', padding: '0 20px', height: '38px', fontSize: '13px', margin: 0 }}
              >
                Continue to Transfer →
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL 3: QUICK ADD MONEY MODAL (REACT PORTAL)             */}
      {/* ========================================================= */}
      {addMoneyModalOpen && createPortal(
        <div
          className="admin-land-modal-overlay"
          onClick={() => setAddMoneyModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-land-modal-container"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-land-modal-header">
              <div className="admin-land-modal-header-title">
                <WalletIcon size={18} style={{ color: '#00E599' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  Add Money to Wallet
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAddMoneyModalOpen(false)}
                className="admin-land-modal-close-btn"
                title="Close"
              >
                <XIcon size={16} />
              </button>
            </div>

            <div className="admin-land-modal-body">
              <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase' }}>Current Balance</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF' }}>{displayWalletBal}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase' }}>Deposit Status</div>
                  <span style={{ fontSize: '11px', color: '#00E599', fontWeight: '700' }}>● Active</span>
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <label style={{ fontSize: '12px', color: '#A9BDD7', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                  Select Top-up Amount
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {['200', '500', '1000', '2000'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setQuickAmount(amt)}
                      style={{
                        padding: '10px 0',
                        borderRadius: '8px',
                        border: quickAmount === amt ? '1px solid #00E599' : '1px solid #17385D',
                        background: quickAmount === amt ? 'rgba(0, 229, 153, 0.15)' : '#071426',
                        color: quickAmount === amt ? '#00E599' : '#FFFFFF',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: 'rgba(0, 229, 153, 0.08)', border: '1px solid rgba(0, 229, 153, 0.25)', borderRadius: '8px', padding: '10px 12px', fontSize: '11.5px', color: '#A9BDD7', lineHeight: 1.4 }}>
                Funds are immediately credited to your double-entry escrow ledger. You can transfer, pay utility bills, or invest in Digital Land parcels.
              </div>
            </div>

            <div className="admin-land-modal-footer">
              <button
                type="button"
                onClick={() => setAddMoneyModalOpen(false)}
                className="auth-button secondary"
                style={{ width: 'auto', padding: '0 16px', height: '38px', fontSize: '13px', margin: 0 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddMoneyModalOpen(false);
                  navigate('/app/wallet');
                }}
                className="auth-button"
                style={{
                  width: 'auto',
                  padding: '0 20px',
                  height: '38px',
                  fontSize: '13px',
                  margin: 0,
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: '700'
                }}
              >
                Proceed to Deposit ₹{quickAmount} →
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL 4: INFORMATIONAL POPUP MODAL (REACT PORTAL)         */}
      {/* ========================================================= */}
      {infoModal && createPortal(
        <div
          className="admin-land-modal-overlay"
          onClick={() => setInfoModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-land-modal-container"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-land-modal-header">
              <div className="admin-land-modal-header-title">
                <InfoIcon size={18} style={{ color: '#00A8FF' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  {infoModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="admin-land-modal-close-btn"
                title="Close"
              >
                <XIcon size={16} />
              </button>
            </div>

            <div className="admin-land-modal-body">
              <p style={{ color: '#E2E8F0', fontSize: '13.5px', lineHeight: 1.5, margin: 0 }}>
                {infoModal.content}
              </p>
            </div>

            <div className="admin-land-modal-footer" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="auth-button secondary"
                style={{ width: 'auto', padding: '0 18px', height: '36px', fontSize: '13px', margin: 0 }}
              >
                Got It
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </DashboardLayout>
  );
};

export default CustomerDashboardOverview;
