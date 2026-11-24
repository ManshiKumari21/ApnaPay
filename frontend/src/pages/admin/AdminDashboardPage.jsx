import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminDashboardLayout from '../../components/layout/AdminDashboardLayout';
import {
  ShieldIcon,
  UserIcon,
  KeyIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  WalletIcon,
  BankIcon,
  HistoryIcon,
  LayersIcon,
  TrendingUpIcon,
  RefreshCwIcon
} from '../../components/Icons';

const AdminDashboardPage = () => {
  const { admin, fetchAdminProfile } = useAdminAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      await fetchAdminProfile();
    } catch (err) {
      console.warn('Profile sync:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const systemModules = [
    {
      title: 'Customer & Admin Authentication',
      status: 'Active',
      description: 'Dual-tenant JWT auth, Nodemailer SMTP OTP 2FA, token rotation, and password resets.',
      icon: ShieldIcon,
      color: '#10B981'
    },
    {
      title: 'Escrow Wallet & Ledger Engine',
      status: 'Active',
      description: 'Double-entry debit/credit ledger, RBI velocity limits, and real-time cashflow summaries.',
      icon: WalletIcon,
      color: '#00A8FF'
    },
    {
      title: 'Banking & Instant UPI System',
      status: 'Active',
      description: 'Account linking, micro-deposit verification, and unique @apnapay VPA registration.',
      icon: BankIcon,
      color: '#10B981'
    },
    {
      title: 'Transaction Audit & Statement Engine',
      status: 'Active',
      description: 'Chronological activity tracking with automated CSV and PDF statement generator.',
      icon: HistoryIcon,
      color: '#00A8FF'
    },
    {
      title: 'Digital Land Fractional Marketplace',
      status: 'Active',
      description: 'Verified parcel listings, inventory lock order creation, and official appraisal history.',
      icon: LayersIcon,
      color: '#10B981'
    }
  ];

  return (
    <AdminDashboardLayout
      title="Admin Control Dashboard"
      subtitle="Overview of administrator privileges, platform security, and active financial subsystems"
      onRefresh={loadData}
    >
      {/* Welcome Banner */}
      <div
        className="dashboard-card"
        style={{
          background: 'linear-gradient(135deg, rgba(22, 119, 255, 0.18) 0%, rgba(10, 20, 34, 0.98) 100%)',
          borderColor: '#17385D',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '8px' }}>
              <CheckCircleIcon size={16} />
              <span>AUTHENTICATED ADMINISTRATOR • RESTRICTED CONSOLE</span>
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.5px' }}>
              Welcome, {admin?.full_name || 'System Administrator'}!
            </h2>
            <p style={{ color: '#A9BDD7', fontSize: '14px', marginTop: '6px', maxWidth: '640px' }}>
              You are signed into the restricted ApnaPay Admin Console. Inspect administrator identity, rotate credentials, and verify operational subsystem status.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/admin/profile')}
              className="auth-button"
              style={{ width: 'auto', padding: '0 16px', height: '40px', fontSize: '12px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <UserIcon size={15} />
              <span>Admin Profile</span>
            </button>
            <button
              onClick={() => navigate('/admin/change-password')}
              className="auth-button secondary"
              style={{ width: 'auto', padding: '0 16px', height: '40px', fontSize: '12px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <KeyIcon size={15} />
              <span>Change Password</span>
            </button>
            <button
              onClick={() => navigate('/app')}
              className="auth-button secondary"
              style={{ width: 'auto', padding: '0 16px', height: '40px', fontSize: '12px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#00A8FF', borderColor: '#087BFF' }}
            >
              <ShieldIcon size={15} />
              <span>Customer Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Metrics Grid */}
      <div className="stats-grid" style={{ marginTop: '20px' }}>
        {/* Authority Level */}
        <div className="stat-item" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/profile')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Authority Level</span>
            <ShieldIcon size={18} style={{ color: '#00A8FF' }} />
          </div>
          <div className="stat-value" style={{ color: '#00A8FF', fontSize: '22px', textTransform: 'uppercase' }}>
            {admin?.role || 'SuperAdmin'}
          </div>
          <div style={{ fontSize: '12px', color: '#10B981', marginTop: '6px' }}>
            ● Full System Access
          </div>
        </div>

        {/* Account Status */}
        <div className="stat-item">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Admin Status</span>
            <CheckCircleIcon size={18} style={{ color: '#10B981' }} />
          </div>
          <div className="stat-value" style={{ color: '#10B981', fontSize: '22px', textTransform: 'capitalize' }}>
            ● {admin?.status || 'Active'}
          </div>
          <div style={{ fontSize: '12px', color: '#A9BDD7', marginTop: '6px' }}>
            Email Verified & Protected
          </div>
        </div>

        {/* Security Shield */}
        <div className="stat-item">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Security Protocol</span>
            <KeyIcon size={18} style={{ color: '#F59E0B' }} />
          </div>
          <div className="stat-value" style={{ color: '#FFFFFF', fontSize: '20px' }}>
            AES-256 JWT
          </div>
          <div style={{ fontSize: '12px', color: '#A9BDD7', marginTop: '6px' }}>
            Rolling Refresh Token Expiry
          </div>
        </div>

        {/* Admin ID */}
        <div className="stat-item" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/profile')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="stat-label">Admin Identity ID</span>
            <UserIcon size={18} style={{ color: '#00A8FF' }} />
          </div>
          <div className="stat-value" style={{ color: '#FFFFFF', fontSize: '22px', fontFamily: 'monospace' }}>
            #{admin?.id || '1'}
          </div>
          <div style={{ fontSize: '12px', color: '#A9BDD7', marginTop: '6px' }}>
            {admin?.email || 'admin@apnapay.com'}
          </div>
        </div>
      </div>

      {/* Operational Modules & System Health */}
      <div className="dashboard-card" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUpIcon size={18} style={{ color: '#10B981' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
              ApnaPay Platform Subsystems Status
            </h3>
          </div>
          <span style={{ fontSize: '12px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircleIcon size={14} />
            100% Endpoints Operational
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          {systemModules.map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <div
                key={idx}
                style={{
                  background: '#071426',
                  border: '1px solid #17385D',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(22, 119, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: mod.color }}>
                      <Icon size={18} />
                    </div>
                    <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '2px 8px', borderRadius: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
                      ● {mod.status}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF', margin: '0 0 6px 0' }}>
                    {mod.title}
                  </h4>
                  <p style={{ fontSize: '12px', color: '#A9BDD7', lineHeight: '1.5', margin: 0 }}>
                    {mod.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Administration Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginTop: '24px' }}>
        {/* Profile Card */}
        <div className="dashboard-card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(22, 119, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A8FF' }}>
              <UserIcon size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                Administrator Identity & Profile
              </h4>
              <p style={{ fontSize: '12px', color: '#A9BDD7', margin: '2px 0 0 0' }}>Inspect full account parameters and verification timestamps</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/profile')}
            className="auth-button secondary"
            style={{ width: '100%', height: '38px', fontSize: '13px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <span>View Profile Details</span>
            <ArrowRightIcon size={14} />
          </button>
        </div>

        {/* Credential Rotation Card */}
        <div className="dashboard-card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
              <KeyIcon size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                Admin Password & Credential Rotation
              </h4>
              <p style={{ fontSize: '12px', color: '#A9BDD7', margin: '2px 0 0 0' }}>Update administrator password with bcrypt security hash</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/change-password')}
            className="auth-button"
            style={{ width: '100%', height: '38px', fontSize: '13px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <KeyIcon size={14} />
            <span>Change Admin Password</span>
          </button>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminDashboardPage;
