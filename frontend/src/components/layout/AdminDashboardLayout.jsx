import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import BackButton from '../BackButton';
import {
  ShieldIcon,
  HomeIcon,
  UserIcon,
  KeyIcon,
  LayersIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  RefreshCwIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ChevronDownIcon
} from '../Icons';

const AdminDashboardLayout = ({
  children,
  title = 'Admin Dashboard',
  subtitle = '',
  onRefresh = null,
  showBack = undefined,
  backFallback = '/admin',
  onBack = null,
  backLabel = 'Back'
}) => {
  const { admin, adminLogout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await adminLogout();
    navigate('/admin/login');
  };

  const isAdminOverview = location.pathname === '/admin';
  const shouldShowBack = showBack !== undefined ? showBack : !isAdminOverview;

  const navItems = [
    {
      to: '/admin',
      label: 'Admin Overview',
      icon: HomeIcon,
      exact: true
    },
    {
      to: '/admin/land',
      label: 'Digital Land Management',
      icon: LayersIcon
    },
    {
      to: '/admin/profile',
      label: 'Admin Profile',
      icon: UserIcon
    },
    {
      to: '/admin/change-password',
      label: 'Change Password',
      icon: KeyIcon
    }
  ];

  const getInitials = (name) => {
    if (!name) return 'AD';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
      {/* ADMIN SIDEBAR NAVIGATION                            */}
      {/* =================================================== */}
      <aside className={`portal-sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Brand Header (Clickable - Navigates to Admin Dashboard) */}
        <div className="portal-sidebar-header">
          <Link
            to="/admin"
            onClick={() => setMobileOpen(false)}
            className="sidebar-brand-link"
            title="Go to Admin Dashboard"
            aria-label="Admin Dashboard Home"
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
              <div style={{ fontSize: '10px', color: '#00E599', fontWeight: '700', letterSpacing: '0.8px', marginTop: '1px' }}>
                ADMIN CONSOLE
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
            aria-label="Close Admin Navigation"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="portal-sidebar-nav">
          <div className="sidebar-category-label">Management</div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
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
            );
          })}

          <div className="sidebar-category-label" style={{ marginTop: '16px' }}>Portal Switch</div>
          <NavLink
            to="/app"
            onClick={() => setMobileOpen(false)}
            className="sidebar-link"
            style={{ color: '#A9BDD7' }}
          >
            <ShieldIcon size={18} />
            <span>Customer Portal</span>
            <ArrowRightIcon size={14} style={{ marginLeft: 'auto' }} />
          </NavLink>
        </nav>

        {/* Trust Badge */}
        <div className="sidebar-trust-badge">
          <div className="trust-icon-wrap">
            <ShieldCheckIcon size={18} />
          </div>
          <div>
            <div className="trust-title">ApnaPay Admin</div>
            <div className="trust-subtitle">Root Level • Encrypted</div>
          </div>
        </div>

        {/* Sidebar Footer User Card */}
        <div className="portal-sidebar-footer">
          <div className="sidebar-user-card">
            <div className="user-avatar-initials">
              {getInitials(admin?.full_name)}
            </div>
            <div className="user-info">
              <div className="user-name">
                {admin?.full_name || 'System Admin'}
              </div>
              <div className="user-email" style={{ color: '#00E599' }}>
                {admin?.role?.toUpperCase() || 'SUPERADMIN'}
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

          {/* Customer Portal Shortcut */}
          <Link
            to="/app"
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
            title="Open Customer Portal"
          >
            <HomeIcon size={15} />
            <span style={{ flex: 1 }}>Customer Portal</span>
            <span className="sidebar-badge blue">App</span>
          </Link>
        </div>
      </aside>

      {/* =================================================== */}
      {/* MAIN ADMIN VIEW AREA                                */}
      {/* =================================================== */}
      <div className="portal-main-area">
        {/* Top Navbar */}
        <header className="portal-top-navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <button
              onClick={() => setMobileOpen(true)}
              className="portal-hamburger-btn"
              aria-label="Open Admin Menu"
            >
              <MenuIcon size={24} />
            </button>

            {/* Back Button on internal admin pages */}
            {shouldShowBack && (
              <BackButton
                fallback={backFallback}
                label={backLabel}
                onClick={onBack}
              />
            )}

            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF', margin: 0, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {title}
              </h1>
              {subtitle && (
                <p style={{ fontSize: '12px', color: '#A9BDD7', margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right Header Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            {/* Admin User Pill */}
            <div
              className="header-user-pill"
              onClick={() => navigate('/admin/profile')}
              title="Go to Admin Profile"
            >
              <div className="header-user-avatar">
                {getInitials(admin?.full_name)}
              </div>
              <span className="header-user-name">
                {admin?.full_name?.split(' ')[0] || 'Admin'}
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

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                background: 'rgba(8, 123, 255, 0.12)',
                border: '1px solid rgba(0, 168, 255, 0.35)',
                borderRadius: '12px',
                color: '#00D5FF',
                fontSize: '11px',
                fontWeight: '700'
              }}
            >
              <CheckCircleIcon size={12} style={{ color: '#00E599' }} />
              <span>SUPERADMIN</span>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="portal-page-content fade-in">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar (<1024px) */}
        <nav className="mobile-bottom-nav">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `mobile-bottom-link ${isActive ? 'active' : ''}`}
          >
            <HomeIcon size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/profile"
            className={({ isActive }) => `mobile-bottom-link ${isActive ? 'active' : ''}`}
          >
            <UserIcon size={20} />
            <span>Profile</span>
          </NavLink>

          <NavLink
            to="/admin/change-password"
            className={({ isActive }) => `mobile-bottom-link ${isActive ? 'active' : ''}`}
          >
            <KeyIcon size={20} />
            <span>Security</span>
          </NavLink>

          <NavLink
            to="/app"
            className="mobile-bottom-link"
          >
            <ShieldIcon size={20} />
            <span>Customer</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;
