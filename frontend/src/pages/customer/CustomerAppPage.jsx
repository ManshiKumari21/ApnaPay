import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldIcon,
  UserIcon,
  LogOutIcon,
  WalletIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  BankIcon,
  TrashIcon,
  PlusIcon,
  RefreshCwIcon
} from '../../components/Icons';
import bankAccountService from '../../services/bankAccountService';
import upiService from '../../services/upiService';

const CustomerAppPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State: Bank Accounts
  const [bankAccounts, setBankAccounts] = useState([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [showAddBank, setShowAddBank] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    isPrimary: false
  });
  const [pendingVerification, setPendingVerification] = useState(null); // { bankAccountId, devOtp }
  const [otpValue, setOtpValue] = useState('');
  const [bankActionError, setBankActionError] = useState('');
  const [bankActionSuccess, setBankActionSuccess] = useState('');
  const [isSubmittingBank, setIsSubmittingBank] = useState(false);

  // State: UPI Handles
  const [upiHandles, setUpiHandles] = useState([]);
  const [isLoadingUpi, setIsLoadingUpi] = useState(false);
  const [showAddUpi, setShowAddUpi] = useState(false);
  const [newHandlePrefix, setNewHandlePrefix] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [upiActionError, setUpiActionError] = useState('');
  const [upiActionSuccess, setUpiActionSuccess] = useState('');
  const [isSubmittingUpi, setIsSubmittingUpi] = useState(false);

  // Load Data
  const loadData = async () => {
    setIsLoadingBanks(true);
    setIsLoadingUpi(true);
    try {
      const [banksRes, upiRes] = await Promise.all([
        bankAccountService.getLinkedAccounts().catch(() => ({ data: [] })),
        upiService.getUpiHandles().catch(() => ({ data: [] }))
      ]);
      setBankAccounts(banksRes.data || []);
      setUpiHandles(upiRes.data || []);
    } catch (_) {
    } finally {
      setIsLoadingBanks(false);
      setIsLoadingUpi(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // 1. Bank Linking: Initiate
  const handleInitiateBankLink = async (e) => {
    e.preventDefault();
    setBankActionError('');
    setBankActionSuccess('');

    if (!bankForm.bankName.trim()) {
      setBankActionError('Please enter bank name.');
      return;
    }
    if (!/^\d{9,18}$/.test(bankForm.accountNumber.trim())) {
      setBankActionError('Account number must be between 9 and 18 digits.');
      return;
    }
    if (bankForm.accountNumber.trim() !== bankForm.confirmAccountNumber.trim()) {
      setBankActionError('Account numbers do not match.');
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(bankForm.ifscCode.trim())) {
      setBankActionError('Please enter a valid 11-character IFSC code (e.g. SBIN0001234).');
      return;
    }

    setIsSubmittingBank(true);
    try {
      const res = await bankAccountService.linkAccount({
        bankName: bankForm.bankName.trim(),
        accountNumber: bankForm.accountNumber.trim(),
        confirmAccountNumber: bankForm.confirmAccountNumber.trim(),
        ifscCode: bankForm.ifscCode.trim().toUpperCase(),
        isPrimary: bankForm.isPrimary
      });

      setPendingVerification({
        bankAccountId: res.data.bankAccountId,
        devOtp: res.data.devOtp || ''
      });
      if (res.data.devOtp) {
        setOtpValue(res.data.devOtp);
      }
      setBankActionSuccess(res.message || 'OTP sent! Please enter the 6-digit verification code.');
    } catch (err) {
      setBankActionError(err.response?.data?.message || err.message || 'Failed to initiate bank linking.');
    } finally {
      setIsSubmittingBank(false);
    }
  };

  // 2. Bank Linking: Verify
  const handleVerifyBankLink = async (e) => {
    e.preventDefault();
    if (!otpValue || otpValue.trim().length !== 6) {
      setBankActionError('Please enter the 6-digit OTP code.');
      return;
    }

    setIsSubmittingBank(true);
    setBankActionError('');
    try {
      const res = await bankAccountService.verifyAccount({
        bankAccountId: pendingVerification.bankAccountId,
        otp: otpValue.trim()
      });

      setBankActionSuccess(res.message || 'Bank account verified and linked successfully!');
      setPendingVerification(null);
      setShowAddBank(false);
      setBankForm({
        bankName: '',
        accountNumber: '',
        confirmAccountNumber: '',
        ifscCode: '',
        isPrimary: false
      });
      setOtpValue('');
      await loadData();
    } catch (err) {
      setBankActionError(err.response?.data?.message || err.message || 'Failed to verify OTP.');
    } finally {
      setIsSubmittingBank(false);
    }
  };

  // 3. Bank Unlink
  const handleUnlinkBank = async (id, bankName, accountLast4) => {
    if (!window.confirm(`Are you sure you want to unlink ${bankName} (••••${accountLast4})?`)) {
      return;
    }

    setBankActionError('');
    setBankActionSuccess('');
    try {
      await bankAccountService.unlinkAccount(id);
      setBankActionSuccess(`Bank account (••••${accountLast4}) unlinked successfully.`);
      await loadData();
    } catch (err) {
      setBankActionError(err.response?.data?.message || err.message || 'Failed to unlink bank account.');
    }
  };

  // 4. UPI: Register Handle
  const handleCreateUpi = async (e) => {
    e.preventDefault();
    setUpiActionError('');
    setUpiActionSuccess('');

    const cleanPrefix = newHandlePrefix.trim().toLowerCase();
    if (!cleanPrefix) {
      setUpiActionError('Please enter a desired handle (e.g., yourname).');
      return;
    }

    setIsSubmittingUpi(true);
    try {
      const res = await upiService.createUpiHandle({
        upiId: cleanPrefix,
        bankAccountId: selectedBankId ? Number(selectedBankId) : undefined,
        isPrimary: upiHandles.length === 0
      });

      setUpiActionSuccess(res.message || 'UPI handle registered successfully!');
      setShowAddUpi(false);
      setNewHandlePrefix('');
      setSelectedBankId('');
      await loadData();
    } catch (err) {
      setUpiActionError(err.response?.data?.message || err.message || 'Failed to register UPI handle.');
    } finally {
      setIsSubmittingUpi(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Top Navigation */}
      <header className="dashboard-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="brand-logo-icon" style={{ width: '34px', height: '34px' }}>
            <ShieldIcon size={20} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: '700' }}>
            Apna<span style={{ color: '#00A8FF' }}>Pay</span>
          </span>
          <span className="brand-badge" style={{ marginBottom: 0, marginLeft: '10px' }}>
            CUSTOMER PORTAL
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={loadData}
            title="Refresh Data"
            className="auth-button secondary"
            style={{ width: 'auto', padding: '0 12px', height: '38px', margin: 0 }}
          >
            <RefreshCwIcon size={15} />
          </button>
          <button
            onClick={handleLogout}
            className="auth-button secondary"
            style={{ width: 'auto', padding: '0 16px', height: '38px', fontSize: '13px', margin: 0 }}
          >
            <LogOutIcon size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="dashboard-content fade-in">
        {/* Welcome Banner */}
        <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, rgba(22, 119, 255, 0.15) 0%, rgba(10, 20, 34, 0.95) 100%)', borderColor: '#17385D' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                <CheckCircleIcon size={16} />
                <span>AUTHENTICATED CUSTOMER</span>
              </div>
              <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#FFFFFF' }}>
                Welcome back, {user?.full_name || 'Valued Member'}!
              </h2>
              <p style={{ color: '#A9BDD7', fontSize: '14px', marginTop: '4px' }}>
                Manage your verified bank accounts, instant UPI handles, and secure payments.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(22, 119, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00A8FF', border: '1px solid rgba(0, 166, 255, 0.3)' }}>
                <UserIcon size={26} />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-item">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="stat-label">Available Balance</span>
              <WalletIcon size={18} style={{ color: '#00A8FF' }} />
            </div>
            <div className="stat-value">₹0.00</div>
            <span style={{ fontSize: '12px', color: '#10B981' }}>● Active INR Wallet</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">Linked Bank Accounts</span>
            <div className="stat-value" style={{ fontSize: '22px', color: '#00A8FF' }}>
              {bankAccounts.length}
            </div>
            <span style={{ fontSize: '12px', color: '#A9BDD7' }}>Active & Verified</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">Registered UPI Handles</span>
            <div className="stat-value" style={{ fontSize: '22px', color: '#00A8FF' }}>
              {upiHandles.length}
            </div>
            <span style={{ fontSize: '12px', color: '#10B981' }}>Ready for transfers</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">Account Security</span>
            <div className="stat-value" style={{ fontSize: '16px', color: '#10B981' }}>
              Verified (AES-256)
            </div>
            <span style={{ fontSize: '12px', color: '#A9BDD7' }}>#{user?.id ? `AP-${user.id}` : 'AP-001'}</span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 1: LINKED BANK ACCOUNTS                         */}
        {/* ======================================================== */}
        <div className="dashboard-card" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', background: 'rgba(0, 166, 255, 0.1)', borderRadius: '8px', color: '#00A8FF' }}>
                <BankIcon size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                  Linked Bank Accounts
                </h3>
                <p style={{ fontSize: '13px', color: '#A9BDD7', margin: '2px 0 0' }}>
                  Securely linked bank accounts for fund transfers, withdrawals, and UPI
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowAddBank(!showAddBank);
                setPendingVerification(null);
                setBankActionError('');
                setBankActionSuccess('');
              }}
              className="auth-button"
              style={{ width: 'auto', padding: '0 16px', height: '38px', fontSize: '13px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <PlusIcon size={16} />
              <span>{showAddBank ? 'Cancel' : 'Link New Bank Account'}</span>
            </button>
          </div>

          {/* Feedback messages */}
          {bankActionError && (
            <div className="auth-alert error" style={{ marginBottom: '16px' }}>
              <AlertCircleIcon size={16} />
              <span>{bankActionError}</span>
            </div>
          )}
          {bankActionSuccess && (
            <div className="auth-alert success" style={{ marginBottom: '16px' }}>
              <CheckCircleIcon size={16} />
              <span>{bankActionSuccess}</span>
            </div>
          )}

          {/* Add Bank Form Modal / Inline Box */}
          {showAddBank && (
            <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              {!pendingVerification ? (
                <form onSubmit={handleInitiateBankLink}>
                  <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF', marginBottom: '14px' }}>
                    Initiate Bank Account Linking
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#A9BDD7', marginBottom: '6px' }}>Bank Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. HDFC Bank, SBI, ICICI"
                        value={bankForm.bankName}
                        onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#A9BDD7', marginBottom: '6px' }}>Account Number</label>
                      <input
                        type="password"
                        className="form-input"
                        placeholder="9-18 digit account number"
                        value={bankForm.accountNumber}
                        onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#A9BDD7', marginBottom: '6px' }}>Confirm Account Number</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Re-enter account number"
                        value={bankForm.confirmAccountNumber}
                        onChange={(e) => setBankForm({ ...bankForm, confirmAccountNumber: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#A9BDD7', marginBottom: '6px' }}>IFSC Code</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. HDFC0001234"
                        value={bankForm.ifscCode}
                        onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#A9BDD7' }}>
                      <input
                        type="checkbox"
                        checked={bankForm.isPrimary}
                        onChange={(e) => setBankForm({ ...bankForm, isPrimary: e.target.checked })}
                      />
                      <span>Set as primary payment account</span>
                    </label>

                    <button
                      type="submit"
                      disabled={isSubmittingBank}
                      className="auth-button"
                      style={{ width: 'auto', padding: '0 20px', height: '40px', fontSize: '13px', margin: 0 }}
                    >
                      {isSubmittingBank ? 'Initiating...' : 'Send Verification OTP'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Verification Step */
                <form onSubmit={handleVerifyBankLink}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00A8FF', marginBottom: '10px' }}>
                    <ShieldIcon size={18} />
                    <span style={{ fontWeight: '600', fontSize: '15px' }}>Verify Account Ownership</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#A9BDD7', marginBottom: '14px' }}>
                    Enter the 6-digit OTP code sent to verify this bank account.
                    {pendingVerification.devOtp && (
                      <span style={{ display: 'block', color: '#10B981', marginTop: '4px' }}>
                        Dev OTP Auto-Filled: <strong>{pendingVerification.devOtp}</strong>
                      </span>
                    )}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '380px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="6-digit OTP"
                      maxLength={6}
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                      style={{ letterSpacing: '4px', fontSize: '18px', textAlign: 'center' }}
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingBank || otpValue.length !== 6}
                      className="auth-button"
                      style={{ width: 'auto', padding: '0 20px', height: '42px', fontSize: '13px', margin: 0, whiteSpace: 'nowrap' }}
                    >
                      {isSubmittingBank ? 'Verifying...' : 'Complete Linking'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Bank Accounts List */}
          {isLoadingBanks ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#A9BDD7' }}>
              Loading linked bank accounts...
            </div>
          ) : bankAccounts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', background: '#071426', borderRadius: '10px', border: '1px dashed #17385D' }}>
              <BankIcon size={32} style={{ color: '#17385D', margin: '0 auto 10px' }} />
              <p style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: '600', margin: 0 }}>No Bank Accounts Linked Yet</p>
              <p style={{ color: '#A9BDD7', fontSize: '13px', margin: '4px 0 16px' }}>
                Link your bank account to enable instant UPI and transfers.
              </p>
              <button
                onClick={() => setShowAddBank(true)}
                className="auth-button"
                style={{ width: 'auto', padding: '0 18px', height: '36px', fontSize: '13px', margin: '0 auto' }}
              >
                + Link Your First Bank Account
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {bankAccounts.map((account) => (
                <div
                  key={account.id}
                  style={{
                    background: '#071426',
                    border: `1px solid ${account.isPrimary ? '#087BFF' : '#17385D'}`,
                    borderRadius: '12px',
                    padding: '16px',
                    position: 'relative',
                    transition: 'border-color 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF' }}>
                      {account.bankName}
                    </span>
                    {account.isPrimary && (
                      <span style={{ fontSize: '11px', background: 'rgba(22, 119, 255, 0.2)', color: '#00A8FF', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
                        PRIMARY
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '18px', fontWeight: '600', letterSpacing: '1px', color: '#FFFFFF', margin: '8px 0' }}>
                    {account.maskedAccountNumber || `••••••••${account.accountLast4}`}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#A9BDD7' }}>
                    <span>IFSC: <strong style={{ color: '#FFFFFF' }}>{account.ifscCode}</strong></span>
                    <span style={{ color: account.status === 'active' ? '#10B981' : '#F59E0B' }}>
                      ● {account.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #162438', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      Holder: {account.accountHolderName}
                    </span>

                    <button
                      onClick={() => handleUnlinkBank(account.id, account.bankName, account.accountLast4)}
                      title="Unlink this bank account"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#EF4444',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px'
                      }}
                    >
                      <TrashIcon size={14} />
                      <span>Unlink</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* SECTION 2: REGISTERED UPI HANDLES                       */}
        {/* ======================================================== */}
        <div className="dashboard-card" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: '#10B981' }}>
                <ShieldIcon size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                  UPI Handles (VPA)
                </h3>
                <p style={{ fontSize: '13px', color: '#A9BDD7', margin: '2px 0 0' }}>
                  Your virtual payment addresses for receiving money instantly
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowAddUpi(!showAddUpi);
                setUpiActionError('');
                setUpiActionSuccess('');
              }}
              className="auth-button"
              style={{ width: 'auto', padding: '0 16px', height: '38px', fontSize: '13px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <PlusIcon size={16} />
              <span>{showAddUpi ? 'Cancel' : 'Create New UPI Handle'}</span>
            </button>
          </div>

          {/* Feedback messages */}
          {upiActionError && (
            <div className="auth-alert error" style={{ marginBottom: '16px' }}>
              <AlertCircleIcon size={16} />
              <span>{upiActionError}</span>
            </div>
          )}
          {upiActionSuccess && (
            <div className="auth-alert success" style={{ marginBottom: '16px' }}>
              <CheckCircleIcon size={16} />
              <span>{upiActionSuccess}</span>
            </div>
          )}

          {/* Create UPI Form */}
          {showAddUpi && (
            <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <form onSubmit={handleCreateUpi}>
                <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF', marginBottom: '14px' }}>
                  Register Instant UPI ID
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#A9BDD7', marginBottom: '6px' }}>Desired Handle</label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. yourname or mobile"
                        value={newHandlePrefix}
                        onChange={(e) => setNewHandlePrefix(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                        style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                        required
                      />
                      <span style={{ background: '#0B1B32', border: '1px solid #17385D', borderLeft: 'none', padding: '10px 14px', borderRadius: '0 10px 10px 0', color: '#00A8FF', fontSize: '14px', fontWeight: '600' }}>
                        @apnapay
                      </span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#A9BDD7', marginBottom: '6px' }}>Link to Bank Account</label>
                    <select
                      className="form-input"
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(e.target.value)}
                    >
                      <option value="">Default (Primary Bank Account)</option>
                      {bankAccounts.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} (••••{b.accountLast4}) {b.isPrimary ? '★ Primary' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={isSubmittingUpi || !newHandlePrefix.trim()}
                    className="auth-button"
                    style={{ width: 'auto', padding: '0 20px', height: '40px', fontSize: '13px', margin: 0 }}
                  >
                    {isSubmittingUpi ? 'Registering...' : 'Register UPI ID'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* UPI Handles List */}
          {isLoadingUpi ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#A9BDD7' }}>
              Loading UPI handles...
            </div>
          ) : upiHandles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 16px', background: '#071426', borderRadius: '10px', border: '1px dashed #17385D' }}>
              <p style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: '600', margin: 0 }}>No UPI Handles Created Yet</p>
              <p style={{ color: '#A9BDD7', fontSize: '13px', margin: '4px 0 16px' }}>
                Create your custom @apnapay UPI ID to receive payments instantly.
              </p>
              <button
                onClick={() => setShowAddUpi(true)}
                className="auth-button"
                style={{ width: 'auto', padding: '0 18px', height: '36px', fontSize: '13px', margin: '0 auto' }}
              >
                + Create UPI Handle
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {upiHandles.map((handle) => (
                <div
                  key={handle.id}
                  style={{
                    background: '#071426',
                    border: `1px solid ${handle.isPrimary ? '#10B981' : '#17385D'}`,
                    borderRadius: '10px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#00A8FF' }}>
                      {handle.upiId}
                    </div>
                    <div style={{ fontSize: '12px', color: '#A9BDD7', marginTop: '4px' }}>
                      {handle.bankName ? (
                        <span>Linked: {handle.bankName} (••••{handle.accountLast4})</span>
                      ) : (
                        <span style={{ color: '#EAB308' }}>Not linked to a bank</span>
                      )}
                    </div>
                  </div>

                  <div>
                    {handle.isPrimary ? (
                      <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', padding: '3px 8px', borderRadius: '10px', fontWeight: '600' }}>
                        PRIMARY
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#64748B' }}>Active</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CustomerAppPage;
