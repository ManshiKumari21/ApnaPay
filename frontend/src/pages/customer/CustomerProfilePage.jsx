import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import notificationService from '../../services/notificationService';
import bankAccountService from '../../services/bankAccountService';
import upiService from '../../services/upiService';
import walletService from '../../services/walletService';
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  ShieldIcon,
  LockIcon,
  CheckCircleIcon,
  LogOutIcon,
  BellIcon,
  RefreshCwIcon,
  QrCodeIcon,
  DownloadIcon,
  ShareIcon,
  CopyIcon,
  CheckIcon,
  LandmarkIcon,
  CreditCardIcon,
  ChevronRightIcon,
  InfoIcon,
  SparklesIcon,
  WalletIcon,
  GiftIcon,
  SmartphoneIcon,
  HelpCircleIcon,
  GlobeIcon,
  SettingsIcon,
  ZapIcon,
  XIcon,
  ArrowLeftIcon
} from '../../components/Icons';

/**
 * High-fidelity Vector QR Code Component representing Bharat UPI QR Code
 * Scalable, sharp vector rendering matching PhonePe official personal QR UI
 */
const PhonePePersonalQr = ({ upiId = '8602612434@apnapay', name = 'Gopal Parmar' }) => {
  return (
    <div style={{ position: 'relative', width: '210px', height: '210px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        style={{ borderRadius: '8px', display: 'block' }}
        shapeRendering="crispEdges"
      >
        <rect width="200" height="200" fill="#FFFFFF" />

        {/* Top-Left Position Detection Finder Pattern */}
        <rect x="12" y="12" width="48" height="48" fill="#000000" rx="3" />
        <rect x="18" y="18" width="36" height="36" fill="#FFFFFF" rx="2" />
        <rect x="24" y="24" width="24" height="24" fill="#000000" rx="2" />

        {/* Top-Right Position Detection Finder Pattern */}
        <rect x="140" y="12" width="48" height="48" fill="#000000" rx="3" />
        <rect x="146" y="18" width="36" height="36" fill="#FFFFFF" rx="2" />
        <rect x="152" y="24" width="24" height="24" fill="#000000" rx="2" />

        {/* Bottom-Left Position Detection Finder Pattern */}
        <rect x="12" y="140" width="48" height="48" fill="#000000" rx="3" />
        <rect x="18" y="146" width="36" height="36" fill="#FFFFFF" rx="2" />
        <rect x="24" y="152" width="24" height="24" fill="#000000" rx="2" />

        {/* Alignment Pattern (Bottom-Right area) */}
        <rect x="136" y="136" width="28" height="28" fill="#000000" rx="2" />
        <rect x="142" y="142" width="16" height="16" fill="#FFFFFF" rx="1" />
        <rect x="147" y="147" width="6" height="6" fill="#000000" rx="1" />

        {/* Horizontal Timing Pattern */}
        <g fill="#000000">
          <rect x="66" y="32" width="6" height="6" />
          <rect x="78" y="32" width="6" height="6" />
          <rect x="90" y="32" width="6" height="6" />
          <rect x="102" y="32" width="6" height="6" />
          <rect x="114" y="32" width="6" height="6" />
          <rect x="126" y="32" width="6" height="6" />
        </g>

        {/* Vertical Timing Pattern */}
        <g fill="#000000">
          <rect x="32" y="66" width="6" height="6" />
          <rect x="32" y="78" width="6" height="6" />
          <rect x="32" y="90" width="6" height="6" />
          <rect x="32" y="102" width="6" height="6" />
          <rect x="32" y="114" width="6" height="6" />
          <rect x="32" y="126" width="6" height="6" />
        </g>

        {/* Realistic Data Matrix Module Matrix */}
        <g fill="#000000">
          <rect x="66" y="14" width="6" height="6" />
          <rect x="74" y="14" width="6" height="6" />
          <rect x="88" y="14" width="6" height="6" />
          <rect x="104" y="14" width="6" height="6" />
          <rect x="120" y="14" width="6" height="6" />
          <rect x="74" y="22" width="6" height="6" />
          <rect x="82" y="22" width="6" height="6" />
          <rect x="96" y="22" width="6" height="6" />
          <rect x="112" y="22" width="6" height="6" />
          <rect x="126" y="22" width="6" height="6" />

          <rect x="14" y="66" width="6" height="6" />
          <rect x="22" y="66" width="6" height="6" />
          <rect x="14" y="74" width="6" height="6" />
          <rect x="22" y="82" width="6" height="6" />
          <rect x="14" y="96" width="6" height="6" />
          <rect x="22" y="104" width="6" height="6" />
          <rect x="14" y="112" width="6" height="6" />
          <rect x="22" y="120" width="6" height="6" />

          <rect x="142" y="66" width="6" height="6" />
          <rect x="150" y="66" width="6" height="6" />
          <rect x="164" y="66" width="6" height="6" />
          <rect x="178" y="66" width="6" height="6" />
          <rect x="142" y="74" width="6" height="6" />
          <rect x="158" y="74" width="6" height="6" />
          <rect x="172" y="74" width="6" height="6" />
          <rect x="150" y="82" width="6" height="6" />
          <rect x="164" y="82" width="6" height="6" />
          <rect x="178" y="82" width="6" height="6" />
          <rect x="142" y="90" width="6" height="6" />
          <rect x="172" y="90" width="6" height="6" />

          <rect x="44" y="44" width="6" height="6" />
          <rect x="52" y="44" width="6" height="6" />
          <rect x="68" y="44" width="6" height="6" />
          <rect x="84" y="44" width="6" height="6" />
          <rect x="108" y="44" width="6" height="6" />
          <rect x="124" y="44" width="6" height="6" />
          <rect x="44" y="52" width="6" height="6" />
          <rect x="60" y="52" width="6" height="6" />
          <rect x="76" y="52" width="6" height="6" />
          <rect x="92" y="52" width="6" height="6" />
          <rect x="116" y="52" width="6" height="6" />

          <rect x="44" y="68" width="6" height="6" />
          <rect x="52" y="76" width="6" height="6" />
          <rect x="68" y="68" width="6" height="6" />
          <rect x="76" y="76" width="6" height="6" />
          <rect x="116" y="68" width="6" height="6" />
          <rect x="124" y="76" width="6" height="6" />

          <rect x="44" y="116" width="6" height="6" />
          <rect x="60" y="124" width="6" height="6" />
          <rect x="68" y="116" width="6" height="6" />
          <rect x="116" y="116" width="6" height="6" />
          <rect x="124" y="124" width="6" height="6" />

          <rect x="66" y="142" width="6" height="6" />
          <rect x="82" y="142" width="6" height="6" />
          <rect x="98" y="142" width="6" height="6" />
          <rect x="114" y="142" width="6" height="6" />
          <rect x="74" y="150" width="6" height="6" />
          <rect x="90" y="150" width="6" height="6" />
          <rect x="106" y="150" width="6" height="6" />
          <rect x="122" y="150" width="6" height="6" />
          <rect x="66" y="158" width="6" height="6" />
          <rect x="82" y="158" width="6" height="6" />
          <rect x="114" y="158" width="6" height="6" />
          <rect x="74" y="166" width="6" height="6" />
          <rect x="98" y="166" width="6" height="6" />
          <rect x="122" y="166" width="6" height="6" />
          <rect x="66" y="174" width="6" height="6" />
          <rect x="90" y="174" width="6" height="6" />
          <rect x="106" y="174" width="6" height="6" />

          <rect x="170" y="142" width="6" height="6" />
          <rect x="178" y="150" width="6" height="6" />
          <rect x="170" y="158" width="6" height="6" />
          <rect x="178" y="166" width="6" height="6" />
          <rect x="170" y="174" width="6" height="6" />
        </g>

        {/* Center Circular Brand Badge (ApnaPay Emblem) */}
        <circle cx="100" cy="100" r="23" fill="#FFFFFF" />
        <circle cx="100" cy="100" r="20" fill="#087BFF" />
        <circle cx="100" cy="100" r="19" fill="#0B1B32" />
        <circle cx="100" cy="100" r="16" fill="url(#apnaPayGrad)" />

        <defs>
          <linearGradient id="apnaPayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#087BFF" />
            <stop offset="100%" stopColor="#00D5FF" />
          </linearGradient>
        </defs>

        <text
          x="100"
          y="106"
          fill="#FFFFFF"
          fontSize="17"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          textAnchor="middle"
        >
          पे
        </text>
      </svg>
    </div>
  );
};

const CustomerProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Dynamic States
  const [bankAccounts, setBankAccounts] = useState([]);
  const [upiHandles, setUpiHandles] = useState([]);
  const [walletBalance, setWalletBalance] = useState('₹5,420.00');
  const [preferences, setPreferences] = useState(null);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [receivingMoneyAllowed, setReceivingMoneyAllowed] = useState(true);

  // Feature Toggles (PhonePe Style Settings)
  const [fingerprintEnabled, setFingerprintEnabled] = useState(true);
  const [internationalEnabled, setInternationalEnabled] = useState(false);
  const [shakeToScanEnabled, setShakeToScanEnabled] = useState(false);

  // Modals
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [cardsModalOpen, setCardsModalOpen] = useState(false);
  const [giftCardModalOpen, setGiftCardModalOpen] = useState(false);
  const [referModalOpen, setReferModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Initial Data Fetch
  useEffect(() => {
    let isMounted = true;

    const loadProfileData = async () => {
      try {
        const [banksRes, upiRes, walletRes, prefsRes] = await Promise.allSettled([
          bankAccountService.getLinkedAccounts(),
          upiService.getUpiHandles(),
          walletService.getOverview(),
          notificationService.getPreferences()
        ]);

        if (isMounted) {
          if (banksRes.status === 'fulfilled') {
            const data = banksRes.value?.data || banksRes.value || [];
            setBankAccounts(Array.isArray(data) ? data : []);
          }
          if (upiRes.status === 'fulfilled') {
            const data = upiRes.value?.data || upiRes.value || [];
            setUpiHandles(Array.isArray(data) ? data : []);
          }
          if (walletRes.status === 'fulfilled') {
            const wData = walletRes.value?.data || walletRes.value;
            if (wData?.balance !== undefined) {
              setWalletBalance(`₹${Number(wData.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
            }
          }
          if (prefsRes.status === 'fulfilled') {
            setPreferences(prefsRes.value?.data || null);
          }
          setLoadingPrefs(false);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Profile data load warning:', err.message);
          setLoadingPrefs(false);
        }
      }
    };

    loadProfileData();

    return () => {
      isMounted = false;
    };
  }, []);

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

  // Computed Primary Account & UPI ID
  const primaryBank = bankAccounts.find((b) => b.is_primary) || bankAccounts[0] || null;
  const primaryBankName = primaryBank?.bank_name || 'State Bank of India';
  const primaryBankLast4 = primaryBank?.account_number ? String(primaryBank.account_number).slice(-4) : '9422';

  const userPhone = user?.phone || '8602612434';
  const primaryUpi = upiHandles[0]?.upi_id || upiHandles[0]?.handle || `${userPhone}@apnapay`;

  // Initials (e.g. "GP")
  const getInitials = (name) => {
    if (!name) return 'GP';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  const initials = getInitials(user?.full_name);

  // Copy UPI Handler
  const handleCopyUpi = (text) => {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedUpi(true);
      showToast('UPI ID copied to clipboard!');
      setTimeout(() => setCopiedUpi(false), 2200);
    }
  };

  // Download QR Code Handler
  const handleDownloadQr = () => {
    showToast(`Personal Bharat QR (${userPhone}@apnapay) saved to device!`);
  };

  // Share QR Code Handler
  const handleShareQr = async () => {
    const shareText = `Pay to ${user?.full_name || 'ApnaPay User'} on ApnaPay UPI: ${primaryUpi}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ApnaPay Personal UPI QR',
          text: shareText
        });
        showToast('Shared successfully!');
      } catch (e) {
        // cancelled or unsupported
      }
    } else {
      handleCopyUpi(primaryUpi);
      showToast('Payment link copied to share!');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <DashboardLayout
      title="Profile & Settings"
      subtitle="PhonePe-inspired profile options, personal QR code, payment rails & preferences"
      backFallback="/app"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#071426',
            border: '1px solid #00D5FF',
            borderRadius: '12px',
            padding: '12px 20px',
            color: '#FFFFFF',
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

      {/* Main Centered Profile & QR Container */}
      <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ========================================================= */}
        {/* 1. USER IDENTITY HEADER (PhonePe Style Avatar + Manage)    */}
        {/* ========================================================= */}
        <div
          style={{
            background: '#0B1B32',
            border: '1px solid #17385D',
            borderRadius: '16px',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.35)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Avatar Circle with GP */}
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #087BFF 0%, #00D5FF 100%)',
                color: '#FFFFFF',
                fontSize: '19px',
                fontWeight: '900',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(0, 168, 255, 0.45)',
                border: '2px solid #071426',
                flexShrink: 0
              }}
            >
              {initials}
            </div>

            <div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '0.2px' }}>
                +91 {userPhone}
              </div>
              <div style={{ fontSize: '12px', color: '#A9BDD7', marginTop: '2px' }}>
                {user?.full_name || 'ApnaPay Customer'} • Update profile details
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setProfileModalOpen(true)}
            style={{
              background: 'rgba(0, 168, 255, 0.12)',
              border: '1px solid rgba(0, 168, 255, 0.35)',
              color: '#00D5FF',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 168, 255, 0.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 168, 255, 0.12)')}
          >
            Manage
          </button>
        </div>

        {/* ========================================================= */}
        {/* 2. RECEIVE MONEY FROM ALL UPI APPS BANNER                */}
        {/* ========================================================= */}
        <div
          style={{
            background: 'linear-gradient(135deg, #071426 0%, #0E2442 100%)',
            border: '1px solid #1E3A5F',
            borderRadius: '16px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(0, 213, 255, 0.15)',
                border: '1px solid rgba(0, 213, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00D5FF',
                flexShrink: 0
              }}
            >
              <InfoIcon size={18} />
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#A9BDD7', fontWeight: '600' }}>
                Universal Bharat UPI Interoperability
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF', marginTop: '1px' }}>
                Receive money from all UPI apps on ApnaPay
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setReceivingMoneyAllowed(!receivingMoneyAllowed);
              showToast(receivingMoneyAllowed ? 'UPI reception disabled' : 'UPI reception active from all apps!');
            }}
            style={{
              background: receivingMoneyAllowed
                ? 'linear-gradient(135deg, #087BFF, #00A8FF)'
                : '#17385D',
              border: 'none',
              color: '#FFFFFF',
              padding: '6px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            {receivingMoneyAllowed ? 'Allow ✓' : 'Enable'}
          </button>
        </div>

        {/* Carousel Indicator Dots */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', margin: '2px 0' }}>
          <span style={{ width: '18px', height: '4px', borderRadius: '4px', background: '#00D5FF' }} />
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#1E3A5F' }} />
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#1E3A5F' }} />
        </div>

        {/* ========================================================= */}
        {/* 3. HERO PERSONAL QR CODE CARD                            */}
        {/* ========================================================= */}
        <div
          style={{
            background: '#071426',
            border: '1.5px solid #17385D',
            borderRadius: '20px',
            padding: '24px 20px 20px',
            textAlign: 'center',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
            position: 'relative'
          }}
        >
          {/* Top Label */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#00D5FF', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              Personal Bharat UPI QR
            </div>
            <div style={{ fontSize: '11px', color: '#00E599', fontWeight: '700' }}>
              ● Instant Settlement
            </div>
          </div>

          {/* White Card with Vector QR Code */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '16px',
              maxWidth: '240px',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
            }}
          >
            <PhonePePersonalQr upiId={primaryUpi} name={user?.full_name} />
          </div>

          {/* Linked Bank Pill (PhonePe Style) */}
          <div
            onClick={() => navigate('/app/banks')}
            style={{
              background: '#0B1B32',
              border: '1px solid #1E3A5F',
              borderRadius: '24px',
              padding: '8px 16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              marginBottom: '16px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00A8FF')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1E3A5F')}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#087BFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}
            >
              <LandmarkIcon size={12} />
            </div>

            <span style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>
              {primaryBankName} •••• {primaryBankLast4}
            </span>

            <ChevronRightIcon size={14} style={{ color: '#A9BDD7' }} />
          </div>

          {/* UPI ID Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '18px'
            }}
          >
            <span style={{ fontSize: '12px', color: '#A9BDD7' }}>UPI ID:</span>
            <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#00D5FF', fontFamily: 'monospace' }}>
              {primaryUpi}
            </span>
            <button
              type="button"
              onClick={() => handleCopyUpi(primaryUpi)}
              style={{
                background: 'transparent',
                border: 'none',
                color: copiedUpi ? '#00E599' : '#00A8FF',
                cursor: 'pointer',
                padding: '3px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Copy UPI ID"
            >
              {copiedUpi ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
            </button>
          </div>

          {/* Download & Share Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              type="button"
              onClick={handleDownloadQr}
              className="auth-button secondary"
              style={{
                height: '42px',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                margin: 0,
                fontSize: '13px',
                fontWeight: '700'
              }}
            >
              <DownloadIcon size={16} />
              <span>Download</span>
            </button>

            <button
              type="button"
              onClick={handleShareQr}
              className="auth-button secondary"
              style={{
                height: '42px',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                margin: 0,
                fontSize: '13px',
                fontWeight: '700'
              }}
            >
              <ShareIcon size={16} />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. PAYMENT METHODS (PhonePe Video List - Exclusions Applied) */}
        {/* ========================================================= */}
        <div style={{ background: '#0B1B32', border: '1px solid #17385D', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px 10px', fontSize: '14px', fontWeight: '800', color: '#FFFFFF', borderBottom: '1px solid #142E4E' }}>
            Payment Methods
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* 1. Bank Accounts */}
            <div
              onClick={() => navigate('/app/banks')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid #112845',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#0E223D')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(8, 123, 255, 0.15)', border: '1px solid rgba(8, 123, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A8FF' }}>
                  <LandmarkIcon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>Bank Accounts</div>
                  <div style={{ fontSize: '11.5px', color: '#A9BDD7', marginTop: '2px' }}>Set UPI PIN, Add Accounts & more</div>
                </div>
              </div>
              <ChevronRightIcon size={16} style={{ color: '#64748B' }} />
            </div>

            {/* 2. ApnaPay Wallet */}
            <div
              onClick={() => navigate('/app/wallet')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid #112845',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#0E223D')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
                  <WalletIcon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>ApnaPay Wallet</div>
                  <div style={{ fontSize: '11.5px', color: '#A9BDD7', marginTop: '2px' }}>Balance: {walletBalance} • Earn up to 2% cashback</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11.5px', color: '#00D5FF', fontWeight: '700' }}>Top Up</span>
                <ChevronRightIcon size={16} style={{ color: '#64748B' }} />
              </div>
            </div>

            {/* 3. Credit Cards */}
            <div
              onClick={() => setCardsModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid #112845',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#0E223D')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8' }}>
                  <CreditCardIcon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>Credit Cards</div>
                  <div style={{ fontSize: '11.5px', color: '#A9BDD7', marginTop: '2px' }}>Add Cards, Pay Bills, Manage (RuPay, VISA, MasterCard)</div>
                </div>
              </div>
              <ChevronRightIcon size={16} style={{ color: '#64748B' }} />
            </div>

            {/* 4. Debit Cards */}
            <div
              onClick={() => setCardsModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid #112845',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#0E223D')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                  <CreditCardIcon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>Debit Cards</div>
                  <div style={{ fontSize: '11.5px', color: '#A9BDD7', marginTop: '2px' }}>Manage your saved cards</div>
                </div>
              </div>
              <ChevronRightIcon size={16} style={{ color: '#64748B' }} />
            </div>

            {/* 5. ApnaPay Gift Card */}
            <div
              onClick={() => setGiftCardModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#0E223D')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C084FC' }}>
                  <GiftIcon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>ApnaPay Gift Card</div>
                  <div style={{ fontSize: '11.5px', color: '#A9BDD7', marginTop: '2px' }}>Gift for your loved ones</div>
                </div>
              </div>
              <ChevronRightIcon size={16} style={{ color: '#64748B' }} />
            </div>
          </div>
        </div>

        {/* Promo Banner (Inspired by PhonePe FD banner) */}
        <div
          onClick={() => navigate('/app/services')}
          style={{
            background: 'linear-gradient(135deg, #091D38 0%, #071324 100%)',
            border: '1px solid #1E3A5F',
            borderRadius: '14px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: '#A9BDD7' }}>Did you know?</div>
            <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#FFFFFF', marginTop: '2px' }}>
              You can earn 12% CAGR with ApnaPay Choti SIP &rarr;
            </div>
          </div>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(0, 229, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00E599' }}>
            <ZapIcon size={20} />
          </div>
        </div>

        {/* ========================================================= */}
        {/* 5. PAYMENT SETTINGS (From PhonePe Video)                  */}
        {/* ========================================================= */}
        <div style={{ background: '#0B1B32', border: '1px solid #17385D', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px 10px', fontSize: '14px', fontWeight: '800', color: '#FFFFFF', borderBottom: '1px solid #142E4E' }}>
            Payment Settings
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* AutoPay */}
            <div
              onClick={() => navigate('/app/services')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid #112845',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#0E223D')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(192, 132, 252, 0.15)', border: '1px solid rgba(192, 132, 252, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C084FC' }}>
                  <RefreshCwIcon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>AutoPay</div>
                  <div style={{ fontSize: '11.5px', color: '#A9BDD7', marginTop: '2px' }}>Manage your IPOs, SIPs & recurring mandates</div>
                </div>
              </div>
              <ChevronRightIcon size={16} style={{ color: '#64748B' }} />
            </div>

            {/* Pay with Fingerprint */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid #112845'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0, 168, 255, 0.15)', border: '1px solid rgba(0, 168, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A8FF' }}>
                  <LockIcon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>Pay with Fingerprint</div>
                  <div style={{ fontSize: '11.5px', color: '#A9BDD7', marginTop: '2px' }}>Up to ₹10,000 without UPI PIN</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFingerprintEnabled(!fingerprintEnabled);
                  showToast(fingerprintEnabled ? 'Fingerprint payment disabled' : 'Fingerprint payment enabled!');
                }}
                style={{
                  width: '42px',
                  height: '24px',
                  borderRadius: '12px',
                  background: fingerprintEnabled ? '#00E599' : '#1E3A5F',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s ease'
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: fingerprintEnabled ? '21px' : '3px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    transition: 'left 0.2s ease'
                  }}
                />
              </button>
            </div>

            {/* International */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid #112845'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(20, 184, 166, 0.15)', border: '1px solid rgba(20, 184, 166, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#14B8A6' }}>
                  <GlobeIcon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>International</div>
                  <div style={{ fontSize: '11.5px', color: '#A9BDD7', marginTop: '2px' }}>Scan & Pay at Global Merchants</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInternationalEnabled(!internationalEnabled);
                  showToast(internationalEnabled ? 'International UPI deactivated' : 'International UPI activated for 90 days!');
                }}
                style={{
                  width: '42px',
                  height: '24px',
                  borderRadius: '12px',
                  background: internationalEnabled ? '#00E599' : '#1E3A5F',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s ease'
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: internationalEnabled ? '21px' : '3px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    transition: 'left 0.2s ease'
                  }}
                />
              </button>
            </div>

            {/* UPI Settings */}
            <div
              onClick={() => navigate('/app/upi')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#0E223D')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0, 213, 255, 0.15)', border: '1px solid rgba(0, 213, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00D5FF' }}>
                  <ShieldIcon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>UPI Settings</div>
                  <div style={{ fontSize: '11.5px', color: '#A9BDD7', marginTop: '2px' }}>Manage UPI IDs and UPI Number</div>
                </div>
              </div>
              <ChevronRightIcon size={16} style={{ color: '#64748B' }} />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 6. PREFERENCES & SECURITY (From PhonePe Video)            */}
        {/* ========================================================= */}
        <div style={{ background: '#0B1B32', border: '1px solid #17385D', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px 10px', fontSize: '14px', fontWeight: '800', color: '#FFFFFF', borderBottom: '1px solid #142E4E' }}>
            Preferences & Security
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Preferences & Security Item */}
            <div
              onClick={() => setSecurityModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid #112845',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#0E223D')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C084FC' }}>
                  <SettingsIcon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>Preferences & Security</div>
                  <div style={{ fontSize: '11.5px', color: '#A9BDD7', marginTop: '2px' }}>Languages, reminders, notifications, screen lock</div>
                </div>
              </div>
              <ChevronRightIcon size={16} style={{ color: '#64748B' }} />
            </div>

            {/* Shake to Scan Switch */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid #112845'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8' }}>
                  <SmartphoneIcon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>Shake to Scan</div>
                  <div style={{ fontSize: '11.5px', color: '#A9BDD7', marginTop: '2px' }}>Shake phone to open QR camera instantly</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShakeToScanEnabled(!shakeToScanEnabled);
                  showToast(shakeToScanEnabled ? 'Shake to Scan turned off' : 'Shake to Scan activated!');
                }}
                style={{
                  width: '42px',
                  height: '24px',
                  borderRadius: '12px',
                  background: shakeToScanEnabled ? '#00E599' : '#1E3A5F',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s ease'
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: shakeToScanEnabled ? '21px' : '3px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    transition: 'left 0.2s ease'
                  }}
                />
              </button>
            </div>

            {/* Refer and earn ₹200 */}
            <div
              onClick={() => setReferModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid #112845',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#0E223D')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EAB308' }}>
                  <GiftIcon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>Refer and earn ₹200</div>
                  <div style={{ fontSize: '11.5px', color: '#A9BDD7', marginTop: '2px' }}>Invite friends to ApnaPay & get cashback</div>
                </div>
              </div>
              <ChevronRightIcon size={16} style={{ color: '#64748B' }} />
            </div>

            {/* Help and support */}
            <div
              onClick={() => setHelpModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid #112845',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#0E223D')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                  <HelpCircleIcon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>Help and support</div>
                  <div style={{ fontSize: '11.5px', color: '#A9BDD7', marginTop: '2px' }}>24x7 ApnaPay customer assistance</div>
                </div>
              </div>
              <ChevronRightIcon size={16} style={{ color: '#64748B' }} />
            </div>

            {/* About ApnaPay */}
            <div
              onClick={() => setAboutModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid #112845',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#0E223D')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(148, 163, 184, 0.15)', border: '1px solid rgba(148, 163, 184, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                  <InfoIcon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>About ApnaPay</div>
                  <div style={{ fontSize: '11.5px', color: '#A9BDD7', marginTop: '2px' }}>Version 2.4.0 • Escrow Ledger Sandbox</div>
                </div>
              </div>
              <ChevronRightIcon size={16} style={{ color: '#64748B' }} />
            </div>

            {/* Log Out */}
            <div
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '16px 18px',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                <LogOutIcon size={18} />
              </div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#EF4444' }}>
                Log out
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* MODAL 1: MANAGE PROFILE DETAILS                           */}
      {/* ========================================================= */}
      {profileModalOpen && createPortal(
        <div className="admin-land-modal-overlay" onClick={() => setProfileModalOpen(false)}>
          <div className="admin-land-modal-container" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-land-modal-header">
              <div className="admin-land-modal-header-title">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="modal-corner-back-btn"
                  title="Back"
                  aria-label="Back"
                >
                  <ArrowLeftIcon size={18} />
                </button>
                <UserIcon size={18} style={{ color: '#00A8FF' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>Customer Profile Details</h3>
              </div>
              <button type="button" onClick={() => setProfileModalOpen(false)} className="admin-land-modal-close-btn">
                <XIcon size={16} />
              </button>
            </div>
            <div className="admin-land-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#A9BDD7' }}>Full Name</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF', marginTop: '2px' }}>{user?.full_name || 'Gopal Parmar'}</div>
              </div>
              <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#A9BDD7' }}>Registered Phone</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#00E599', marginTop: '2px' }}>+91 {userPhone}</div>
              </div>
              <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#A9BDD7' }}>Registered Email</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF', marginTop: '2px' }}>{user?.email || 'user@example.com'}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#A9BDD7' }}>Customer ID</div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#00A8FF', marginTop: '2px' }}>#{user?.id ? `AP-${user.id}` : 'AP-001'}</div>
                </div>
                <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#A9BDD7' }}>KYC Status</div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#00E599', marginTop: '2px' }}>Verified Tier 1</div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CARDS MANAGEMENT (CREDIT & DEBIT)                 */}
      {/* ========================================================= */}
      {cardsModalOpen && createPortal(
        <div className="admin-land-modal-overlay" onClick={() => setCardsModalOpen(false)}>
          <div className="admin-land-modal-container" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-land-modal-header">
              <div className="admin-land-modal-header-title">
                <CreditCardIcon size={18} style={{ color: '#00A8FF' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>Saved Credit & Debit Cards</h3>
              </div>
              <button type="button" onClick={() => setCardsModalOpen(false)} className="admin-land-modal-close-btn">
                <XIcon size={16} />
              </button>
            </div>
            <div className="admin-land-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Card 1 */}
              <div style={{ background: 'linear-gradient(135deg, #0A2540 0%, #153B66 100%)', border: '1px solid #1E4E8C', borderRadius: '14px', padding: '16px', color: '#FFFFFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '1px' }}>APNAPAY PLATINUM</span>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#00D5FF' }}>RuPay</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '2px', margin: '14px 0' }}>•••• •••• •••• 4219</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#CBD5E1' }}>
                  <span>{user?.full_name || 'GOPAL PARMAR'}</span>
                  <span>EXP: 09/28</span>
                </div>
              </div>

              {/* Card 2 */}
              <div style={{ background: 'linear-gradient(135deg, #132A13 0%, #1C401C 100%)', border: '1px solid #285A28', borderRadius: '14px', padding: '16px', color: '#FFFFFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '1px' }}>SBI GLOBAL DEBIT</span>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#00E599' }}>VISA</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '2px', margin: '14px 0' }}>•••• •••• •••• 9422</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#CBD5E1' }}>
                  <span>{user?.full_name || 'GOPAL PARMAR'}</span>
                  <span>EXP: 11/29</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCardsModalOpen(false);
                  showToast('Card linking token initiated!');
                }}
                className="auth-button"
                style={{ width: '100%', height: '38px', fontSize: '12.5px', margin: '4px 0 0' }}
              >
                + Add New Card
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL 3: APNAPAY GIFT CARD                                */}
      {/* ========================================================= */}
      {giftCardModalOpen && createPortal(
        <div className="admin-land-modal-overlay" onClick={() => setGiftCardModalOpen(false)}>
          <div className="admin-land-modal-container" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-land-modal-header">
              <div className="admin-land-modal-header-title">
                <GiftIcon size={18} style={{ color: '#C084FC' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>ApnaPay Gift Cards</h3>
              </div>
              <button type="button" onClick={() => setGiftCardModalOpen(false)} className="admin-land-modal-close-btn">
                <XIcon size={16} />
              </button>
            </div>
            <div className="admin-land-modal-body">
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', color: '#A9BDD7' }}>Send instant digital gift cards directly from your wallet balance with up to 5% cashback rewards.</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
                {['₹500', '₹1,000', '₹2,500'].map((amt) => (
                  <div
                    key={amt}
                    onClick={() => {
                      setGiftCardModalOpen(false);
                      showToast(`Gift card of ${amt} generated successfully!`);
                    }}
                    style={{ background: '#071426', border: '1px solid #1E3A5F', borderRadius: '10px', padding: '12px 8px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#C084FC')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1E3A5F')}
                  >
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#FFFFFF' }}>{amt}</div>
                    <div style={{ fontSize: '10px', color: '#00E599', marginTop: '2px' }}>Get 5% back</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL 4: REFER & EARN ₹200                                */}
      {/* ========================================================= */}
      {referModalOpen && createPortal(
        <div className="admin-land-modal-overlay" onClick={() => setReferModalOpen(false)}>
          <div className="admin-land-modal-container" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-land-modal-header">
              <div className="admin-land-modal-header-title">
                <GiftIcon size={18} style={{ color: '#EAB308' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>Refer & Earn ₹200</h3>
              </div>
              <button type="button" onClick={() => setReferModalOpen(false)} className="admin-land-modal-close-btn">
                <XIcon size={16} />
              </button>
            </div>
            <div className="admin-land-modal-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#CBD5E1', marginBottom: '14px' }}>
                Invite friends and family to join ApnaPay. When they register and make their first UPI transfer, you both receive ₹200 cashback directly in your escrow wallet!
              </div>
              <div style={{ background: '#071426', border: '1px dashed #00D5FF', borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', color: '#A9BDD7' }}>YOUR REFERRAL CODE</span>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#00D5FF', letterSpacing: '3px', marginTop: '4px' }}>
                  APNA200
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) navigator.clipboard.writeText('APNA200');
                  showToast('Referral code APNA200 copied to clipboard!');
                }}
                className="auth-button"
                style={{ width: '100%', height: '40px', fontSize: '13px', margin: 0 }}
              >
                Copy & Share Invite Code
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL 5: ABOUT APNAPAY                                    */}
      {/* ========================================================= */}
      {aboutModalOpen && createPortal(
        <div className="admin-land-modal-overlay" onClick={() => setAboutModalOpen(false)}>
          <div className="admin-land-modal-container" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-land-modal-header">
              <div className="admin-land-modal-header-title">
                <InfoIcon size={18} style={{ color: '#00A8FF' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>About ApnaPay</h3>
              </div>
              <button type="button" onClick={() => setAboutModalOpen(false)} className="admin-land-modal-close-btn">
                <XIcon size={16} />
              </button>
            </div>
            <div className="admin-land-modal-body" style={{ fontSize: '12.5px', color: '#CBD5E1', lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 10px 0' }}>
                <strong>ApnaPay Digital Payments (v2.4.0)</strong> is an enterprise-grade financial technology platform built on double-entry escrow ledger rails with simulated UPI, BharatQR and BBPS integrations.
              </p>
              <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '8px', padding: '10px', marginTop: '10px', fontSize: '11px', color: '#A9BDD7' }}>
                Security: 256-bit AES encryption • Bcrypt credential hashing • ISO-8583 message standard emulation.
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL 6: HELP & SUPPORT                                   */}
      {/* ========================================================= */}
      {helpModalOpen && createPortal(
        <div className="admin-land-modal-overlay" onClick={() => setHelpModalOpen(false)}>
          <div className="admin-land-modal-container" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-land-modal-header">
              <div className="admin-land-modal-header-title">
                <HelpCircleIcon size={18} style={{ color: '#00E599' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>24x7 Help & Support</h3>
              </div>
              <button type="button" onClick={() => setHelpModalOpen(false)} className="admin-land-modal-close-btn">
                <XIcon size={16} />
              </button>
            </div>
            <div className="admin-land-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#FFFFFF' }}>How to scan & pay?</div>
                <div style={{ fontSize: '11px', color: '#A9BDD7', marginTop: '2px' }}>Use the center Scan QR button in the bottom navigation bar or enable "Shake to Scan".</div>
              </div>
              <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#FFFFFF' }}>Where is my personal QR code?</div>
                <div style={{ fontSize: '11px', color: '#A9BDD7', marginTop: '2px' }}>Your personal QR code is always displayed at the top of this Profile screen with download and share buttons.</div>
              </div>
              <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#FFFFFF' }}>Need urgent assistance?</div>
                <div style={{ fontSize: '11px', color: '#A9BDD7', marginTop: '2px' }}>Email our support team at support@apnapay.com or call toll-free 1800-APNA-PAY.</div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL 7: PREFERENCES & SECURITY MODAL                     */}
      {/* ========================================================= */}
      {securityModalOpen && createPortal(
        <div className="admin-land-modal-overlay" onClick={() => setSecurityModalOpen(false)}>
          <div className="admin-land-modal-container" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-land-modal-header">
              <div className="admin-land-modal-header-title">
                <SettingsIcon size={18} style={{ color: '#00D5FF' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>Preferences & Security Settings</h3>
              </div>
              <button type="button" onClick={() => setSecurityModalOpen(false)} className="admin-land-modal-close-btn">
                <XIcon size={16} />
              </button>
            </div>
            <div className="admin-land-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '65vh', overflowY: 'auto' }}>
              <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>Account Password</div>
                  <div style={{ fontSize: '11px', color: '#A9BDD7', marginTop: '2px' }}>Secured with bcrypt cryptographic hash</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSecurityModalOpen(false);
                    navigate('/forgot-password');
                  }}
                  className="auth-button secondary"
                  style={{ width: 'auto', padding: '0 12px', height: '32px', fontSize: '11.5px', margin: 0 }}
                >
                  Change
                </button>
              </div>

              <div style={{ fontSize: '12px', fontWeight: '800', color: '#00D5FF', marginTop: '6px' }}>
                Notification Channels
              </div>

              {[
                { key: 'paymentNotifications', label: 'Payment & Settlement Alerts' },
                { key: 'walletNotifications', label: 'Wallet & Escrow Ledger' },
                { key: 'upiNotifications', label: 'UPI Handle Activity' },
                { key: 'securityNotifications', label: 'Security & Auth Notices' }
              ].map((item) => {
                const isEnabled = preferences ? Boolean(preferences[item.key]) : true;
                return (
                  <div
                    key={item.key}
                    style={{
                      background: '#071426',
                      border: '1px solid #17385D',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#FFFFFF' }}>{item.label}</span>
                    <span style={{ fontSize: '11px', color: isEnabled ? '#00E599' : '#64748B', fontWeight: '700' }}>
                      {isEnabled ? '● Active' : '○ Off'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

    </DashboardLayout>
  );
};

export default CustomerProfilePage;
