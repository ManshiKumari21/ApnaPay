import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import AdminDashboardLayout from '../../components/layout/AdminDashboardLayout';
import {
  LayersIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  XIcon,
  SearchIcon,
  RefreshCwIcon,
  TrendingUpIcon,
  HistoryIcon,
  UserIcon,
  ShieldIcon,
  ArrowRightIcon,
  CopyIcon,
  CheckIcon,
  BuildingIcon,
  MapPinIcon,
  MailIcon,
  PhoneIcon,
  ReceiptIcon,
  CalendarIcon
} from '../../components/Icons';
import landService from '../../services/landService';

const AdminDigitalLandPage = () => {
  // Data states
  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    approvedOrders: 0,
    rejectedOrders: 0
  });
  const [pagination, setPagination] = useState({
    totalRecords: 0,
    page: 1,
    limit: 15,
    totalPages: 1
  });

  // Filters & Search
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Loading & Alert states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [copiedRef, setCopiedRef] = useState(false);

  // Modals
  const [detailsOrder, setDetailsOrder] = useState(null);
  const [approveConfirmOrder, setApproveConfirmOrder] = useState(null);
  const [rejectOrderModal, setRejectOrderModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');

  const showToast = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev.message === message ? { type: '', message: '' } : prev));
    }, 6000);
  };

  // Lock body scroll when any modal is open
  useEffect(() => {
    const hasActiveModal = Boolean(detailsOrder || approveConfirmOrder || rejectOrderModal);
    if (hasActiveModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [detailsOrder, approveConfirmOrder, rejectOrderModal]);

  // Handle Escape key to close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (rejectOrderModal && !actionLoading) {
          setRejectOrderModal(null);
        } else if (approveConfirmOrder && !actionLoading) {
          setApproveConfirmOrder(null);
        } else if (detailsOrder) {
          setDetailsOrder(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rejectOrderModal, approveConfirmOrder, detailsOrder, actionLoading]);

  // Load Admin Orders
  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await landService.getAdminOrders({
        page: pagination.page,
        limit: pagination.limit,
        status: activeTab,
        search: searchQuery
      });

      if (res.success && res.data) {
        setOrders(res.data.orders || []);
        if (res.data.dashboardCounts) {
          setCounts(res.data.dashboardCounts);
        }
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch admin land orders.';
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, activeTab, searchQuery]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchTerm.trim());
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchClear = () => {
    setSearchTerm('');
    setSearchQuery('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Open Details Modal with instant cache preview and full API enrichment
  const handleOpenDetails = async (orderId) => {
    const existing = orders.find((o) => o.id === orderId);
    if (existing) {
      setDetailsOrder(existing);
    }
    setDetailsLoading(true);
    try {
      const res = await landService.getAdminOrderById(orderId);
      if (res.success && res.data) {
        setDetailsOrder(res.data);
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Could not load order details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  // Copy reference ID to clipboard
  const handleCopyReference = (refText) => {
    if (!refText) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(refText);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  // Execute Approval
  const handleConfirmApprove = async () => {
    if (!approveConfirmOrder || actionLoading) return;
    setActionLoading(true);

    try {
      const res = await landService.approveOrder(approveConfirmOrder.id);
      showToast('success', res.message || `Order #${approveConfirmOrder.id} has been approved successfully!`);
      setApproveConfirmOrder(null);
      if (detailsOrder && detailsOrder.id === approveConfirmOrder.id) {
        setDetailsOrder(null);
      }
      loadOrders();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Approval failed. Please check inventory or retry.';
      showToast('error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Rejection
  const handleConfirmReject = async (e) => {
    if (e) e.preventDefault();
    if (!rejectOrderModal || actionLoading) return;

    const trimmedReason = rejectionReason.trim();
    if (!trimmedReason) {
      setRejectionError('Please provide a valid rejection reason for the customer.');
      return;
    }

    setActionLoading(true);
    setRejectionError('');

    try {
      const res = await landService.rejectOrder(rejectOrderModal.id, trimmedReason);
      showToast('success', res.message || `Order #${rejectOrderModal.id} has been rejected.`);
      setRejectOrderModal(null);
      setRejectionReason('');
      if (detailsOrder && detailsOrder.id === rejectOrderModal.id) {
        setDetailsOrder(null);
      }
      loadOrders();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Rejection failed. Please try again.';
      setRejectionError(msg);
      showToast('error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const formatINR = (val) => {
    const num = parseFloat(val) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return String(dateStr);
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'approved') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#10B981',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
          APPROVED
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#EF4444',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 6px #EF4444' }} />
          REJECTED
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(245, 158, 11, 0.15)',
        color: '#F59E0B',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 6px #F59E0B' }} />
        PENDING APPROVAL
      </span>
    );
  };

  return (
    <AdminDashboardLayout
      title="Digital Land Management"
      subtitle="Review customer land orders, manage inventory authorizations, and execute approvals"
      onRefresh={loadOrders}
    >
      {/* Toast Feedback Alert */}
      {feedback.message && (
        <div
          className={`auth-alert ${feedback.type === 'error' ? 'error' : 'success'}`}
          style={{
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.2s ease-in'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feedback.type === 'error' ? <AlertCircleIcon size={18} /> : <CheckCircleIcon size={18} />}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: '', message: '' })}
            style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: 0 }}
            aria-label="Dismiss feedback"
          >
            <XIcon size={16} />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. REAL-TIME DASHBOARD COUNTERS                           */}
      {/* ========================================================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Card 1: Total Orders */}
        <div className="dashboard-card" style={{ margin: 0, padding: '18px 20px', border: '1px solid #17385D' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#A9BDD7', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Land Orders
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#FFFFFF', marginTop: '6px' }}>
                {counts.totalOrders}
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(0, 168, 255, 0.12)', color: '#00A8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LayersIcon size={22} />
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '10px' }}>
            All customer digital land order requests
          </div>
        </div>

        {/* Card 2: Pending Approval */}
        <div className="dashboard-card" style={{ margin: 0, padding: '18px 20px', border: '1px solid rgba(245, 158, 11, 0.4)', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, #0A1422 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#F59E0B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Pending Approval
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#F59E0B', marginTop: '6px' }}>
                {counts.pendingOrders}
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HistoryIcon size={22} />
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#FBBF24', marginTop: '10px' }}>
            Awaiting administrator review & approval
          </div>
        </div>

        {/* Card 3: Approved */}
        <div className="dashboard-card" style={{ margin: 0, padding: '18px 20px', border: '1px solid rgba(16, 185, 129, 0.4)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, #0A1422 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#10B981', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Approved Orders
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#10B981', marginTop: '6px' }}>
                {counts.approvedOrders}
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircleIcon size={22} />
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#6EE7B7', marginTop: '10px' }}>
            Confirmed & credited to customer holdings
          </div>
        </div>

        {/* Card 4: Rejected */}
        <div className="dashboard-card" style={{ margin: 0, padding: '18px 20px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#EF4444', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Rejected Orders
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#EF4444', marginTop: '6px' }}>
                {counts.rejectedOrders}
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XIcon size={22} />
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#FCA5A5', marginTop: '10px' }}>
            Declined orders with logged audit reason
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. ORDER MANAGEMENT TABS & TOOLBAR                        */}
      {/* ========================================================= */}
      <div className="dashboard-card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', whiteSpace: 'nowrap' }}>
            {[
              { id: 'all', label: 'All Orders', count: counts.totalOrders },
              { id: 'pending', label: 'Pending Approval', count: counts.pendingOrders, highlight: true },
              { id: 'approved', label: 'Approved', count: counts.approvedOrders },
              { id: 'rejected', label: 'Rejected', count: counts.rejectedOrders }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive
                      ? 'linear-gradient(135deg, #087BFF, #00A8FF)'
                      : tab.highlight && tab.count > 0
                        ? 'rgba(245, 158, 11, 0.12)'
                        : '#071426',
                    color: isActive
                      ? '#FFFFFF'
                      : tab.highlight && tab.count > 0
                        ? '#F59E0B'
                        : '#A9BDD7',
                    fontSize: '13px',
                    fontWeight: isActive ? '700' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{
                    background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                    color: '#FFFFFF',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: '1 1 240px', maxWidth: '380px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#071426', border: '1px solid #17385D', borderRadius: '8px', padding: '0 12px', height: '38px', width: '100%' }}>
              <SearchIcon size={16} style={{ color: '#A9BDD7' }} />
              <input
                type="text"
                placeholder="Search by order ref, user or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#FFFFFF', width: '100%', fontSize: '12px', outline: 'none' }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleSearchClear}
                  style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0 }}
                  title="Clear search"
                >
                  <XIcon size={14} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="auth-button"
              style={{ width: 'auto', padding: '0 16px', height: '38px', fontSize: '12px', margin: 0 }}
            >
              Filter
            </button>
          </form>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. ORDERS TABLE                                           */}
      {/* ========================================================= */}
      <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#A9BDD7' }}>
            <RefreshCwIcon size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px', color: '#00A8FF' }} />
            <div>Loading digital land orders...</div>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <LayersIcon size={36} style={{ color: '#334155', marginBottom: '12px' }} />
            <h4 style={{ color: '#FFFFFF', fontSize: '16px', margin: '0 0 6px' }}>No Orders Found</h4>
            <p style={{ color: '#A9BDD7', fontSize: '13px', margin: 0 }}>
              {searchQuery
                ? `No orders matching "${searchQuery}" in ${activeTab.toUpperCase()} tab.`
                : activeTab === 'all'
                  ? 'No digital land purchase orders have been placed by customers yet.'
                  : `There are currently no orders with status '${activeTab.toUpperCase()}'.`}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#071426', borderBottom: '1px solid #17385D', color: '#A9BDD7', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '14px 16px' }}>Order ID</th>
                  <th style={{ padding: '14px 16px' }}>Customer Details</th>
                  <th style={{ padding: '14px 16px' }}>Project Name</th>
                  <th style={{ padding: '14px 16px' }}>Quantity</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Price/Unit</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Total Amount</th>
                  <th style={{ padding: '14px 16px' }}>Order Date</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const isPending = String(o.status).toLowerCase() === 'pending';
                  return (
                    <tr
                      key={o.id}
                      style={{
                        borderBottom: '1px solid rgba(23, 56, 93, 0.4)',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(22, 119, 255, 0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Order ID & Reference */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: '700', color: '#00A8FF', fontSize: '12px' }}>
                          {o.orderReference}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>
                          ID: #{o.id}
                        </div>
                      </td>

                      {/* Customer Details */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#FFFFFF' }}>
                          {o.userName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#A9BDD7', marginTop: '1px' }}>
                          {o.userEmail}
                        </div>
                      </td>

                      {/* Project Name & Location */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#FFFFFF' }}>
                          {o.projectName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>
                          {o.location}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: '500' }}>
                        {o.units} {o.unitName}
                      </td>

                      {/* Price Per Unit */}
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#A9BDD7' }}>
                        {formatINR(o.pricePerUnit)}
                      </td>

                      {/* Total Amount */}
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '800', color: '#10B981' }}>
                        {o.formattedTotalAmount || formatINR(o.totalAmount)}
                      </td>

                      {/* Order Date */}
                      <td style={{ padding: '14px 16px', color: '#A9BDD7', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {formatDateTime(o.createdAt)}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        {getStatusBadge(o.status)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* View Details Button */}
                          <button
                            onClick={() => handleOpenDetails(o.id)}
                            style={{
                              background: '#071426',
                              border: '1px solid #1E3A5F',
                              color: '#00A8FF',
                              padding: '5px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#00A8FF';
                              e.currentTarget.style.background = 'rgba(0, 168, 255, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#1E3A5F';
                              e.currentTarget.style.background = '#071426';
                            }}
                          >
                            View Details
                          </button>

                          {/* Approve (Only for Pending) */}
                          {isPending && (
                            <button
                              onClick={() => setApproveConfirmOrder(o)}
                              disabled={actionLoading}
                              style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid #10B981',
                                color: '#10B981',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              Approve
                            </button>
                          )}

                          {/* Reject (Only for Pending) */}
                          {isPending && (
                            <button
                              onClick={() => {
                                setRejectOrderModal(o);
                                setRejectionReason('');
                                setRejectionError('');
                              }}
                              disabled={actionLoading}
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid #EF4444',
                                color: '#EF4444',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Toolbar */}
        {!loading && orders.length > 0 && pagination.totalPages > 1 && (
          <div style={{
            padding: '12px 20px',
            background: '#071426',
            borderTop: '1px solid #17385D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '12px',
            color: '#A9BDD7'
          }}>
            <div>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.totalRecords)} of {pagination.totalRecords} orders
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                className="auth-button secondary"
                style={{
                  width: 'auto',
                  height: '32px',
                  padding: '0 12px',
                  fontSize: '12px',
                  margin: 0,
                  opacity: pagination.page <= 1 ? 0.4 : 1,
                  cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              <span style={{ padding: '0 8px', fontWeight: '700', color: '#00A8FF' }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                className="auth-button secondary"
                style={{
                  width: 'auto',
                  height: '32px',
                  padding: '0 12px',
                  fontSize: '12px',
                  margin: 0,
                  opacity: pagination.page >= pagination.totalPages ? 0.4 : 1,
                  cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 4. MODAL: VIEW DETAILS (REACT PORTAL - VIEWPORT FIXED)    */}
      {/* ========================================================= */}
      {detailsOrder && createPortal(
        <div
          className="admin-land-modal-overlay"
          onClick={() => setDetailsOrder(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-details-title"
        >
          <div
            className="admin-land-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="admin-land-modal-header">
              <div className="admin-land-modal-header-title">
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(0, 168, 255, 0.12)',
                  color: '#00A8FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <LayersIcon size={20} />
                </div>
                <div>
                  <h3 id="order-details-title" style={{ fontSize: '17px', fontWeight: '800', color: '#FFFFFF', margin: 0, lineHeight: 1.2 }}>
                    Digital Land Order Details
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                    <span style={{ fontSize: '11px', color: '#A9BDD7' }}>
                      Order Reference:
                    </span>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#00D5FF',
                      background: 'rgba(0, 213, 255, 0.1)',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      border: '1px solid rgba(0, 213, 255, 0.25)'
                    }}>
                      {detailsOrder.orderReference}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyReference(detailsOrder.orderReference)}
                      title="Copy Order Reference Code"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: copiedRef ? '#10B981' : '#A9BDD7',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px'
                      }}
                    >
                      {copiedRef ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
                      {copiedRef && <span>Copied!</span>}
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailsOrder(null)}
                className="admin-land-modal-close-btn"
                title="Close (Esc)"
                aria-label="Close modal"
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Modal Body: Organized into 5 distinct section cards */}
            <div className="admin-land-modal-body">
              {detailsLoading && (
                <div style={{
                  background: 'rgba(0, 168, 255, 0.08)',
                  border: '1px solid rgba(0, 168, 255, 0.25)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '11px',
                  color: '#00A8FF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <RefreshCwIcon size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Syncing latest order details from database...</span>
                </div>
              )}

              {/* SECTION 1: ORDER OVERVIEW */}
              <div className="admin-land-card-section">
                <div className="admin-land-card-title">
                  <ReceiptIcon size={14} />
                  <span>Order Overview</span>
                </div>
                <div className="admin-land-grid-2">
                  <div className="admin-land-grid-item">
                    <span className="admin-land-grid-label">Order Reference ID</span>
                    <span className="admin-land-grid-value" style={{ fontFamily: 'monospace', color: '#00A8FF' }}>
                      {detailsOrder.orderReference}
                    </span>
                  </div>
                  <div className="admin-land-grid-item">
                    <span className="admin-land-grid-label">Order Status</span>
                    <div>{getStatusBadge(detailsOrder.status)}</div>
                  </div>
                  <div className="admin-land-grid-item">
                    <span className="admin-land-grid-label">Database Record ID</span>
                    <span className="admin-land-grid-value">#{detailsOrder.id}</span>
                  </div>
                  <div className="admin-land-grid-item">
                    <span className="admin-land-grid-label">Submitted On</span>
                    <span className="admin-land-grid-value">{formatDateTime(detailsOrder.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: CUSTOMER DETAILS */}
              <div className="admin-land-card-section">
                <div className="admin-land-card-title">
                  <UserIcon size={14} />
                  <span>Customer Details</span>
                </div>
                <div className="admin-land-grid-2">
                  <div className="admin-land-grid-item">
                    <span className="admin-land-grid-label">Customer Name</span>
                    <span className="admin-land-grid-value">{detailsOrder.userName || 'Customer'}</span>
                  </div>
                  <div className="admin-land-grid-item">
                    <span className="admin-land-grid-label">Customer Email</span>
                    <span className="admin-land-grid-value" style={{ color: '#00D5FF' }}>
                      {detailsOrder.userEmail || 'Not available'}
                    </span>
                  </div>
                  <div className="admin-land-grid-item">
                    <span className="admin-land-grid-label">Customer User ID</span>
                    <span className="admin-land-grid-value">#{detailsOrder.userId}</span>
                  </div>
                  <div className="admin-land-grid-item">
                    <span className="admin-land-grid-label">Registered Phone</span>
                    <span className="admin-land-grid-value">
                      {detailsOrder.userPhone ? `+91 ${detailsOrder.userPhone}` : 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: PROJECT INFORMATION */}
              <div className="admin-land-card-section">
                <div className="admin-land-card-title">
                  <BuildingIcon size={14} />
                  <span>Project Information</span>
                </div>
                <div className="admin-land-grid-2">
                  <div className="admin-land-grid-item">
                    <span className="admin-land-grid-label">Project Name</span>
                    <span className="admin-land-grid-value" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                      {detailsOrder.projectName || 'N/A'}
                    </span>
                  </div>
                  <div className="admin-land-grid-item">
                    <span className="admin-land-grid-label">Project ID</span>
                    <span className="admin-land-grid-value">#{detailsOrder.projectId}</span>
                  </div>
                  <div className="admin-land-grid-item" style={{ gridColumn: 'span 2' }}>
                    <span className="admin-land-grid-label">Location / City</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <MapPinIcon size={14} style={{ color: '#00A8FF', flexShrink: 0 }} />
                      <span className="admin-land-grid-value">{detailsOrder.location || 'N/A'}</span>
                    </div>
                  </div>
                  {detailsOrder.projectAvailableUnits !== undefined && (
                    <div className="admin-land-grid-item">
                      <span className="admin-land-grid-label">Current Available Units</span>
                      <span className="admin-land-grid-value" style={{ color: '#6EE7B7' }}>
                        {detailsOrder.projectAvailableUnits} {detailsOrder.unitName || 'Units'}
                      </span>
                    </div>
                  )}
                  {detailsOrder.unitName && (
                    <div className="admin-land-grid-item">
                      <span className="admin-land-grid-label">Unit Type</span>
                      <span className="admin-land-grid-value">{detailsOrder.unitName}</span>
                    </div>
                  )}
                </div>
                {detailsOrder.projectDescription && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #17385D', fontSize: '12px', color: '#A9BDD7', lineHeight: 1.4 }}>
                    {detailsOrder.projectDescription}
                  </div>
                )}
              </div>

              {/* SECTION 4: ORDER & PAYMENT BREAKDOWN */}
              <div className="admin-land-card-section">
                <div className="admin-land-card-title">
                  <TrendingUpIcon size={14} />
                  <span>Order & Payment Breakdown</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#A9BDD7' }}>Requested Quantity:</span>
                    <span style={{ color: '#FFFFFF', fontWeight: '700' }}>
                      {detailsOrder.units} {detailsOrder.unitName}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#A9BDD7' }}>Unit Price at Order Time:</span>
                    <span style={{ color: '#FFFFFF', fontFamily: 'monospace' }}>
                      {detailsOrder.formattedPricePerUnit || formatINR(detailsOrder.pricePerUnit)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#A9BDD7' }}>Settlement Currency:</span>
                    <span style={{ color: '#FFFFFF', fontWeight: '600' }}>INR (₹ Indian Rupee)</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px dashed #17385D',
                    paddingTop: '10px',
                    marginTop: '2px'
                  }}>
                    <span style={{ color: '#E2E8F0', fontWeight: '700', fontSize: '14px' }}>Total Order Amount:</span>
                    <span style={{ color: '#10B981', fontWeight: '900', fontSize: '18px' }}>
                      {detailsOrder.formattedTotalAmount || formatINR(detailsOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 5: APPROVAL / REJECTION AUDIT TRAIL */}
              {String(detailsOrder.status).toLowerCase() === 'approved' && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  fontSize: '12.5px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontWeight: '700', marginBottom: '8px' }}>
                    <CheckCircleIcon size={18} />
                    <span>✓ Order Approved Confirmation</span>
                  </div>
                  <div style={{ color: '#E2E8F0', lineHeight: 1.5 }}>
                    <div>
                      <strong>Approved By:</strong> {detailsOrder.approvedByName ? `${detailsOrder.approvedByName} (Admin)` : detailsOrder.approvedBy ? `Administrator #${detailsOrder.approvedBy}` : 'System Administrator'}
                    </div>
                    {detailsOrder.approvedAt && (
                      <div style={{ marginTop: '2px' }}>
                        <strong>Approval Date & Time:</strong> {formatDateTime(detailsOrder.approvedAt)}
                      </div>
                    )}
                    <div style={{ marginTop: '6px', color: '#6EE7B7', fontSize: '11.5px' }}>
                      Units have been deducted from project inventory and credited to customer's active land holdings.
                    </div>
                  </div>
                </div>
              )}

              {String(detailsOrder.status).toLowerCase() === 'rejected' && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  fontSize: '12.5px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444', fontWeight: '700', marginBottom: '8px' }}>
                    <AlertCircleIcon size={18} />
                    <span>✕ Order Rejection Record</span>
                  </div>
                  <div style={{ color: '#E2E8F0', lineHeight: 1.5 }}>
                    <div>
                      <strong>Rejected By:</strong> {detailsOrder.rejectedByName ? `${detailsOrder.rejectedByName} (Admin)` : detailsOrder.rejectedBy ? `Administrator #${detailsOrder.rejectedBy}` : 'System Administrator'}
                    </div>
                    {detailsOrder.rejectedAt && (
                      <div style={{ marginTop: '2px' }}>
                        <strong>Rejection Date & Time:</strong> {formatDateTime(detailsOrder.rejectedAt)}
                      </div>
                    )}
                    <div style={{
                      marginTop: '8px',
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: '#FCA5A5'
                    }}>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#EF4444', fontWeight: '700' }}>Logged Reason:</div>
                      <div style={{ marginTop: '2px', color: '#FFFFFF' }}>{detailsOrder.rejectionReason || 'No specific reason provided'}</div>
                    </div>
                  </div>
                </div>
              )}

              {String(detailsOrder.status).toLowerCase() === 'pending' && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  fontSize: '12.5px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B', fontWeight: '700', marginBottom: '6px' }}>
                    <HistoryIcon size={18} />
                    <span>⚠️ Awaiting Administrative Approval</span>
                  </div>
                  <div style={{ color: '#FDE68A', fontSize: '12px', lineHeight: 1.4 }}>
                    This customer order is currently in <strong>PENDING</strong> status. Land units have not been allocated to holdings yet. You can approve or reject this request below.
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="admin-land-modal-footer">
              <button
                type="button"
                onClick={() => setDetailsOrder(null)}
                className="auth-button secondary"
                style={{ width: 'auto', padding: '0 18px', height: '38px', fontSize: '13px', margin: 0 }}
              >
                Close
              </button>

              {String(detailsOrder.status).toLowerCase() === 'pending' ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectOrderModal(detailsOrder);
                      setRejectionReason('');
                      setRejectionError('');
                    }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid #EF4444',
                      color: '#EF4444',
                      padding: '0 16px',
                      height: '38px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    Reject Order
                  </button>
                  <button
                    type="button"
                    onClick={() => setApproveConfirmOrder(detailsOrder)}
                    style={{
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      border: 'none',
                      color: '#FFFFFF',
                      padding: '0 20px',
                      height: '38px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                      transition: 'all 0.15s'
                    }}
                  >
                    Approve Order
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>
                  {String(detailsOrder.status).toLowerCase() === 'approved' ? '✓ Processed & Completed' : '✕ Processed & Declined'}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* 5. MODAL: APPROVE CONFIRMATION (REACT PORTAL)             */}
      {/* ========================================================= */}
      {approveConfirmOrder && createPortal(
        <div
          className="admin-land-modal-overlay"
          onClick={() => {
            if (!actionLoading) setApproveConfirmOrder(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-land-modal-container"
            style={{ maxWidth: '490px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-land-modal-header">
              <div className="admin-land-modal-header-title">
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <CheckCircleIcon size={18} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  Confirm Order Approval
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setApproveConfirmOrder(null)}
                disabled={actionLoading}
                className="admin-land-modal-close-btn"
                title="Cancel (Esc)"
              >
                <XIcon size={16} />
              </button>
            </div>

            <div className="admin-land-modal-body">
              <p style={{ color: '#E2E8F0', fontSize: '13.5px', lineHeight: '1.5', margin: 0 }}>
                Are you sure you want to approve this digital land order? This action will confirm the purchase and update customer holdings.
              </p>

              <div className="admin-land-card-section" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12.5px' }}>
                  <span style={{ color: '#A9BDD7' }}>Order Reference:</span>
                  <span style={{ fontFamily: 'monospace', color: '#00A8FF', fontWeight: '700' }}>
                    {approveConfirmOrder.orderReference}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12.5px' }}>
                  <span style={{ color: '#A9BDD7' }}>Customer:</span>
                  <span style={{ color: '#FFFFFF', fontWeight: '600' }}>{approveConfirmOrder.userName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12.5px' }}>
                  <span style={{ color: '#A9BDD7' }}>Project:</span>
                  <span style={{ color: '#FFFFFF' }}>{approveConfirmOrder.projectName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12.5px' }}>
                  <span style={{ color: '#A9BDD7' }}>Allocating:</span>
                  <span style={{ color: '#FFFFFF', fontWeight: '700' }}>
                    {approveConfirmOrder.units} {approveConfirmOrder.unitName}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #17385D', paddingTop: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#A9BDD7', fontWeight: '600' }}>Total Value:</span>
                  <span style={{ color: '#10B981', fontWeight: '800' }}>
                    {approveConfirmOrder.formattedTotalAmount || formatINR(approveConfirmOrder.totalAmount)}
                  </span>
                </div>
              </div>

              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '11.5px',
                color: '#6EE7B7',
                lineHeight: '1.4'
              }}>
                <strong>Automated System Actions:</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  <li>Project inventory deducted by {approveConfirmOrder.units} {approveConfirmOrder.unitName}.</li>
                  <li>Customer's Digital Land Holdings credited with confirmed ownership.</li>
                  <li>Customer receives an automated in-app approval notification.</li>
                </ul>
              </div>
            </div>

            <div className="admin-land-modal-footer">
              <button
                type="button"
                onClick={() => setApproveConfirmOrder(null)}
                disabled={actionLoading}
                className="auth-button secondary"
                style={{ width: 'auto', padding: '0 16px', height: '38px', fontSize: '13px', margin: 0 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={actionLoading}
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '0 20px',
                  height: '38px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  opacity: actionLoading ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                {actionLoading ? 'Approving Order...' : 'Confirm & Approve'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* 6. MODAL: REJECT CONFIRMATION WITH REASON (REACT PORTAL)  */}
      {/* ========================================================= */}
      {rejectOrderModal && createPortal(
        <div
          className="admin-land-modal-overlay"
          onClick={() => {
            if (!actionLoading) setRejectOrderModal(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-land-modal-container"
            style={{ maxWidth: '490px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleConfirmReject}>
              <div className="admin-land-modal-header">
                <div className="admin-land-modal-header-title">
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <XIcon size={18} />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                    Reject Land Order
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setRejectOrderModal(null)}
                  disabled={actionLoading}
                  className="admin-land-modal-close-btn"
                  title="Cancel (Esc)"
                >
                  <XIcon size={16} />
                </button>
              </div>

              <div className="admin-land-modal-body">
                {rejectionError && (
                  <div className="auth-alert error" style={{ marginBottom: '10px' }}>
                    <AlertCircleIcon size={16} />
                    <span>{rejectionError}</span>
                  </div>
                )}

                <p style={{ color: '#E2E8F0', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                  Please state the reason for rejecting order <strong style={{ color: '#00A8FF' }}>{rejectOrderModal.orderReference}</strong> for customer <strong style={{ color: '#FFFFFF' }}>{rejectOrderModal.userName}</strong>. This explanation will be logged and sent in the notification.
                </p>

                <div className="form-group" style={{ margin: '12px 0 0 0' }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span>Rejection Reason *</span>
                    <span style={{ fontSize: '11px', color: '#EF4444' }}>Required</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rejectionReason}
                    onChange={(e) => {
                      setRejectionReason(e.target.value);
                      setRejectionError('');
                    }}
                    placeholder="e.g. Incomplete KYC verification, inventory adjustment, or customer order modification request."
                    className="form-input"
                    style={{
                      height: 'auto',
                      padding: '10px 12px',
                      resize: 'vertical',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      background: '#071426',
                      borderColor: rejectionError ? '#EF4444' : '#17385D'
                    }}
                    autoFocus
                  />
                </div>

                <div style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '11.5px',
                  color: '#FCA5A5',
                  lineHeight: '1.4'
                }}>
                  ⚠️ Rejected orders cannot be converted into holdings and will be permanently marked as declined.
                </div>
              </div>

              <div className="admin-land-modal-footer">
                <button
                  type="button"
                  onClick={() => setRejectOrderModal(null)}
                  disabled={actionLoading}
                  className="auth-button secondary"
                  style={{ width: 'auto', padding: '0 16px', height: '38px', fontSize: '13px', margin: 0 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !rejectionReason.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '0 20px',
                    height: '38px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: actionLoading || !rejectionReason.trim() ? 'not-allowed' : 'pointer',
                    opacity: actionLoading || !rejectionReason.trim() ? 0.6 : 1,
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  {actionLoading ? 'Rejecting Order...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </AdminDashboardLayout>
  );
};

export default AdminDigitalLandPage;
