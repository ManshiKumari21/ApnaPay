import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboardLayout from '../../components/layout/AdminDashboardLayout';
import adminAuthService from '../../services/adminAuthService';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  UserIcon,
  ShieldIcon,
  KeyIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  MailIcon,
  CalendarIcon
} from '../../components/Icons';

const AdminProfilePage = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfile = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await adminAuthService.getProfile();
      setProfile(res.data?.admin);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to load admin profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <AdminDashboardLayout
      title="Admin Profile & Identity"
      subtitle="Administrator credentials, authorization privileges, and session security audit"
      backFallback="/admin"
      onRefresh={loadProfile}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <LoadingSpinner size="lg" color="blue" />
          <p style={{ marginTop: '14px', color: '#A9BDD7' }}>Fetching Administrator Profile...</p>
        </div>
      ) : error ? (
        <div className="auth-alert error" style={{ maxWidth: '640px', margin: '20px auto' }}>
          <AlertCircleIcon size={18} />
          <span>{error}</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Profile Overview Card */}
          <div
            className="dashboard-card"
            style={{
              background: 'linear-gradient(135deg, rgba(22, 119, 255, 0.16) 0%, rgba(10, 20, 34, 0.98) 100%)',
              borderColor: '#17385D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '18px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #087BFF, #00A8FF)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '22px',
                  fontWeight: '800',
                  flexShrink: 0
                }}
              >
                {profile?.full_name
                  ? profile.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                  : 'AD'}
              </div>
              <div style={{ minWidth: 0, flex: '1 1 200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#FFFFFF', margin: 0, wordBreak: 'break-word' }}>
                    {profile?.full_name || 'System Administrator'}
                  </h2>
                  <span className="sidebar-badge blue" style={{ textTransform: 'uppercase' }}>
                    {profile?.role || 'admin'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#A9BDD7', fontSize: '14px', marginTop: '4px', wordBreak: 'break-all' }}>
                  <MailIcon size={14} style={{ color: '#00A8FF', flexShrink: 0 }} />
                  <span>{profile?.email}</span>
                </div>
              </div>
            </div>

            <div>
              <button
                onClick={() => navigate('/admin/change-password')}
                className="auth-button"
                style={{ width: 'auto', padding: '0 18px', height: '40px', fontSize: '13px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <KeyIcon size={16} />
                <span>Change Password</span>
              </button>
            </div>
          </div>

          {/* Detailed Attribute Grid */}
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Admin ID</span>
              <div className="stat-value" style={{ fontSize: '20px', color: '#00A8FF', fontFamily: 'monospace' }}>
                #{profile?.id}
              </div>
              <span style={{ fontSize: '12px', color: '#A9BDD7' }}>System Identity Index</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Account Status</span>
              <div className="stat-value" style={{ fontSize: '20px', color: '#10B981', textTransform: 'capitalize' }}>
                ● {profile?.status || 'active'}
              </div>
              <span style={{ fontSize: '12px', color: '#A9BDD7' }}>Full Access Granted</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Email Verified</span>
              <div className="stat-value" style={{ fontSize: '18px', color: '#10B981' }}>
                {profile?.email_verified_at ? 'Verified' : 'Pending'}
              </div>
              <span style={{ fontSize: '12px', color: '#A9BDD7' }}>
                {profile?.email_verified_at ? new Date(profile.email_verified_at).toLocaleDateString('en-IN') : 'N/A'}
              </span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Last Session Login</span>
              <div className="stat-value" style={{ fontSize: '16px' }}>
                {profile?.last_login_at ? new Date(profile.last_login_at).toLocaleString('en-IN') : 'Recent Active'}
              </div>
              <span style={{ fontSize: '12px', color: '#A9BDD7' }}>Session Audit Trail</span>
            </div>
          </div>

          {/* Security & Token Governance Card */}
          <div className="dashboard-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00A8FF', marginBottom: '10px' }}>
              <ShieldIcon size={18} />
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                Security Architecture & Session Isolation
              </h3>
            </div>
            <p style={{ color: '#A9BDD7', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              Administrator sessions are strictly segregated from customer accounts. Access tokens are secured with cryptographically signed JWTs with 15-minute expiration and rolling refresh token protection stored separately in <code style={{ color: '#00A8FF', background: '#071426', padding: '2px 6px', borderRadius: '4px' }}>apnapay_admin_token</code>.
            </p>
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  );
};

export default AdminProfilePage;
