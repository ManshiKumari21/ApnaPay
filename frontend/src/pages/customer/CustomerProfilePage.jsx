import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import notificationService from '../../services/notificationService';
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  ShieldIcon,
  LockIcon,
  CheckCircleIcon,
  LogOutIcon,
  BellIcon,
  RefreshCwIcon
} from '../../components/Icons';

const CustomerProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [preferences, setPreferences] = useState(null);
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  const loadPreferences = async () => {
    setLoadingPrefs(true);
    try {
      const res = await notificationService.getPreferences();
      setPreferences(res?.data || null);
    } catch (err) {
      console.warn('Failed to load notification preferences:', err.message);
    } finally {
      setLoadingPrefs(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <DashboardLayout
      title="My Profile & Security"
      subtitle="View your customer credentials, identity verification status, and security parameters"
      backFallback="/app"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
        {/* Personal Details Card */}
        <div className="dashboard-card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #162438' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #087BFF, #00A8FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '22px', fontWeight: '800' }}>
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                {user?.full_name || 'ApnaPay Customer'}
              </h3>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: '#10B981', fontSize: '12px', fontWeight: '600' }}>
                <CheckCircleIcon size={14} />
                <span>ACTIVE VERIFIED MEMBER</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Email */}
            <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#A9BDD7' }}>Registered Email</span>
                <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '600' }}>● Verified</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '15px', color: '#FFFFFF', fontWeight: '600' }}>
                <MailIcon size={16} style={{ color: '#00A8FF' }} />
                <span>{user?.email || 'Not provided'}</span>
              </div>
            </div>

            {/* Mobile Number */}
            <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#A9BDD7' }}>Registered Mobile</span>
                <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '600' }}>● Active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '15px', color: '#FFFFFF', fontWeight: '600' }}>
                <PhoneIcon size={16} style={{ color: '#00A8FF' }} />
                <span>{user?.phone || 'Not provided'}</span>
              </div>
            </div>

            {/* Account ID & Member Since */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '12px 14px' }}>
                <span style={{ fontSize: '11px', color: '#A9BDD7', textTransform: 'uppercase' }}>Customer ID</span>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#00A8FF', marginTop: '4px' }}>
                  #{user?.id ? `AP-${user.id}` : 'AP-001'}
                </div>
              </div>

              <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '12px 14px' }}>
                <span style={{ fontSize: '11px', color: '#A9BDD7', textTransform: 'uppercase' }}>KYC Level</span>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#10B981', marginTop: '4px' }}>
                  Tier 1 Basic
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Access Management Card */}
        <div className="dashboard-card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ padding: '8px', background: 'rgba(22, 119, 255, 0.1)', borderRadius: '8px', color: '#00A8FF' }}>
              <ShieldIcon size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                Security & Authentication
              </h3>
              <p style={{ fontSize: '12px', color: '#A9BDD7', margin: '2px 0 0' }}>
                Password credentials, encrypted sessions, and device access
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Password Management */}
            <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF' }}>Account Password</div>
                  <div style={{ fontSize: '12px', color: '#A9BDD7', marginTop: '2px' }}>
                    Secured with bcrypt cryptographic hash
                  </div>
                </div>

                <button
                  onClick={() => navigate('/forgot-password')}
                  className="auth-button secondary"
                  style={{ width: 'auto', padding: '0 14px', height: '34px', fontSize: '12px', margin: 0 }}
                >
                  Change Password
                </button>
              </div>
            </div>

            {/* OTP Protection */}
            <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF' }}>Two-Factor (2FA) OTP</div>
                  <div style={{ fontSize: '12px', color: '#A9BDD7', marginTop: '2px' }}>
                    Active for email verifications & bank linking
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: '#10B981', fontWeight: '600' }}>● Enabled</span>
              </div>
            </div>

            {/* Session Token */}
            <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF' }}>Current Session</div>
              <div style={{ fontSize: '12px', color: '#A9BDD7', marginTop: '4px' }}>
                JWT Bearer Token with auto-rotation refresh session (7 days validity).
              </div>
            </div>

            {/* Sign Out Action */}
            <div style={{ marginTop: '10px' }}>
              <button
                onClick={handleLogout}
                className="auth-button secondary"
                style={{ width: '100%', height: '42px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <LogOutIcon size={16} />
                <span>Log Out of All Devices</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Preferences & Channel Subscriptions */}
      <div className="dashboard-card" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: 'rgba(0, 166, 255, 0.1)', borderRadius: '8px', color: '#00A8FF' }}>
              <BellIcon size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                Notification Preferences & Alerts
              </h3>
              <p style={{ fontSize: '12px', color: '#A9BDD7', margin: '2px 0 0' }}>
                Real-time dispatch channels configured for your registered contact points
              </p>
            </div>
          </div>

          <button
            onClick={loadPreferences}
            className="auth-button secondary"
            style={{ width: 'auto', padding: '0 12px', height: '32px', fontSize: '11px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCwIcon size={12} className={loadingPrefs ? 'animate-spin' : ''} />
            <span>Sync Settings</span>
          </button>
        </div>

        {loadingPrefs ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#A9BDD7', fontSize: '13px' }}>
            Fetching notification preferences from server...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {[
              { key: 'paymentNotifications', label: 'Payment & Settlement Alerts', desc: 'Instant alerts on outgoing and incoming payments' },
              { key: 'walletNotifications', label: 'Wallet & Escrow Ledger', desc: 'Balance debits, credits, and limit updates' },
              { key: 'bankNotifications', label: 'Bank Account & Linking', desc: 'Micro-deposit verification and linking status' },
              { key: 'upiNotifications', label: 'UPI Handle Activity', desc: 'Real-time VPA transactions and QR notifications' },
              { key: 'securityNotifications', label: 'Security & Auth Alerts', desc: 'Login notices, password changes, and OTP requests' },
              { key: 'digitalLandNotifications', label: 'Digital Land Portfolio', desc: 'Order status, allotment, and appraisal updates' },
              { key: 'kycNotifications', label: 'KYC & Compliance Updates', desc: 'Verification status and annual compliance alerts' },
              { key: 'generalNotifications', label: 'General Announcements', desc: 'Subsystem maintenance and platform updates' }
            ].map((item) => {
              const isEnabled = preferences ? Boolean(preferences[item.key]) : true;
              return (
                <div
                  key={item.key}
                  style={{
                    background: '#071426',
                    border: '1px solid #1B2D45',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF' }}>{item.label}</span>
                      <span
                        className={`sidebar-badge ${isEnabled ? 'green' : 'yellow'}`}
                        style={{ fontSize: '10px', padding: '2px 6px' }}
                      >
                        {isEnabled ? '● Active' : '○ Disabled'}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#647B9C', marginTop: '4px', lineHeight: '1.4' }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CustomerProfilePage;

