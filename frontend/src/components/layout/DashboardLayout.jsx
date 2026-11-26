import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import walletService from '../../services/walletService';
import BackButton from '../BackButton';
import NotificationDropdown from '../NotificationDropdown';
import {
  ShieldIcon,
  HomeIcon,
  BankIcon,
  HistoryIcon,
  TrendingUpIcon,
  UserIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  WalletIcon,
  RefreshCwIcon,
  ReceiptIcon,
  SearchIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  BellIcon,
  SendIcon,
  CreditCardIcon,
  QrCodeIcon,
  SmartphoneIcon,
  AlertCircleIcon,
  LayersIcon,
  GridIcon
} from '../Icons';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Receipt,
  Building2
} from 'lucide-react';

const DashboardLayout = ({
  children,
  title = 'Dashboard',
  subtitle = '',
  onRefresh = null,
  showBack = undefined,
  backFallback = '/app',
  onBack = null,
  backLabel = 'Back'
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const userToken = localStorage.getItem('apnapay_token');
    if (!userToken) return;
    walletService.getBalance()
      .then((res) => {
        if (isMounted && res?.data?.formattedBalance) {
          setWalletBalance(res.data.formattedBalance);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isOverview = location.pathname === '/app';
  const shouldShowBack = showBack !== undefined ? showBack : !isOverview;

  const navItems = [
    {
      to: '/app',
      label: 'Dashboard',
      icon: HomeIcon,
      exact: true
    },
    {
      to: '/app/services',
      label: 'All Services',
      icon: GridIcon,
      badge: 'Hub',
      badgeColor: 'blue'
    },
    {
      to: '/app/wallet',
      label: 'Wallet & Ledger',
      icon: WalletIcon
    },
    {
      to: '/app/transfers',
      label: 'Money Transfers',
      icon: SendIcon,
      badge: 'P2P',
      badgeColor: 'blue'
    },
    {
      to: '/app/payments',
      label: 'Payments',
      icon: CreditCardIcon,
      badge: 'PG',
      badgeColor: 'blue'
    },
    {
      to: '/app/banks',
      label: 'Bank Accounts',
      icon: BankIcon
    },
    {
      to: '/app/upi',
      label: 'UPI Services',
      icon: ShieldIcon
    },
    {
      to: '/app/qr',
      label: 'QR Payments',
      icon: QrCodeIcon,
      badge: 'QR',
      badgeColor: 'blue'
    },
    {
      to: '/app/recharge',
      label: 'Mobile Recharge',
      icon: SmartphoneIcon,
      badge: 'Fast',
      badgeColor: 'cyan'
    },
    {
      to: '/app/bills',
      label: 'Bill Payments',
      icon: ReceiptIcon,
      badge: 'BBPS',
      badgeColor: 'blue'
    },
    {
      to: '/app/sip',
      label: 'SIP & Wealth',
      icon: TrendingUpIcon,
      badge: 'Invest',
      badgeColor: 'green'
    },
    {
      to: '/app/land',
      label: 'Digital Land',
      icon: LayersIcon,
      badge: 'Active',
      badgeColor: 'green'
    },
    {
      to: '/app/transactions',
      label: 'Transaction History',
      icon: HistoryIcon
    },
    {
      to: '/app/disputes',
      label: 'Dispute & Refunds',
      icon: AlertCircleIcon,
      badge: 'Help',
      badgeColor: 'orange'
    },
    {
      to: '/app/kyc',
      label: 'KYC Verification',
      icon: ShieldCheckIcon
    },
    {
      to: '/app/profile',
      label: 'Profile & Settings',
      icon: UserIcon
    }
  ];

  const searchableServices = [
    { title: 'All Services', path: '/app/services', desc: 'Browse all recharge, billers, banking & investment services' },
    { title: 'Wallet & Ledger', path: '/app/wallet', desc: 'Add money, view escrow ledger balance' },
    { title: 'Money Transfers', path: '/app/transfers', desc: 'Instant peer-to-peer transfers & bank payouts' },
    { title: 'Payments', path: '/app/payments', desc: 'Manage checkout orders, cards & gateway logs' },
    { title: 'Bank Accounts', path: '/app/banks', desc: 'Link Indian bank accounts with IFSC' },
    { title: 'UPI Services', path: '/app/upi', desc: 'Manage @apnapay UPI IDs and VPAs' },
    { title: 'QR Payments', path: '/app/qr', desc: 'Scan and pay, generate dynamic QR codes' },
    { title: 'Mobile Recharge', path: '/app/recharge', desc: 'Prepaid, postpaid and DTH recharge plans' },
    { title: 'Bill Payments', path: '/app/bills', desc: 'Electricity, Water, Gas, DTH & Mobile bills' },
    { title: 'SIP & Wealth', path: '/app/sip', desc: 'Systematic Investment Plans & mutual funds' },
    { title: 'Wealth Dashboard', path: '/app/sip?tab=dashboard', desc: 'Portfolio AUM, asset allocation, and investment growth' },
    { title: 'Mutual Funds', path: '/app/sip?tab=funds', desc: 'Explore equity, debt & hybrid mutual fund schemes' },
    { title: 'SIP Management', path: '/app/sip?tab=sips', desc: 'Active SIP subscriptions, mandates, and recurring auto-debits' },
    { title: 'Investment Transactions', path: '/app/sip?tab=transactions', desc: 'Lump-sum purchases, SIP debits, redemptions & statements' },
    { title: 'Partner Management', path: '/app/sip?tab=partners', desc: 'Authorized AMCs, fund houses and RTAs' },
    { title: 'Digital Land', path: '/app/land', desc: 'Buy & sell fractional digital land assets' },
    { title: 'Transaction History', path: '/app/transactions', desc: 'Search and filter financial records' },
    { title: 'Dispute & Refunds', path: '/app/disputes', desc: 'Track payment inquiries, file chargeback claims' },
    { title: 'My Refunds & Receipts', path: '/app/refunds', desc: 'Track chargeback reversals, wallet credits & UTR receipts' },
    { title: 'KYC Verification', path: '/app/kyc', desc: 'Government identity proof and compliance' },
    { title: 'Profile & Security', path: '/app/profile', desc: 'Notification preferences, KYC & password' }
  ];

  const filteredServices = searchQuery.trim()
    ? searchableServices.filter((s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.desc.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const getInitials = (name) => {
    if (!name) return 'RP';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const displayName = user?.full_name || 'Rohit Sharma';
  const displayEmail = user?.email || 'rohit@example.com';
  const initials = getInitials(displayName);

  return (
    <div className="portal-root">
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="portal-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* =================================================== */}
      {/* 1. FIXED LEFT SIDEBAR (STATIONARY WHILE CONTENT SCROLLS) */}
      {/* =================================================== */}
      <aside className={`portal-sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Top Brand Header (Clickable - Navigates to Main Dashboard) */}
        <div className="portal-sidebar-header">
          <Link
            to="/app"
            onClick={() => setMobileOpen(false)}
            className="sidebar-brand-link"
            title="Go to ApnaPay Main Dashboard"
            aria-label="ApnaPay Home"
          >
            <div
              className="brand-logo-icon"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                background: 'linear-gradient(135deg, #087BFF 0%, #00D5FF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(0, 168, 255, 0.4)',
                fontWeight: '900',
                fontSize: '20px',
                color: '#FFFFFF',
                flexShrink: 0
              }}
            >
              A
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px', color: '#FFFFFF', lineHeight: 1.2 }}>
                Apna<span style={{ color: '#00D5FF' }}>Pay</span>
              </div>
              <div style={{ fontSize: '11px', color: '#A9BDD7', fontWeight: '500', marginTop: '1px' }}>
                Digital Payments for All
              </div>
            </div>
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#A9BDD7',
              cursor: 'pointer',
              display: 'none'
            }}
            className="mobile-close-btn"
            aria-label="Close Navigation"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Middle Section – Navigation */}
        <nav className="portal-sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSipItem = item.to === '/app/sip';
            const isSipPath = location.pathname.startsWith('/app/sip');
            const currentSipTab = new URLSearchParams(location.search).get('tab') || 'dashboard';

            return (
              <React.Fragment key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.exact}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive: linkActive }) =>
                    `sidebar-link ${linkActive ? 'active' : ''}`
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`sidebar-badge ${item.badgeColor || 'blue'}`}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>

                {/* Submenu for INVESTMENT & WEALTH under SIP & Wealth */}
                {isSipItem && isSipPath && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      paddingLeft: '12px',
                      marginLeft: '14px',
                      marginTop: '3px',
                      marginBottom: '6px',
                      borderLeft: '2px solid rgba(0, 213, 255, 0.35)'
                    }}
                  >
                    {[
                      { tab: 'dashboard', label: 'Wealth Dashboard', badge: 'AUM', badgeColor: 'cyan', icon: TrendingUp },
                      { tab: 'funds', label: 'Mutual Funds', badge: 'MF', badgeColor: 'blue', icon: BarChart3 },
                      { tab: 'sips', label: 'SIP Management', badge: 'SIP', badgeColor: 'green', icon: Calendar },
                      { tab: 'transactions', label: 'Investment Transactions', badge: 'TXN', badgeColor: 'blue', icon: Receipt },
                      { tab: 'partners', label: 'Partner Management', badge: 'DIR', badgeColor: 'blue', icon: Building2 }
                    ].map((sub) => {
                      const SubIcon = sub.icon;
                      const isSelected = currentSipTab === sub.tab || (sub.tab === 'dashboard' && (!currentSipTab || currentSipTab === 'overview'));

                      return (
                        <Link
                          key={sub.tab}
                          to={`/app/sip?tab=${sub.tab}`}
                          onClick={() => setMobileOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: isSelected ? '700' : '500',
                            textDecoration: 'none',
                            color: isSelected ? '#00D5FF' : '#8BA2C1',
                            background: isSelected ? 'rgba(0, 213, 255, 0.12)' : 'transparent',
                            border: isSelected ? '1px solid rgba(0, 213, 255, 0.28)' : '1px solid transparent',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <SubIcon size={14} style={{ color: isSelected ? '#00D5FF' : '#5E7B9D' }} />
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {sub.label}
                          </span>
                          <span
                            className={`sidebar-badge ${sub.badgeColor || 'blue'}`}
                            style={{ fontSize: '9px', padding: '1px 5px' }}
                          >
                            {sub.badge}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Trust Badge Pinned Above User Footer */}
        <div className="sidebar-trust-badge">
          <div className="trust-icon-wrap">
            <ShieldCheckIcon size={18} />
          </div>
          <div>
            <div className="trust-title">ApnaPay</div>
            <div className="trust-subtitle">Safe • Secure • Reliable</div>
          </div>
        </div>

        {/* Bottom Section – User Profile Card & Logout */}
        <div className="portal-sidebar-footer">
          <div className="sidebar-user-card">
            <div className="user-avatar-initials">
              {initials}
            </div>
            <div className="user-info">
              <div className="user-name">
                {displayName}
              </div>
              <div className="user-email">
                {displayEmail}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="sidebar-logout-btn"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOutIcon size={18} />
            </button>
          </div>

          {/* Admin Console Shortcut */}
          <Link
            to="/admin"
            className="sidebar-link"
            style={{
              marginTop: '8px',
              background: 'rgba(0, 168, 255, 0.08)',
              border: '1px solid rgba(0, 168, 255, 0.22)',
              color: '#00D5FF',
              padding: '6px 12px',
              minHeight: '34px',
              fontSize: '12px',
              textDecoration: 'none'
            }}
            title="Open Enterprise Admin Console"
          >
            <ShieldIcon size={15} />
            <span style={{ flex: 1 }}>Admin Console</span>
            <span className="sidebar-badge blue">Admin</span>
          </Link>
        </div>
      </aside>

      {/* =================================================== */}
      {/* 2. MAIN VIEW AREA (INDEPENDENT VERTICAL SCROLLING)   */}
      {/* =================================================== */}
      <div className="portal-main-area">
        {/* Fixed Top Dashboard Header */}
        <header className="portal-top-navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
            {/* Hamburger for mobile (<1024px) */}
            <button
              onClick={() => setMobileOpen(true)}
              className="portal-hamburger-btn"
              aria-label="Open Navigation Menu"
            >
              <MenuIcon size={22} />
            </button>

            {/* Back Button on every internal page (Hidden on Overview) */}
            {shouldShowBack && (
              <BackButton
                fallback={backFallback}
                label={backLabel}
                onClick={onBack}
              />
            )}

            {/* Search Services Field */}
            <div className="top-search-wrap">
              <div className="top-search-icon">
                <SearchIcon size={16} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 250)}
                placeholder="Search services..."
                className="top-search-input"
              />

              {/* Quick Jump Search Results Dropdown */}
              {searchFocused && filteredServices.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    background: '#0B1B32',
                    border: '1px solid #17385D',
                    borderRadius: '12px',
                    padding: '6px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.8)',
                    zIndex: 150
                  }}
                >
                  {filteredServices.map((srv) => (
                    <div
                      key={srv.path}
                      onMouseDown={() => {
                        navigate(srv.path);
                        setSearchQuery('');
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#0E223D')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>{srv.title}</div>
                      <div style={{ fontSize: '11px', color: '#A9BDD7' }}>{srv.desc}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Header Controls (Notifications & User Pill) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            {walletBalance && (
              <div
                className="balance-pill"
                onClick={() => navigate('/app/wallet')}
                style={{ borderColor: '#17385D', cursor: 'pointer', background: '#0B1B32' }}
                title="View Wallet & Ledger"
              >
                <WalletIcon size={14} style={{ color: '#00A8FF' }} />
                <strong style={{ color: '#00E599', fontSize: '12px' }}>{walletBalance}</strong>
              </div>
            )}

            {/* Notification Bell Dropdown */}
            <NotificationDropdown />

            {/* User Profile Pill */}
            <div
              className="header-user-pill"
              onClick={() => navigate('/app/profile')}
              title="Go to Profile & Security"
            >
              <div className="header-user-avatar">
                {initials}
              </div>
              <span className="header-user-name">
                {displayName.split(' ')[0]}
              </span>
              <ChevronDownIcon size={14} style={{ color: '#A9BDD7' }} />
            </div>

            {onRefresh && (
              <button
                onClick={onRefresh}
                title="Refresh Page Data"
                className="auth-button secondary"
                style={{ width: '38px', height: '38px', padding: 0, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}
                aria-label="Refresh Data"
              >
                <RefreshCwIcon size={15} />
              </button>
            )}
          </div>
        </header>

        {/* 3. Main Page Content (Independently Scrolls Vertically Below Header) */}
        <main className="portal-page-content fade-in">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar (<1024px) */}
        <nav className="mobile-bottom-nav">
          <NavLink
            to="/app"
            end
            className={({ isActive }) => `mobile-bottom-link ${isActive ? 'active' : ''}`}
          >
            <HomeIcon size={20} />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/app/wallet"
            className={({ isActive }) => `mobile-bottom-link ${isActive ? 'active' : ''}`}
          >
            <WalletIcon size={20} />
            <span>Wallet</span>
          </NavLink>

          <NavLink
            to="/app/bills"
            className={({ isActive }) => `mobile-bottom-link ${isActive ? 'active' : ''}`}
          >
            <ReceiptIcon size={20} />
            <span>Bills</span>
          </NavLink>

          <NavLink
            to="/app/transactions"
            className={({ isActive }) => `mobile-bottom-link ${isActive ? 'active' : ''}`}
          >
            <HistoryIcon size={20} />
            <span>History</span>
          </NavLink>

          <NavLink
            to="/app/profile"
            className={({ isActive }) => `mobile-bottom-link ${isActive ? 'active' : ''}`}
          >
            <UserIcon size={20} />
            <span>Profile</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
};

export default DashboardLayout;
