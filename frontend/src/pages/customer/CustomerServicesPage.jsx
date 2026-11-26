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
  SparklesIcon,
  HelpCircleIcon,
  ShareIcon,
  DownloadIcon,
  MapPinIcon,
  GiftIcon,
  GridIcon
} from '../../components/Icons';
import bankAccountService from '../../services/bankAccountService';
import upiService from '../../services/upiService';
import walletService from '../../services/walletService';
import landService from '../../services/landService';

const CustomerServicesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'featured' | 'banking' | 'bills' | 'investments' | 'rewards'

  // Live Data states
  const [walletOverview, setWalletOverview] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [upiHandles, setUpiHandles] = useState([]);
  const [landProjects, setLandProjects] = useState([]);
  const [landHoldingsSummary, setLandHoldingsSummary] = useState({ totalUnitsHeld: 0, totalInvestedValue: 0 });
  const [featuredLandProject, setFeaturedLandProject] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Modals state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [scanPayModalOpen, setScanPayModalOpen] = useState(false);
  const [sipModalOpen, setSipModalOpen] = useState(false);
  const [rewardsModalOpen, setRewardsModalOpen] = useState(false);
  const [quickTransferModalOpen, setQuickTransferModalOpen] = useState(false);

  // Interactive interaction states
  const [toastMessage, setToastMessage] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [scanUpiInput, setScanUpiInput] = useState('');
  const [quickAmount, setQuickAmount] = useState('500');

  // SIP Simulator interactive state
  const [sipFrequency, setSipFrequency] = useState('daily');
  const [sipAmount, setSipAmount] = useState('50');
  const [sipHorizonYears, setSipHorizonYears] = useState(3);

  // Rewards simulation state
  const [scratchCardRevealed, setScratchCardRevealed] = useState(false);

  // Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? '' : cur));
    }, 2800);
  };

  // Lock body scroll when any modal is open
  useEffect(() => {
    const hasActiveModal = Boolean(
      qrModalOpen ||
      scanPayModalOpen ||
      sipModalOpen ||
      rewardsModalOpen ||
      quickTransferModalOpen
    );
    if (hasActiveModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [qrModalOpen, scanPayModalOpen, sipModalOpen, rewardsModalOpen, quickTransferModalOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setQrModalOpen(false);
        setScanPayModalOpen(false);
        setSipModalOpen(false);
        setRewardsModalOpen(false);
        setQuickTransferModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch live services data
  const loadServicesData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [walletRes, banksRes, upiRes, landRes, holdingsRes] = await Promise.all([
        walletService.getOverview().catch(() => ({ data: null })),
        bankAccountService.getLinkedAccounts().catch(() => ({ data: [] })),
        upiService.getUpiHandles().catch(() => ({ data: [] })),
        landService.getProjects({ page: 1, limit: 6 }).catch(() => ({ data: { projects: [] } })),
        landService.getHoldings({ page: 1, limit: 10 }).catch(() => ({ data: { holdings: [], portfolioSummary: {} } }))
      ]);

      if (walletRes?.data) setWalletOverview(walletRes.data);
      if (banksRes?.data) setBankAccounts(banksRes.data);
      if (upiRes?.data) setUpiHandles(upiRes.data);

      if (landRes?.data?.projects?.length) {
        setLandProjects(landRes.data.projects);
        setFeaturedLandProject(landRes.data.projects[0]);
      } else {
        setFeaturedLandProject({
          title: 'Cyber City Commercial Parcel',
          city: 'Gurgaon',
          state: 'Haryana',
          price_per_unit: 1000,
          available_units: 850,
          total_units: 1000,
          risk_category: 'Low',
          asset_type: 'Commercial Grade-A'
        });
      }

      if (holdingsRes?.data?.portfolioSummary) {
        setLandHoldingsSummary(holdingsRes.data.portfolioSummary);
      }
    } catch (err) {
      console.warn('Failed to load services data:', err.message);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServicesData();
  }, [loadServicesData]);

  // Primary UPI handle & Bank
  const primaryUpi = upiHandles.find((u) => u.isPrimary)?.upiId ||
    upiHandles[0]?.upiId ||
    `${user?.phone || '8602612434'}@apnapay`;

  const primaryBank = bankAccounts.find((b) => b.isPrimary) || bankAccounts[0];
  const primaryBankName = primaryBank?.bankName || primaryBank?.bank_name || 'ICICI Bank';
  const primaryBankLast4 = primaryBank?.accountNumber ? primaryBank.accountNumber.slice(-4) : (primaryBank?.account_last4 || '9123');

  // Copy helper
  const handleCopyUpi = (text) => {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedUpi(true);
      showToast('UPI ID copied to clipboard!');
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  // SIP calculation helper
  const calculateSipReturn = () => {
    const amt = parseFloat(sipAmount) || 50;
    const r = 0.12 / 12; // 12% annual rate monthly
    const totalMonths = sipHorizonYears * 12;
    const monthlyAmt = sipFrequency === 'daily' ? amt * 30 : amt;
    const invested = monthlyAmt * totalMonths;
    const futureVal = monthlyAmt * ((Math.pow(1 + r, totalMonths) - 1) / r) * (1 + r);
    return {
      invested: Math.round(invested),
      futureVal: Math.round(futureVal),
      profit: Math.round(futureVal - invested)
    };
  };

  const sipResult = calculateSipReturn();

  // Services list metadata
  const servicesCatalog = [
    {
      id: 'money_transfer',
      category: 'banking',
      title: 'Money Transfer',
      desc: 'Send instantly to mobile number, bank account (IMPS/NEFT) or UPI VPA with zero fees.',
      icon: SendIcon,
      color: '#087BFF',
      badge: 'Instant 24x7',
      badgeColor: 'blue',
      actions: [
        { label: 'To Mobile / UPI', onClick: () => navigate('/app/upi') },
        { label: 'To Bank Account', onClick: () => navigate('/app/banks') }
      ]
    },
    {
      id: 'bank_accounts',
      category: 'banking',
      title: 'Bank Accounts & UPI',
      desc: 'Connect verified Indian banks, configure @apnapay handles and manage primary accounts.',
      icon: BankIcon,
      color: '#00E599',
      badge: `${bankAccounts.length || 1} Linked`,
      badgeColor: 'green',
      actions: [
        { label: 'Manage Accounts', onClick: () => navigate('/app/banks') },
        { label: 'UPI VPAs', onClick: () => navigate('/app/upi') }
      ]
    },
    {
      id: 'scan_qr',
      category: 'banking',
      title: 'Scan QR & Pay',
      desc: 'Scan any Bharat UPI, PhonePe, Paytm or Google Pay QR code for instant audited settlement.',
      icon: QrCodeIcon,
      color: '#00D5FF',
      badge: 'Zero Fee',
      badgeColor: 'cyan',
      actions: [
        { label: 'Scan Camera', onClick: () => setScanPayModalOpen(true) },
        { label: 'My QR Code', onClick: () => setQrModalOpen(true) }
      ]
    },
    {
      id: 'recharge_bills',
      category: 'bills',
      title: 'Recharge & Bills',
      desc: 'BBPS assured payments for Mobile Recharge, Electricity, Water, Gas, DTH, Broadband & Fastag.',
      icon: ReceiptIcon,
      color: '#F59E0B',
      badge: 'BBPS Assured',
      badgeColor: 'yellow',
      actions: [
        { label: 'Mobile Recharge', onClick: () => navigate('/app/bills?category=mobile_postpaid') },
        { label: 'Electricity Bill', onClick: () => navigate('/app/bills?category=electricity') },
        { label: 'View All Billers', onClick: () => navigate('/app/bills') }
      ]
    },
    {
      id: 'rewards_offers',
      category: 'rewards',
      title: 'Rewards & Offers',
      desc: 'Scratch cards, cashback rewards, referral bonuses and verified partner merchant discounts.',
      icon: GiftIcon,
      color: '#A855F7',
      badge: '₹200 Bonus',
      badgeColor: 'purple',
      actions: [
        { label: 'Scratch Cards', onClick: () => setRewardsModalOpen(true) },
        { label: 'View Offers', onClick: () => setRewardsModalOpen(true) }
      ]
    },
    {
      id: 'transaction_history',
      category: 'banking',
      title: 'Transaction History',
      desc: 'Complete ledger records with credit/debit filters, date ranges, and official receipt downloads.',
      icon: HistoryIcon,
      color: '#38BDF8',
      badge: 'Ledger Synced',
      badgeColor: 'blue',
      actions: [
        { label: 'View Statements', onClick: () => navigate('/app/transactions') }
      ]
    }
  ];

  // Filtered Services based on search and active filter chip
  const filteredServices = servicesCatalog.filter((s) => {
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'featured' && (s.id === 'digital_land' || s.id === 'sip_investments')) ||
      s.category === activeFilter;

    const matchesSearch =
      searchQuery.trim() === '' ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <DashboardLayout
      title="Services Hub"
      subtitle="Complete suite of digital payments, banking connections, wealth planning & exclusive digital land assets"
      backFallback="/app"
      onRefresh={loadServicesData}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #071426, #0B1B32)',
            border: '1px solid #00D5FF',
            color: '#FFFFFF',
            padding: '10px 22px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: '700',
            boxShadow: '0 12px 36px rgba(0, 168, 255, 0.45)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircleIcon size={16} style={{ color: '#00E599' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. TOP HEADER & SEARCH / FILTER SECTION                   */}
      {/* ========================================================= */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#FFFFFF', margin: 0, letterSpacing: '-0.4px' }}>
              Services Hub
            </h1>
            <p style={{ fontSize: '13px', color: '#A9BDD7', margin: '3px 0 0' }}>
              All financial utilities, payment rails, fractional property assets & systematic wealth tools in one place
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setScanPayModalOpen(true)}
              className="auth-button"
              style={{ width: 'auto', height: '36px', padding: '0 16px', fontSize: '12.5px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <QrCodeIcon size={15} />
              <span>Scan QR</span>
            </button>
            <button
              onClick={() => setQrModalOpen(true)}
              className="auth-button secondary"
              style={{ width: 'auto', height: '36px', padding: '0 14px', fontSize: '12.5px', margin: 0 }}
            >
              My QR
            </button>
          </div>
        </div>

        {/* Search Bar & Filter Chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <SearchIcon size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: '#64748B' }} />
            <input
              type="text"
              placeholder="Search services, money transfers, billers, digital land, or SIP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '44px',
                background: '#071426',
                border: '1px solid #17385D',
                borderRadius: '12px',
                padding: '0 14px 0 40px',
                color: '#FFFFFF',
                fontSize: '13.5px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={(e) => (e.target.style.borderColor = '#00A8FF')}
              onBlur={(e) => (e.target.style.borderColor = '#17385D')}
            />
          </div>

          {/* Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { id: 'all', label: 'All Services' },
              { id: 'featured', label: '★ Featured (Land & SIP)' },
              { id: 'banking', label: 'Transfers & Banking' },
              { id: 'bills', label: 'Recharge & Bills' },
              { id: 'rewards', label: 'Rewards & Offers' }
            ].map((chip) => {
              const isActive = activeFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setActiveFilter(chip.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    border: isActive ? '1px solid #00D5FF' : '1px solid #17385D',
                    background: isActive ? 'rgba(0, 213, 255, 0.15)' : '#071426',
                    color: isActive ? '#00D5FF' : '#A9BDD7',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. FEATURED SERVICES (TOP PRIORITY: DIGITAL LAND & SIP)   */}
      {/* Visual Heroes placed at top of Services Hub               */}
      {/* ========================================================= */}
      {(activeFilter === 'all' || activeFilter === 'featured') && (
        <div style={{ marginBottom: '32px' }}>
          <div className="innovations-grid">
            {/* FEATURED SERVICE 1: DIGITAL LAND */}
            <div className="innovation-card land-featured">
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, rgba(8, 123, 255, 0.3), rgba(0, 213, 255, 0.3))',
                        border: '1.5px solid rgba(0, 213, 255, 0.45)',
                        color: '#00D5FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 6px 18px rgba(0, 168, 255, 0.35)'
                      }}
                    >
                      <LayersIcon size={26} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#FFFFFF', margin: 0, letterSpacing: '-0.3px' }}>
                        Digital Land
                      </h3>
                      <span style={{ fontSize: '11.5px', color: '#00D5FF', fontWeight: '700' }}>
                        Fractional Property Units on Ledger
                      </span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: '800',
                      color: '#00D5FF',
                      background: 'rgba(0, 213, 255, 0.15)',
                      border: '1px solid rgba(0, 213, 255, 0.4)',
                      padding: '3px 9px',
                      borderRadius: '8px'
                    }}
                  >
                    FEATURED ASSET
                  </span>
                </div>

                <p style={{ fontSize: '12.5px', color: '#CBD5E1', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                  Explore verified digital real estate parcels divided into liquid units. Every parcel transaction is immutably recorded on your double-entry escrow ledger.
                </p>

                {/* Live Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: 'rgba(7, 20, 38, 0.8)', border: '1px solid #1E3A5F', borderRadius: '10px', padding: '10px', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#A9BDD7', textTransform: 'uppercase' }}>Verified Parcels</div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF', marginTop: '2px' }}>
                      {landProjects.length || 4} Available
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#A9BDD7', textTransform: 'uppercase' }}>Your Portfolio</div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#00E599', marginTop: '2px' }}>
                      {landHoldingsSummary.totalUnitsHeld || 0} Units Held
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#A9BDD7', textTransform: 'uppercase' }}>Starting At</div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#00D5FF', marginTop: '2px' }}>
                      ₹{featuredLandProject?.price_per_unit || 1000}/unit
                    </div>
                  </div>
                </div>

                {/* Featured Project Spotlight */}
                {featuredLandProject && (
                  <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#FFFFFF' }}>
                        {featuredLandProject.title}
                      </span>
                      <span style={{ fontSize: '10px', color: '#00E599', fontWeight: '700' }}>
                        ● Grade-A Parcel
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#A9BDD7' }}>
                      <MapPinIcon size={12} style={{ color: '#00A8FF' }} />
                      <span>{featuredLandProject.city}, {featuredLandProject.state}</span>
                      <span>•</span>
                      <span>{featuredLandProject.available_units || 850} Available Units</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(0, 168, 255, 0.25)' }}>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  Audited Escrow Settlement
                </span>
                <button
                  onClick={() => navigate('/app/land')}
                  className="auth-button"
                  style={{
                    width: 'auto',
                    height: '36px',
                    padding: '0 18px',
                    fontSize: '12.5px',
                    margin: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #087BFF, #00D5FF)',
                    fontWeight: '800'
                  }}
                >
                  <span>Explore Digital Land</span>
                  <ArrowRightIcon size={13} />
                </button>
              </div>
            </div>

            {/* FEATURED SERVICE 2: SIP & INVESTMENTS */}
            <div className="innovation-card sip">
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.3), rgba(0, 229, 153, 0.3))',
                        border: '1.5px solid rgba(0, 229, 153, 0.45)',
                        color: '#00E599',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 6px 18px rgba(0, 229, 153, 0.35)'
                      }}
                    >
                      <TrendingUpIcon size={26} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#FFFFFF', margin: 0, letterSpacing: '-0.3px' }}>
                        SIP & Investments
                      </h3>
                      <span style={{ fontSize: '11.5px', color: '#00E599', fontWeight: '700' }}>
                        Automated Daily & Monthly Wealth Plans
                      </span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: '800',
                      color: '#00E599',
                      background: 'rgba(0, 229, 153, 0.15)',
                      border: '1px solid rgba(0, 229, 153, 0.4)',
                      padding: '3px 9px',
                      borderRadius: '8px'
                    }}
                  >
                    FROM ₹10/DAY
                  </span>
                </div>

                <p style={{ fontSize: '12.5px', color: '#CBD5E1', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                  Build wealth steadily through automated recurring allocations. Choose Daily Micro SIP or Monthly plans synchronized directly with your ApnaPay Escrow Wallet.
                </p>

                {/* 3 Prominent SIP Plan Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
                  <div
                    onClick={() => {
                      setSipFrequency('daily');
                      setSipAmount('10');
                      setSipModalOpen(true);
                    }}
                    style={{ background: '#071426', border: '1px solid #1E3A5F', borderRadius: '10px', padding: '10px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00E599')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1E3A5F')}
                  >
                    <div style={{ fontSize: '10px', color: '#A9BDD7', fontWeight: '700' }}>Daily Micro</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#00E599', marginTop: '2px' }}>₹10/day</div>
                    <div style={{ fontSize: '9.5px', color: '#64748B', marginTop: '2px' }}>Zero friction</div>
                  </div>

                  <div
                    onClick={() => {
                      setSipFrequency('monthly');
                      setSipAmount('250');
                      setSipModalOpen(true);
                    }}
                    style={{ background: '#071426', border: '1px solid #1E3A5F', borderRadius: '10px', padding: '10px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00D5FF')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1E3A5F')}
                  >
                    <div style={{ fontSize: '10px', color: '#A9BDD7', fontWeight: '700' }}>Choti SIP</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#00D5FF', marginTop: '2px' }}>₹250/mo</div>
                    <div style={{ fontSize: '9.5px', color: '#64748B', marginTop: '2px' }}>Pocket friendly</div>
                  </div>

                  <div
                    onClick={() => {
                      setSipFrequency('monthly');
                      setSipAmount('1000');
                      setSipModalOpen(true);
                    }}
                    style={{ background: '#071426', border: '1px solid #1E3A5F', borderRadius: '10px', padding: '10px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#A855F7')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1E3A5F')}
                  >
                    <div style={{ fontSize: '10px', color: '#A9BDD7', fontWeight: '700' }}>Growth Pool</div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#C084FC', marginTop: '2px' }}>₹1,000/mo</div>
                    <div style={{ fontSize: '9.5px', color: '#64748B', marginTop: '2px' }}>Compounding</div>
                  </div>
                </div>

                {/* Simulator Preview Box */}
                <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#A9BDD7' }}>Sample Daily Plan (₹50/day):</span>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#00E599' }}>₹65,490 in 3 years</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                    Simulated at 12% CAGR. Deducted automatically from wallet escrow balance.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(0, 229, 153, 0.25)' }}>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  Wallet Escrow Integrated
                </span>
                <button
                  onClick={() => setSipModalOpen(true)}
                  className="auth-button"
                  style={{
                    width: 'auto',
                    height: '36px',
                    padding: '0 18px',
                    fontSize: '12.5px',
                    margin: 0,
                    background: 'linear-gradient(135deg, #059669 0%, #00E599 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: '800',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>Open SIP Simulator</span>
                  <ArrowRightIcon size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. CORE SERVICES GRID (MONEY, BANKING, QR, BILLS, ETC.)   */}
      {/* ========================================================= */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
            {activeFilter === 'all' ? 'All Payment & Financial Services' : 'Category Services'}
          </h2>
          <span style={{ fontSize: '11.5px', color: '#64748B' }}>
            {filteredServices.length} Modules Active
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '16px' }}>
          {filteredServices.map((srv) => {
            const Icon = srv.icon;
            return (
              <div
                key={srv.id}
                style={{
                  background: '#071426',
                  border: '1px solid #17385D',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = srv.color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#17385D';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          background: `${srv.color}20`,
                          border: `1px solid ${srv.color}45`,
                          color: srv.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Icon size={22} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                          {srv.title}
                        </h3>
                        <span style={{ fontSize: '11px', color: '#A9BDD7' }}>
                          Verified ApnaPay Service
                        </span>
                      </div>
                    </div>

                    <span
                      className={`sidebar-badge ${srv.badgeColor || 'blue'}`}
                      style={{ fontSize: '10px', padding: '3px 8px' }}
                    >
                      {srv.badge}
                    </span>
                  </div>

                  <p style={{ fontSize: '12.5px', color: '#CBD5E1', lineHeight: 1.5, margin: 0 }}>
                    {srv.desc}
                  </p>
                </div>

                {/* Service Quick Actions */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid #17385D' }}>
                  {srv.actions.map((act, idx) => (
                    <button
                      key={idx}
                      onClick={act.onClick}
                      className={idx === 0 ? 'auth-button' : 'auth-button secondary'}
                      style={{
                        width: 'auto',
                        height: '32px',
                        padding: '0 12px',
                        fontSize: '11.5px',
                        margin: 0,
                        fontWeight: '700'
                      }}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. MODAL: REWARDS & OFFERS SCRATCH CARD MODAL             */}
      {/* ========================================================= */}
      {rewardsModalOpen && createPortal(
        <div
          className="admin-land-modal-overlay"
          onClick={() => setRewardsModalOpen(false)}
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
                <GiftIcon size={20} style={{ color: '#A855F7' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  ApnaPay Rewards & Cashback
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRewardsModalOpen(false)}
                className="admin-land-modal-close-btn"
                title="Close"
              >
                <XIcon size={16} />
              </button>
            </div>

            <div className="admin-land-modal-body" style={{ alignItems: 'center' }}>
              <div style={{ fontSize: '12.5px', color: '#A9BDD7', marginBottom: '14px' }}>
                Scratch your reward card earned from simulated Bharat UPI payments:
              </div>

              {/* Interactive Scratch Card */}
              <div
                onClick={() => setScratchCardRevealed(true)}
                style={{
                  width: '240px',
                  height: '140px',
                  borderRadius: '16px',
                  background: scratchCardRevealed
                    ? 'linear-gradient(135deg, #065F46, #047857)'
                    : 'linear-gradient(135deg, #7C3AED, #A855F7)',
                  border: '2px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.3s ease',
                  padding: '16px',
                  boxSizing: 'border-box'
                }}
              >
                {scratchCardRevealed ? (
                  <>
                    <SparklesIcon size={32} style={{ color: '#00E599', marginBottom: '6px' }} />
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#FFFFFF' }}>
                      ₹25 CASHBACK
                    </div>
                    <div style={{ fontSize: '11px', color: '#D1FAE5', marginTop: '2px' }}>
                      Credited to Escrow Wallet
                    </div>
                  </>
                ) : (
                  <>
                    <GiftIcon size={36} style={{ color: '#FFFFFF', marginBottom: '8px' }} />
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#FFFFFF' }}>
                      TAP TO SCRATCH
                    </div>
                    <div style={{ fontSize: '11px', color: '#E9D5FF', marginTop: '2px' }}>
                      Guaranteed Reward Inside
                    </div>
                  </>
                )}
              </div>

              {/* Referral Promotion */}
              <div style={{ width: '100%', background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '12px', marginTop: '16px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#FFFFFF' }}>Refer & Earn ₹200</span>
                  <span style={{ fontSize: '10.5px', color: '#00D5FF', fontWeight: '800' }}>ACTIVE</span>
                </div>
                <div style={{ fontSize: '11px', color: '#A9BDD7', lineHeight: 1.4 }}>
                  Invite friends to ApnaPay. Once they register and make their first simulated payment, you both receive ₹200 bonus.
                </div>
              </div>
            </div>

            <div className="admin-land-modal-footer" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setRewardsModalOpen(false)}
                className="auth-button"
                style={{ width: '100%', height: '38px', fontSize: '13px', margin: 0 }}
              >
                Close Rewards
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* 5. MODAL: PHONEPE-STYLE MY QR MODAL                        */}
      {/* ========================================================= */}
      {qrModalOpen && createPortal(
        <div
          className="admin-land-modal-overlay"
          onClick={() => setQrModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-land-modal-container phonepe-my-qr-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#FFFFFF', letterSpacing: '-0.3px' }}>
                MY QR
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

            <div className="phonepe-qr-bank-pill">
              <div className="phonepe-qr-bank-logo">
                <LandmarkIcon size={13} />
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>
                {primaryBankName} •••• {primaryBankLast4}
              </div>
            </div>

            <div style={{ textAlign: 'center', margin: '10px 0' }}>
              <div className="phonepe-qr-white-card">
                <div style={{ width: '200px', height: '200px', background: '#050D1B', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <QrCodeIcon size={176} style={{ color: '#00D5FF' }} />
                  <div className="phonepe-qr-center-badge">
                    <span style={{ fontWeight: '900', fontSize: '20px', color: '#00D5FF' }}>A</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="phonepe-qr-vpa-row">
              <span style={{ fontSize: '12px', color: '#A9BDD7' }}>UPI ID:</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#00D5FF', fontFamily: 'monospace' }}>
                {primaryUpi}
              </span>
              <button
                type="button"
                onClick={() => handleCopyUpi(primaryUpi)}
                style={{ background: 'transparent', border: 'none', color: '#00E599', cursor: 'pointer', padding: '2px', display: 'flex' }}
                title="Copy UPI ID"
              >
                {copiedUpi ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
              </button>
            </div>

            <div className="phonepe-qr-buttons-row">
              <button
                type="button"
                onClick={() => showToast('QR Code image downloaded to your device!')}
                className="auth-button secondary"
                style={{ height: '42px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: 0, fontSize: '13px', fontWeight: '700' }}
              >
                <DownloadIcon size={16} />
                <span>Download</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleCopyUpi(primaryUpi);
                  showToast('Payment link copied to share!');
                }}
                className="auth-button secondary"
                style={{ height: '42px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: 0, fontSize: '13px', fontWeight: '700' }}
              >
                <ShareIcon size={16} />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* 6. MODAL: SCAN & PAY CAMERA SCANNER                       */}
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
                <QrCodeIcon size={20} style={{ color: '#00A8FF' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  Scan Any QR & Pay
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
              <div
                style={{
                  width: '100%',
                  height: '170px',
                  background: '#040B16',
                  border: '2px dashed #00A8FF',
                  borderRadius: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 0 20px rgba(0, 168, 255, 0.2)'
                }}
              >
                <div style={{ position: 'absolute', top: '16px', left: '16px', width: '24px', height: '24px', borderTop: '3px solid #00D5FF', borderLeft: '3px solid #00D5FF' }} />
                <div style={{ position: 'absolute', top: '16px', right: '16px', width: '24px', height: '24px', borderTop: '3px solid #00D5FF', borderRight: '3px solid #00D5FF' }} />
                <div style={{ position: 'absolute', bottom: '16px', left: '16px', width: '24px', height: '24px', borderBottom: '3px solid #00D5FF', borderLeft: '3px solid #00D5FF' }} />
                <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: '24px', height: '24px', borderBottom: '3px solid #00D5FF', borderRight: '3px solid #00D5FF' }} />

                <QrCodeIcon size={48} style={{ color: 'rgba(0, 213, 255, 0.4)', marginBottom: '8px' }} />
                <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#FFFFFF' }}>
                  Point camera at any UPI QR Code
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                  Supports PhonePe, GPay, Paytm & BharatQR
                </div>
              </div>

              <div style={{ marginTop: '14px', background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '12px' }}>
                <label style={{ fontSize: '12px', color: '#A9BDD7', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                  Or enter 10-Digit Mobile / UPI ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210 or merchant@apnapay"
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
                  Transfer Amount
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
                Proceed to Pay ₹{quickAmount} →
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* 7. MODAL: SIP WEALTH SIMULATOR MODAL                      */}
      {/* ========================================================= */}
      {sipModalOpen && createPortal(
        <div
          className="admin-land-modal-overlay"
          onClick={() => setSipModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-land-modal-container"
            style={{ maxWidth: '460px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-land-modal-header">
              <div className="admin-land-modal-header-title">
                <TrendingUpIcon size={20} style={{ color: '#00E599' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  ApnaPay SIP & Wealth Simulator
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSipModalOpen(false)}
                className="admin-land-modal-close-btn"
                title="Close"
              >
                <XIcon size={16} />
              </button>
            </div>

            <div className="admin-land-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#071426', padding: '4px', borderRadius: '10px', border: '1px solid #17385D', marginBottom: '14px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSipFrequency('daily');
                    setSipAmount('50');
                  }}
                  style={{
                    padding: '8px 0',
                    border: 'none',
                    borderRadius: '8px',
                    background: sipFrequency === 'daily' ? 'linear-gradient(135deg, #087BFF, #00D5FF)' : 'transparent',
                    color: '#FFFFFF',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Daily SIP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSipFrequency('monthly');
                    setSipAmount('1000');
                  }}
                  style={{
                    padding: '8px 0',
                    border: 'none',
                    borderRadius: '8px',
                    background: sipFrequency === 'monthly' ? 'linear-gradient(135deg, #087BFF, #00D5FF)' : 'transparent',
                    color: '#FFFFFF',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Monthly SIP
                </button>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#A9BDD7', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                  {sipFrequency === 'daily' ? 'Select Daily Investment' : 'Select Monthly Investment'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {(sipFrequency === 'daily' ? ['10', '50', '100'] : ['500', '1000', '2500']).map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setSipAmount(amt)}
                      style={{
                        padding: '10px 0',
                        borderRadius: '8px',
                        border: sipAmount === amt ? '1px solid #00E599' : '1px solid #17385D',
                        background: sipAmount === amt ? 'rgba(0, 229, 153, 0.15)' : '#071426',
                        color: sipAmount === amt ? '#00E599' : '#FFFFFF',
                        fontWeight: '700',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      ₹{amt}/{sipFrequency === 'daily' ? 'day' : 'mo'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '14px' }}>
                <label style={{ fontSize: '12px', color: '#A9BDD7', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                  Investment Horizon
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[1, 3, 5].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setSipHorizonYears(yr)}
                      style={{
                        padding: '8px 0',
                        borderRadius: '8px',
                        border: sipHorizonYears === yr ? '1px solid #00A8FF' : '1px solid #17385D',
                        background: sipHorizonYears === yr ? 'rgba(0, 168, 255, 0.15)' : '#071426',
                        color: sipHorizonYears === yr ? '#00A8FF' : '#FFFFFF',
                        fontWeight: '700',
                        fontSize: '12.5px',
                        cursor: 'pointer'
                      }}
                    >
                      {yr} Year{yr > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: '#071426', border: '1px solid #1E3A5F', borderRadius: '12px', padding: '14px', marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#A9BDD7' }}>Total Invested:</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>₹{sipResult.invested.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#A9BDD7' }}>Estimated Returns (12% CAGR):</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#00E599' }}>+₹{sipResult.profit.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #17385D' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#FFFFFF' }}>Projected Maturity Value:</span>
                  <span style={{ fontSize: '16px', fontWeight: '900', color: '#00D5FF' }}>₹{sipResult.futureVal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="admin-land-modal-footer">
              <button
                type="button"
                onClick={() => setSipModalOpen(false)}
                className="auth-button secondary"
                style={{ width: 'auto', padding: '0 16px', height: '38px', fontSize: '13px', margin: 0 }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSipModalOpen(false);
                  showToast(`Simulated ${sipFrequency} SIP of ₹${sipAmount} activated on your escrow ledger!`);
                }}
                className="auth-button"
                style={{
                  width: 'auto',
                  padding: '0 20px',
                  height: '38px',
                  fontSize: '13px',
                  margin: 0,
                  background: 'linear-gradient(135deg, #059669 0%, #00E599 100%)',
                  border: 'none',
                  color: '#FFFFFF'
                }}
              >
                Start Simulated SIP →
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </DashboardLayout>
  );
};

export default CustomerServicesPage;
