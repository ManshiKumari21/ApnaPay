import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  ShieldIcon,
  PlusIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  QrCodeIcon,
  CopyIcon,
  BankIcon,
  XIcon,
  CheckIcon,
  TrashIcon
} from '../../components/Icons';
import upiService from '../../services/upiService';
import bankAccountService from '../../services/bankAccountService';

const CustomerUpiPage = () => {
  const navigate = useNavigate();
  const [upiHandles, setUpiHandles] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [supportedSuffixes, setSupportedSuffixes] = useState(['@apnapay', '@apnabank', '@upi']);
  const [loading, setLoading] = useState(true);

  // Register Modal
  const [showModal, setShowModal] = useState(false);
  const [handlePrefix, setHandlePrefix] = useState('');
  const [selectedSuffix, setSelectedSuffix] = useState('@apnapay');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // QR Modal
  const [qrModalHandle, setQrModalHandle] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Banner feedback
  const [bannerSuccess, setBannerSuccess] = useState('');
  const [bannerError, setBannerError] = useState('');

  // Delete Modal
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [upiRes, banksRes] = await Promise.all([
        upiService.getUpiHandles(),
        bankAccountService.getLinkedAccounts()
      ]);
      setUpiHandles(upiRes.data || []);
      if (upiRes.availableSuffixes) {
        setSupportedSuffixes(upiRes.availableSuffixes);
      }
      setBankAccounts(banksRes.data || []);
    } catch (err) {
      setBannerError(err.response?.data?.message || err.message || 'Unable to load UPI data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openRegisterModal = () => {
    setHandlePrefix('');
    setSelectedSuffix('@apnapay');
    setSelectedBankId('');
    setIsPrimary(upiHandles.length === 0);
    setFormError('');
    setShowModal(true);
  };

  const handleRegisterUpi = async (e) => {
    e.preventDefault();
    setFormError('');

    const clean = handlePrefix.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
    if (!clean || clean.length < 3) {
      setFormError('Desired handle must contain at least 3 alphanumeric characters.');
      return;
    }

    const fullUpiId = `${clean}${selectedSuffix}`;

    setIsSubmitting(true);
    try {
      const res = await upiService.createUpiHandle({
        upiId: fullUpiId,
        bankAccountId: selectedBankId ? Number(selectedBankId) : undefined,
        isPrimary
      });

      setBannerSuccess(res.message || `UPI handle ${fullUpiId} registered successfully!`);
      setShowModal(false);
      await loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to register UPI handle.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteModal) return;
    setIsDeleting(true);
    setBannerError('');
    setBannerSuccess('');
    try {
      const res = await upiService.deleteUpiHandle(confirmDeleteModal.id);
      setBannerSuccess(res.message || `UPI handle ${confirmDeleteModal.upiId} deleted successfully.`);
      setConfirmDeleteModal(null);
      await loadData();
    } catch (err) {
      setBannerError(err.response?.data?.message || err.message || 'Failed to delete UPI handle.');
      setConfirmDeleteModal(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBack = () => {
    if (confirmDeleteModal) {
      setConfirmDeleteModal(null);
      return;
    }
    if (showModal) {
      setShowModal(false);
      return;
    }
    if (qrModalHandle) {
      setQrModalHandle(null);
      return;
    }
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/app');
    }
  };

  return (
    <DashboardLayout
      title="UPI Handle Management"
      subtitle="Create virtual payment addresses, route incoming payments, and generate UPI QR codes"
      backFallback="/app"
      onBack={handleBack}
      onRefresh={loadData}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
            Your UPI Handles ({upiHandles.length})
          </h2>
          <p style={{ fontSize: '13px', color: '#A9BDD7', margin: '2px 0 0' }}>
            Instant virtual payment addresses linked to your verified settlement accounts.
          </p>
        </div>

        <button
          onClick={openRegisterModal}
          className="auth-button"
          style={{ width: 'auto', padding: '0 18px', height: '40px', fontSize: '13px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <PlusIcon size={16} />
          <span>Register New UPI ID</span>
        </button>
      </div>

      {/* Global Alerts */}
      {bannerSuccess && (
        <div className="auth-alert success" style={{ marginBottom: '20px' }}>
          <CheckCircleIcon size={16} />
          <span>{bannerSuccess}</span>
        </div>
      )}
      {bannerError && (
        <div className="auth-alert error" style={{ marginBottom: '20px' }}>
          <AlertCircleIcon size={16} />
          <span>{bannerError}</span>
        </div>
      )}

      {/* UPI Handles Grid */}
      {loading ? (
        <div className="dashboard-card" style={{ textAlign: 'center', padding: '36px', color: '#A9BDD7' }}>
          Loading your UPI handles...
        </div>
      ) : upiHandles.length === 0 ? (
        <div className="dashboard-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#10B981' }}>
            <ShieldIcon size={30} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF', marginBottom: '6px' }}>
            No UPI Handles Registered
          </h3>
          <p style={{ color: '#A9BDD7', fontSize: '14px', maxWidth: '440px', margin: '0 auto 20px' }}>
            Create your custom @apnapay ID to receive real-time UPI payments directly into your bank account.
          </p>
          <button
            onClick={openRegisterModal}
            className="auth-button"
            style={{ width: 'auto', padding: '0 22px', height: '42px', fontSize: '14px', margin: '0 auto' }}
          >
            + Register Your First UPI ID
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {upiHandles.map((handle) => (
            <div
              key={handle.id}
              className="dashboard-card"
              style={{
                margin: 0,
                border: `1.5px solid ${handle.isPrimary ? '#10B981' : '#17385D'}`,
                background: handle.isPrimary
                  ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(10, 20, 34, 0.95) 100%)'
                  : 'var(--bg-card)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '180px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldIcon size={16} style={{ color: handle.isPrimary ? '#10B981' : '#00A8FF' }} />
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#A9BDD7', fontWeight: '600' }}>
                      Virtual Payment Address
                    </span>
                  </div>

                  {handle.isPrimary ? (
                    <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#10B981', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                      PRIMARY VPA
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#10B981' }}>● Active</span>
                  )}
                </div>

                {/* Big UPI ID */}
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#00A8FF', margin: '10px 0 6px', letterSpacing: '-0.3px', wordBreak: 'break-all' }}>
                  {handle.upiId}
                </div>

                {/* Linked Bank Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#A9BDD7' }}>
                  <BankIcon size={14} style={{ color: '#00A8FF' }} />
                  {handle.bankName ? (
                    <span>
                      Linked to: <strong style={{ color: '#FFFFFF' }}>{handle.bankName}</strong> (••••{handle.accountLast4})
                    </span>
                  ) : (
                    <span style={{ color: '#F59E0B' }}>Not linked to a specific bank</span>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #162438', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => copyToClipboard(handle.upiId, handle.id)}
                    className="auth-button secondary"
                    style={{ width: 'auto', padding: '0 10px', height: '30px', fontSize: '11px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    {copiedId === handle.id ? (
                      <>
                        <CheckIcon size={12} />
                        <span style={{ color: '#10B981' }}>Copied!</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon size={12} />
                        <span>Copy ID</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setQrModalHandle(handle)}
                    className="auth-button secondary"
                    style={{ width: 'auto', padding: '0 10px', height: '30px', fontSize: '11px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <QrCodeIcon size={13} />
                    <span>View QR</span>
                  </button>
                </div>

                <button
                  onClick={() => setConfirmDeleteModal(handle)}
                  className="auth-button secondary"
                  title="Delete UPI handle"
                  style={{
                    width: 'auto',
                    padding: '0 8px',
                    height: '30px',
                    fontSize: '11px',
                    margin: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#EF4444',
                    borderColor: 'rgba(239, 68, 68, 0.35)'
                  }}
                >
                  <TrashIcon size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: REGISTER NEW UPI HANDLE                         */}
      {/* ======================================================== */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '6px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: '#10B981' }}>
                  <ShieldIcon size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                    Register Instant UPI Handle
                  </h3>
                  <p style={{ fontSize: '12px', color: '#A9BDD7', margin: 0 }}>
                    Choose your unique username to receive funds via UPI
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#A9BDD7', cursor: 'pointer' }}
              >
                <XIcon size={20} />
              </button>
            </div>

            <div className="modal-body">
              {formError && (
                <div className="auth-alert error" style={{ marginBottom: '16px' }}>
                  <AlertCircleIcon size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleRegisterUpi} noValidate>
                {/* Desired Handle */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#A9BDD7', marginBottom: '6px' }}>
                    Desired Handle Prefix
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. gopal, myname, mobile"
                      value={handlePrefix}
                      onChange={(e) => setHandlePrefix(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                      style={{ flex: '1 1 0%', minWidth: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                      required
                      autoFocus
                    />
                    <select
                      value={selectedSuffix}
                      onChange={(e) => setSelectedSuffix(e.target.value)}
                      style={{
                        flexShrink: 0,
                        background: '#0B1B32',
                        border: '1px solid #17385D',
                        borderLeft: 'none',
                        color: '#00A8FF',
                        fontWeight: '700',
                        fontSize: '13px',
                        padding: '11px 12px',
                        borderRadius: '0 10px 10px 0',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      {supportedSuffixes.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
                    Preview: <strong style={{ color: '#00A8FF' }}>{handlePrefix || 'yourname'}{selectedSuffix}</strong>
                  </div>
                </div>

                {/* Bank Account Selection */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#A9BDD7', marginBottom: '6px' }}>
                    Link Settlement Bank Account
                  </label>
                  <select
                    className="form-input"
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                  >
                    <option value="">Default (Primary Active Bank Account)</option>
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} (••••{b.accountLast4}) {b.isPrimary ? '★ Primary' : ''}
                      </option>
                    ))}
                  </select>
                  {bankAccounts.length === 0 && (
                    <div style={{ fontSize: '12px', color: '#F59E0B', marginTop: '4px' }}>
                      Tip: You can link a bank account now or later.
                    </div>
                  )}
                </div>

                {/* Primary Checkbox */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#FFFFFF' }}>
                    <input
                      type="checkbox"
                      checked={isPrimary}
                      onChange={(e) => setIsPrimary(e.target.checked)}
                    />
                    <span>Set this VPA as primary default UPI address</span>
                  </label>
                </div>

                <div className="modal-footer" style={{ padding: 0 }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="auth-button secondary"
                    style={{ width: 'auto', padding: '0 16px', height: '42px', fontSize: '13px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !handlePrefix.trim()}
                    className="auth-button"
                    style={{ width: 'auto', padding: '0 24px', height: '42px', fontSize: '13px' }}
                  >
                    {isSubmitting ? 'Registering...' : 'Register UPI Handle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: QR CODE PREVIEW                                 */}
      {/* ======================================================== */}
      {qrModalHandle && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '380px', textAlign: 'center' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                Receive Money via UPI QR
              </h3>
              <button
                onClick={() => setQrModalHandle(null)}
                style={{ background: 'transparent', border: 'none', color: '#A9BDD7', cursor: 'pointer' }}
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '24px 20px' }}>
              {/* Mock QR container */}
              <div
                style={{
                  width: '200px',
                  height: '200px',
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '14px',
                  margin: '0 auto 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                }}
              >
                <QrCodeIcon size={140} style={{ color: '#050D1B' }} />
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#087BFF', marginTop: '4px' }}>
                  ApnaPay UPI
                </span>
              </div>

              <div style={{ fontSize: '15px', fontWeight: '700', color: '#00A8FF', wordBreak: 'break-all' }}>
                {qrModalHandle.upiId}
              </div>
              <p style={{ fontSize: '12px', color: '#A9BDD7', margin: '6px 0 16px' }}>
                Scan using any UPI App (PhonePe, Google Pay, Paytm) to send funds directly to your linked account.
              </p>

              <button
                onClick={() => copyToClipboard(qrModalHandle.upiId, 'modal')}
                className="auth-button"
                style={{ width: '100%', height: '38px', fontSize: '13px' }}
              >
                {copiedId === 'modal' ? 'Copied to Clipboard!' : 'Copy UPI ID'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: CONFIRM DELETE UPI HANDLE                       */}
      {/* ======================================================== */}
      {confirmDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px', textAlign: 'center' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#EF4444' }}>
              <TrashIcon size={24} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', marginBottom: '8px' }}>
              Delete UPI Handle?
            </h3>

            <p style={{ fontSize: '13px', color: '#A9BDD7', marginBottom: '16px', lineHeight: '1.5' }}>
              Are you sure you want to deactivate and delete <strong style={{ color: '#00A8FF' }}>{confirmDeleteModal.upiId}</strong>? Incoming payments to this VPA will no longer be routed.
            </p>

            {confirmDeleteModal.isPrimary && (
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#FCD34D', textAlign: 'left', marginBottom: '16px' }}>
                Note: This is your primary VPA. Deleting it will automatically designate another active handle as primary.
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setConfirmDeleteModal(null)}
                className="auth-button secondary"
                style={{ flex: 1, margin: 0, height: '40px', fontSize: '13px' }}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="auth-button"
                style={{ flex: 1, margin: 0, height: '40px', fontSize: '13px', background: '#EF4444', borderColor: '#EF4444' }}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CustomerUpiPage;

