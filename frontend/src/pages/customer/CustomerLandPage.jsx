import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  LayersIcon,
  MapPinIcon,
  TrendingUpIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  SearchIcon,
  PlusIcon,
  XIcon,
  HistoryIcon,
  InfoIcon,
  RefreshCwIcon
} from '../../components/Icons';
import landService from '../../services/landService';

const CustomerLandPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    return location.state?.activeTab || (new URLSearchParams(location.search).get('tab')) || 'projects';
  });

  // Data states
  const [projects, setProjects] = useState([]);
  const [projectsPagination, setProjectsPagination] = useState({});
  const [holdingsData, setHoldingsData] = useState({ holdings: [], portfolioSummary: {} });
  const [transactions, setTransactions] = useState([]);
  const [valuations, setValuations] = useState([]);

  // Loading & Error states
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchProject, setSearchProject] = useState('');

  // Purchase Modal State
  const [selectedProject, setSelectedProject] = useState(null);
  const [orderUnits, setOrderUnits] = useState(1);
  const [orderNotes, setOrderNotes] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState(null);
  const [orderError, setOrderError] = useState('');

  // Order Details Modal
  const [viewingOrder, setViewingOrder] = useState(null);

  // Load Projects
  const loadProjects = async (search = searchProject) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await landService.getProjects({ page: 1, limit: 12, status: 'all', search });
      setProjects(res.data?.projects || []);
      setProjectsPagination(res.data?.pagination || {});
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load land projects.');
    } finally {
      setLoading(false);
    }
  };

  // Load User Holdings
  const loadHoldings = async () => {
    setLoading(true);
    try {
      const res = await landService.getHoldings({ page: 1, limit: 20 });
      setHoldingsData(res.data || { holdings: [], portfolioSummary: {} });
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load holdings.');
    } finally {
      setLoading(false);
    }
  };

  // Load Land Orders & Transactions
  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await landService.getUserOrders({ page: 1, limit: 50 });
      setTransactions(res.data?.orders || []);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load land orders.');
    } finally {
      setLoading(false);
    }
  };

  // Load Valuations
  const loadValuations = async () => {
    setLoading(true);
    try {
      const res = await landService.getValuations({ page: 1, limit: 20 });
      setValuations(res.data?.valuations || []);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load valuation history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'projects') loadProjects();
    else if (activeTab === 'holdings') loadHoldings();
    else if (activeTab === 'transactions') loadTransactions();
    else if (activeTab === 'valuations') loadValuations();
  }, [activeTab]);

  // Handle navigation from notifications or external links
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
    if (location.state?.orderRef || location.state?.orderId) {
      handleFetchOrderDetails(location.state.orderRef || location.state.orderId);
    }
  }, [location.state]);

  // Auto-refresh orders and holdings on focus and periodic background sync
  useEffect(() => {
    let timer;
    if (activeTab === 'transactions') {
      timer = setInterval(() => {
        loadTransactions();
      }, 15000);
    }
    const handleFocus = () => {
      if (activeTab === 'transactions') loadTransactions();
      else if (activeTab === 'holdings') loadHoldings();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      if (timer) clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadProjects(searchProject);
  };

  // Open Order Modal
  const handleOpenOrderModal = (project) => {
    setSelectedProject(project);
    setOrderUnits(1);
    setOrderNotes('');
    setOrderError('');
    setOrderSuccessData(null);
  };

  // Submit Land Purchase Order
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    const units = parseFloat(orderUnits);
    if (!units || units <= 0) {
      setOrderError('Please enter a valid unit quantity greater than zero.');
      return;
    }

    if (units > selectedProject.availableUnits) {
      setOrderError(`Only ${selectedProject.availableUnits} ${selectedProject.unitName} available.`);
      return;
    }

    setOrderSubmitting(true);
    setOrderError('');
    try {
      const res = await landService.createOrder({
        projectId: selectedProject.id,
        units,
        notes: orderNotes
      });
      setOrderSuccessData(res.data);
      // Refresh holdings/projects in background
      loadProjects();
    } catch (err) {
      setOrderError(err.response?.data?.message || 'Failed to create order. Please try again.');
    } finally {
      setOrderSubmitting(false);
    }
  };

  // View specific order status (API 5)
  const handleFetchOrderDetails = async (orderIdOrRef) => {
    try {
      const res = await landService.getOrderById(orderIdOrRef);
      setViewingOrder(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not fetch order details.');
    }
  };

  const formatINR = (val) => {
    const num = parseFloat(val) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleBack = () => {
    if (viewingOrder) {
      setViewingOrder(null);
      return;
    }
    if (selectedProject) {
      setSelectedProject(null);
      return;
    }
    if (activeTab !== 'projects') {
      setActiveTab('projects');
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
      title="Digital Land"
      subtitle="Fractional digital land investment, verified land parcels, and real estate valuation tracking"
      backFallback="/app"
      onBack={handleBack}
      onRefresh={() => {
        if (activeTab === 'projects') loadProjects();
        else if (activeTab === 'holdings') loadHoldings();
        else if (activeTab === 'transactions') loadTransactions();
        else if (activeTab === 'valuations') loadValuations();
      }}
    >
      {errorMsg && (
        <div className="auth-alert error" style={{ marginBottom: '20px' }}>
          <AlertCircleIcon size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #17385D', paddingBottom: '12px', marginBottom: '24px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', whiteSpace: 'nowrap' }}>
        {[
          { id: 'projects', label: 'Land Projects', icon: LayersIcon },
          { id: 'holdings', label: 'My Holdings', icon: TrendingUpIcon },
          { id: 'transactions', label: 'Land Orders & Log', icon: HistoryIcon },
          { id: 'valuations', label: 'Valuation History', icon: InfoIcon }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'linear-gradient(135deg, #087BFF, #00A8FF)' : '#071426',
                color: isActive ? '#ffffff' : '#A9BDD7',
                fontSize: '13px',
                fontWeight: isActive ? '700' : '500',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PROJECTS MARKETPLACE                             */}
      {/* ======================================================== */}
      {activeTab === 'projects' && (
        <div>
          {/* Search Toolbar */}
          <div className="dashboard-card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 220px', minWidth: '180px', background: '#071426', border: '1px solid #17385D', borderRadius: '8px', padding: '0 12px', height: '40px' }}>
                <SearchIcon size={16} style={{ color: '#A9BDD7' }} />
                <input
                  type="text"
                  placeholder="Search land projects by name, location, or tech corridor..."
                  value={searchProject}
                  onChange={(e) => setSearchProject(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: '#FFFFFF', width: '100%', fontSize: '13px', outline: 'none' }}
                />
              </div>
              <button
                type="submit"
                className="auth-button"
                style={{ width: 'auto', padding: '0 18px', height: '40px', fontSize: '13px', margin: 0 }}
              >
                Search
              </button>
            </form>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#A9BDD7' }}>
              Loading digital land projects...
            </div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: '#071426', borderRadius: '12px', border: '1px dashed #17385D' }}>
              <p style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: '600' }}>No Projects Found</p>
              <p style={{ color: '#A9BDD7', fontSize: '13px', marginTop: '4px' }}>Try searching with a different location keyword.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              {projects.map((p) => {
                const availabilityPercent = p.totalUnits > 0 ? Math.round((p.availableUnits / p.totalUnits) * 100) : 0;
                return (
                  <div
                    key={p.id}
                    className="dashboard-card"
                    style={{
                      margin: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid #17385D',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                  >
                    <div>
                      {/* Status & ID */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '11px', color: '#00A8FF', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          PROJECT #{p.id}
                        </span>
                        <span style={{ background: p.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: p.status === 'active' ? '#10B981' : '#F59E0B', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
                          ● {p.status}
                        </span>
                      </div>

                      {/* Project Title */}
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', margin: '0 0 6px 0' }}>
                        {p.projectName}
                      </h3>

                      {/* Location */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#A9BDD7', fontSize: '13px', marginBottom: '12px' }}>
                        <MapPinIcon size={14} style={{ color: '#00A8FF' }} />
                        <span>{p.location}</span>
                      </div>

                      {/* Description */}
                      <p style={{ color: '#A9BDD7', fontSize: '12px', lineHeight: '1.5', marginBottom: '16px' }}>
                        {p.description}
                      </p>

                      {/* Unit Pricing */}
                      <div style={{ background: '#071426', border: '1px solid #071426', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '11px', color: '#A9BDD7' }}>Price per Unit</div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#10B981', marginTop: '2px' }}>
                          {p.formattedPricePerUnit || formatINR(p.pricePerUnit)}
                        </div>
                      </div>

                      {/* Availability Bar */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#A9BDD7', marginBottom: '4px' }}>
                          <span>Available: {p.availableUnits} {p.unitName}</span>
                          <span>Total: {p.totalUnits} {p.unitName}</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: '#071426', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${availabilityPercent}%`, height: '100%', background: 'linear-gradient(90deg, #087BFF, #00A8FF)', borderRadius: '3px' }} />
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleOpenOrderModal(p)}
                      disabled={p.status !== 'active' || p.availableUnits <= 0}
                      className="auth-button"
                      style={{
                        margin: 0,
                        height: '40px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        opacity: p.status !== 'active' || p.availableUnits <= 0 ? 0.5 : 1,
                        cursor: p.status !== 'active' || p.availableUnits <= 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <PlusIcon size={16} />
                      <span>{p.availableUnits > 0 ? 'Order Land Parcel' : 'Sold Out'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MY HOLDINGS PORTFOLIO                            */}
      {/* ======================================================== */}
      {activeTab === 'holdings' && (
        <div>
          {/* Portfolio Summary Card */}
          <div
            className="dashboard-card"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(10, 20, 34, 0.95) 100%)',
              borderColor: '#17385D',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#10B981', fontWeight: '700', letterSpacing: '0.8px' }}>
                  DIGITAL REAL ESTATE PORTFOLIO
                </span>
                <div style={{ fontSize: '13px', color: '#A9BDD7', marginTop: '4px' }}>Total Portfolio Current Valuation</div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#FFFFFF', marginTop: '2px' }}>
                  {holdingsData.portfolioSummary?.formattedCurrentValue || formatINR(holdingsData.portfolioSummary?.currentValue || 0)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '10px 16px' }}>
                  <div style={{ fontSize: '11px', color: '#A9BDD7' }}>Total Invested</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', marginTop: '2px' }}>
                    {holdingsData.portfolioSummary?.formattedTotalInvested || formatINR(holdingsData.portfolioSummary?.totalInvested || 0)}
                  </div>
                </div>

                <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '10px 16px' }}>
                  <div style={{ fontSize: '11px', color: '#A9BDD7' }}>Unrealized Gain / Loss</div>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: (holdingsData.portfolioSummary?.unrealizedGainLoss || 0) >= 0 ? '#10B981' : '#EF4444',
                      marginTop: '2px'
                    }}
                  >
                    {holdingsData.portfolioSummary?.formattedGainLoss || formatINR(holdingsData.portfolioSummary?.unrealizedGainLoss || 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Holdings List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#A9BDD7' }}>
              Loading your land holdings...
            </div>
          ) : !holdingsData.holdings || holdingsData.holdings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', background: '#071426', borderRadius: '12px', border: '1px dashed #17385D' }}>
              <p style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: '700', margin: 0 }}>No Land Holdings Yet</p>
              <p style={{ color: '#A9BDD7', fontSize: '13px', margin: '6px 0 16px' }}>
                You have not acquired any digital land units. Explore our active projects and start your fractional portfolio!
              </p>
              <button
                onClick={() => setActiveTab('projects')}
                className="auth-button"
                style={{ width: 'auto', padding: '0 20px', height: '38px', fontSize: '13px', margin: '0 auto' }}
              >
                Explore Land Projects
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {holdingsData.holdings.map((h) => (
                <div
                  key={h.id}
                  className="dashboard-card"
                  style={{
                    margin: 0,
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '10px', background: 'rgba(22, 119, 255, 0.15)', color: '#00A8FF', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                      HOLDING #{h.id}
                    </span>
                    <h4 style={{ fontSize: '17px', fontWeight: '700', color: '#FFFFFF', margin: '6px 0 2px 0' }}>
                      {h.projectName}
                    </h4>
                    <div style={{ fontSize: '12px', color: '#A9BDD7' }}>
                      {h.location} • Acquired: {h.purchaseDate ? new Date(h.purchaseDate).toLocaleDateString('en-IN') : 'N/A'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#A9BDD7' }}>Units Owned</div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF' }}>
                        {h.unitsOwned} {h.unitName}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: '#A9BDD7' }}>Total Invested</div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#A9BDD7' }}>
                        {h.formattedTotalInvested || formatINR(h.totalInvested)}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: '#A9BDD7' }}>Current Value</div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#10B981' }}>
                        {h.formattedCurrentValue || formatINR(h.currentValue)}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '11px', color: '#A9BDD7' }}>Unrealized Gain</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: (h.unrealizedGainLoss || 0) >= 0 ? '#10B981' : '#EF4444' }}>
                        {h.formattedGainLoss || formatINR(h.unrealizedGainLoss)} ({h.gainLossPercentage}%)
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: LAND TRANSACTIONS & ORDER LOG                    */}
      {/* ======================================================== */}
      {activeTab === 'transactions' && (
        <div className="dashboard-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HistoryIcon size={18} style={{ color: '#00A8FF' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                Land Orders & Approval Activity Log
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: '#A9BDD7' }}>
              Total: {transactions.length} orders
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#A9BDD7' }}>
              Loading land orders...
            </div>
          ) : transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', background: '#071426', borderRadius: '10px', border: '1px dashed #17385D' }}>
              <p style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '600', margin: 0 }}>No Land Orders Recorded</p>
              <p style={{ color: '#A9BDD7', fontSize: '12px', margin: '4px 0 0' }}>
                Your land parcel purchase requests will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #17385D', color: '#A9BDD7', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '12px 14px' }}>Approval Status</th>
                    <th style={{ padding: '12px 14px' }}>Order Reference</th>
                    <th style={{ padding: '12px 14px' }}>Project</th>
                    <th style={{ padding: '12px 14px' }}>Units</th>
                    <th style={{ padding: '12px 14px' }}>Date</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Total Amount</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => {
                    const st = String(t.status || 'pending').toLowerCase();
                    const isApproved = st === 'approved' || st === 'completed';
                    const isRejected = st === 'rejected' || st === 'failed';

                    const badgeBg = isApproved
                      ? 'rgba(16, 185, 129, 0.15)'
                      : isRejected
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(245, 158, 11, 0.15)';

                    const badgeColor = isApproved ? '#10B981' : isRejected ? '#EF4444' : '#F59E0B';

                    const badgeLabel = isApproved
                      ? '● APPROVED – Order Approved'
                      : isRejected
                        ? '● REJECTED – Order Rejected'
                        : '● PENDING – Awaiting Admin Approval';

                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid rgba(35, 55, 80, 0.4)' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              background: badgeBg,
                              color: badgeColor,
                              padding: '3px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: '700',
                              display: 'inline-block'
                            }}
                          >
                            {badgeLabel}
                          </span>
                          {isRejected && t.rejectionReason && (
                            <div style={{ fontSize: '11px', color: '#EF4444', marginTop: '4px', maxWidth: '220px' }}>
                              Reason: {t.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#00A8FF', fontWeight: '600' }}>
                          {t.orderReference}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#FFFFFF' }}>
                          {t.projectName}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#A9BDD7' }}>
                          {t.units} {t.unitName}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#A9BDD7', whiteSpace: 'nowrap' }}>
                          {t.createdAt ? new Date(t.createdAt).toLocaleString('en-IN') : 'N/A'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700', color: '#FFFFFF' }}>
                          {t.formattedTotalAmount || t.formattedAmount || formatINR(t.totalAmount || t.amount)}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleFetchOrderDetails(t.orderReference || t.id)}
                            style={{
                              background: '#071426',
                              border: '1px solid #17385D',
                              color: '#00A8FF',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: VALUATIONS HISTORY                                */}
      {/* ======================================================== */}
      {activeTab === 'valuations' && (
        <div className="dashboard-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUpIcon size={18} style={{ color: '#10B981' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                Official Property Valuations & Growth Audits
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircleIcon size={14} />
              Third-Party Certified
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#A9BDD7' }}>
              Loading valuation historical data...
            </div>
          ) : valuations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', background: '#071426', borderRadius: '10px', border: '1px dashed #17385D' }}>
              <p style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '600', margin: 0 }}>No Valuations Available</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #17385D', color: '#A9BDD7', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '12px 14px' }}>Project</th>
                    <th style={{ padding: '12px 14px' }}>Location</th>
                    <th style={{ padding: '12px 14px' }}>Valuation Authority</th>
                    <th style={{ padding: '12px 14px' }}>Appraisal Date</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Previous Valuation</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Current Valuation</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Appreciation</th>
                  </tr>
                </thead>
                <tbody>
                  {valuations.map((v) => (
                    <tr key={v.id} style={{ borderBottom: '1px solid rgba(35, 55, 80, 0.4)' }}>
                      <td style={{ padding: '12px 14px', color: '#FFFFFF', fontWeight: '600' }}>
                        {v.projectName}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#A9BDD7' }}>
                        {v.location}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#00A8FF' }}>
                        {v.valuationSource}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#A9BDD7', whiteSpace: 'nowrap' }}>
                        {v.valuedAt ? new Date(v.valuedAt).toLocaleDateString('en-IN') : 'N/A'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#A9BDD7' }}>
                        {v.formattedPreviousValuation || formatINR(v.previousValuation)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700', color: '#FFFFFF' }}>
                        {v.formattedCurrentValuation || formatINR(v.currentValuation)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700', color: '#10B981' }}>
                        +{v.growthPercentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* ORDER CREATION PURCHASE MODAL                           */}
      {/* ======================================================== */}
      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LayersIcon size={18} style={{ color: '#00A8FF' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                  Order Digital Land Parcel
                </h3>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                style={{ background: 'transparent', border: 'none', color: '#A9BDD7', cursor: 'pointer' }}
              >
                <XIcon size={18} />
              </button>
            </div>

            {orderSuccessData ? (
              <div className="modal-body">
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <CheckCircleIcon size={28} />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF', margin: '0 0 6px 0' }}>
                    Order Submitted for Approval!
                  </h3>
                  <p style={{ color: '#00A8FF', fontSize: '13px', margin: 0, fontWeight: '600' }}>
                    {orderSuccessData.message || 'Your land order has been submitted and is awaiting admin approval.'}
                  </p>
                  <p style={{ color: '#A9BDD7', fontSize: '12px', marginTop: '6px' }}>
                    Reference: <strong style={{ color: '#00A8FF', fontFamily: 'monospace' }}>{orderSuccessData.orderReference}</strong>
                  </p>
                </div>

                <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '14px', marginTop: '16px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#A9BDD7' }}>Project:</span>
                    <span style={{ color: '#FFFFFF', fontWeight: '600' }}>{orderSuccessData.projectName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#A9BDD7' }}>Quantity:</span>
                    <span style={{ color: '#FFFFFF' }}>{orderSuccessData.units} {orderSuccessData.unitName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#A9BDD7' }}>Total Amount:</span>
                    <span style={{ color: '#10B981', fontWeight: '700' }}>{orderSuccessData.formattedTotalAmount || formatINR(orderSuccessData.totalAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#A9BDD7' }}>Status:</span>
                    <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', padding: '3px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>
                      ● AWAITING ADMIN APPROVAL
                    </span>
                  </div>
                </div>

                {/* Clear Approval Workflow Note */}
                <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', padding: '10px 12px', marginTop: '16px', fontSize: '12px', color: '#fbbf24', lineHeight: '1.4' }}>
                  <strong>Admin Approval Required:</strong> Your land order has been submitted and is awaiting admin approval. It will appear in your <em>Land Orders & Log</em> tab, and will only be credited to your holdings once approved.
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setSelectedProject(null);
                      setActiveTab('transactions');
                    }}
                    className="auth-button"
                    style={{ flex: '1 1 140px', margin: 0, height: '38px', fontSize: '13px' }}
                  >
                    View Orders & Log
                  </button>
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="auth-button secondary"
                    style={{ flex: '1 1 80px', margin: 0, height: '38px', fontSize: '13px' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateOrder}>
                <div className="modal-body">
                  {orderError && (
                    <div className="auth-alert error" style={{ marginBottom: '16px' }}>
                      <AlertCircleIcon size={16} />
                      <span>{orderError}</span>
                    </div>
                  )}

                  {/* Project Info Pill */}
                  <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF' }}>
                      {selectedProject.projectName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#A9BDD7', marginTop: '2px' }}>
                      {selectedProject.location} • Available: {selectedProject.availableUnits} {selectedProject.unitName}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#10B981', marginTop: '6px' }}>
                      {selectedProject.formattedPricePerUnit || `${formatINR(selectedProject.pricePerUnit)} / ${selectedProject.unitName}`}
                    </div>
                  </div>

                  {/* Units Input */}
                  <div className="form-group">
                    <label className="form-label">
                      Number of Units to Purchase ({selectedProject.unitName})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={selectedProject.availableUnits}
                      required
                      value={orderUnits}
                      onChange={(e) => setOrderUnits(e.target.value)}
                      className="form-input"
                      placeholder="e.g. 1.5"
                    />
                  </div>

                  {/* Estimated Amount Calculation */}
                  <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '8px', padding: '12px 14px', margin: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#A9BDD7', fontSize: '13px' }}>Estimated Total:</span>
                    <span style={{ color: '#10B981', fontSize: '18px', fontWeight: '800' }}>
                      {formatINR((parseFloat(orderUnits) || 0) * (selectedProject.pricePerUnit || 0))}
                    </span>
                  </div>

                  {/* Optional Notes */}
                  <div className="form-group">
                    <label className="form-label">Order Notes (Optional)</label>
                    <input
                      type="text"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="form-input"
                      placeholder="e.g. Investment parcel allocation"
                      maxLength={150}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => setSelectedProject(null)}
                    className="auth-button secondary"
                    style={{ width: 'auto', padding: '0 16px', height: '38px', fontSize: '13px', margin: 0 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={orderSubmitting}
                    className="auth-button"
                    style={{ width: 'auto', padding: '0 20px', height: '38px', fontSize: '13px', margin: 0 }}
                  >
                    {orderSubmitting ? 'Creating Order...' : 'Confirm Order'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ORDER DETAILS INSPECT MODAL (API 5)                     */}
      {/* ======================================================== */}
      {viewingOrder && (
        <div className="modal-overlay" onClick={() => setViewingOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HistoryIcon size={18} style={{ color: '#00A8FF' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                  Order Details & Approval Status
                </h3>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                style={{ background: 'transparent', border: 'none', color: '#A9BDD7', cursor: 'pointer' }}
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #071426', paddingBottom: '6px' }}>
                  <span style={{ color: '#A9BDD7' }}>Order ID:</span>
                  <span style={{ color: '#FFFFFF', fontFamily: 'monospace' }}>#{viewingOrder.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #071426', paddingBottom: '6px' }}>
                  <span style={{ color: '#A9BDD7' }}>Reference:</span>
                  <span style={{ color: '#00A8FF', fontFamily: 'monospace', fontWeight: '600' }}>{viewingOrder.orderReference}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #071426', paddingBottom: '6px' }}>
                  <span style={{ color: '#A9BDD7' }}>Project:</span>
                  <span style={{ color: '#FFFFFF', fontWeight: '600' }}>{viewingOrder.projectName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #071426', paddingBottom: '6px' }}>
                  <span style={{ color: '#A9BDD7' }}>Location:</span>
                  <span style={{ color: '#A9BDD7' }}>{viewingOrder.location}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #071426', paddingBottom: '6px' }}>
                  <span style={{ color: '#A9BDD7' }}>Units Ordered:</span>
                  <span style={{ color: '#FFFFFF' }}>{viewingOrder.units} {viewingOrder.unitName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #071426', paddingBottom: '6px' }}>
                  <span style={{ color: '#A9BDD7' }}>Price per Unit:</span>
                  <span style={{ color: '#FFFFFF' }}>{viewingOrder.formattedPricePerUnit || formatINR(viewingOrder.pricePerUnit)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #071426', paddingBottom: '6px' }}>
                  <span style={{ color: '#A9BDD7' }}>Total Amount:</span>
                  <span style={{ color: '#10B981', fontWeight: '700', fontSize: '15px' }}>{viewingOrder.formattedTotalAmount || formatINR(viewingOrder.totalAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #071426', paddingBottom: '6px', alignItems: 'center' }}>
                  <span style={{ color: '#A9BDD7' }}>Status:</span>
                  <span
                    style={{
                      background: String(viewingOrder.status).toLowerCase() === 'approved'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : String(viewingOrder.status).toLowerCase() === 'rejected'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                      color: String(viewingOrder.status).toLowerCase() === 'approved'
                        ? '#10B981'
                        : String(viewingOrder.status).toLowerCase() === 'rejected'
                          ? '#EF4444'
                          : '#F59E0B',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}
                  >
                    ● {String(viewingOrder.status || '').toUpperCase()}
                  </span>
                </div>

                {/* If Pending Banner */}
                {String(viewingOrder.status).toLowerCase() === 'pending' && (
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', padding: '10px 12px', color: '#fbbf24', fontSize: '12px', lineHeight: '1.4' }}>
                    <strong>Awaiting Admin Approval:</strong> Your land order has been submitted and is currently pending verification by the ApnaPay administration team. Once approved, your parcel units will automatically be credited to your holdings.
                  </div>
                )}

                {/* If Approved Banner */}
                {String(viewingOrder.status).toLowerCase() === 'approved' && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '10px 12px', color: '#10B981', fontSize: '12px', lineHeight: '1.4' }}>
                    <strong>Order Confirmed & Approved:</strong> This order has been approved by administrator. The parcel has been confirmed and credited to your holdings.
                    {viewingOrder.approvedAt && (
                      <div style={{ marginTop: '4px', color: '#A9BDD7', fontSize: '11px' }}>
                        Approved At: {new Date(viewingOrder.approvedAt).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                )}

                {/* If Rejected Banner */}
                {String(viewingOrder.status).toLowerCase() === 'rejected' && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '10px 12px', color: '#EF4444', fontSize: '12px', lineHeight: '1.4' }}>
                    <strong>Order Rejected by Administrator:</strong>
                    <div style={{ marginTop: '4px', color: '#FFFFFF', fontWeight: '600' }}>
                      Reason: {viewingOrder.rejectionReason || 'No specific reason provided.'}
                    </div>
                    {viewingOrder.rejectedAt && (
                      <div style={{ marginTop: '4px', color: '#A9BDD7', fontSize: '11px' }}>
                        Rejected At: {new Date(viewingOrder.rejectedAt).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #071426', paddingBottom: '6px' }}>
                  <span style={{ color: '#A9BDD7' }}>Order Date:</span>
                  <span style={{ color: '#A9BDD7' }}>{viewingOrder.createdAt ? new Date(viewingOrder.createdAt).toLocaleString('en-IN') : 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setViewingOrder(null)}
                className="auth-button"
                style={{ width: 'auto', padding: '0 20px', height: '36px', fontSize: '13px', margin: 0 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CustomerLandPage;

