import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import billService from '../../services/billService';
import walletService from '../../services/walletService';
import {
  ReceiptIcon,
  ZapIcon,
  DropletIcon,
  FlameIcon,
  TvIcon,
  WifiIcon,
  PhoneCallIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  LandmarkIcon,
  BuildingIcon,
  BookmarkIcon,
  HistoryIcon,
  SearchIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  XIcon,
  CopyIcon,
  CheckIcon,
  WalletIcon,
  ArrowRightIcon,
  FilterIcon,
  SparklesIcon,
  ChevronDownIcon,
  TrashIcon,
  DownloadIcon,
  SmartphoneIcon
} from '../../components/Icons';

// Category Icon Mapping (Lucide & Custom SVG icons)
const getCategoryIcon = (categoryKey, size = 20, className = '') => {
  const key = String(categoryKey || '').toLowerCase();
  switch (key) {
    case 'electricity':
      return <ZapIcon size={size} className={className} />;
    case 'water':
      return <DropletIcon size={size} className={className} />;
    case 'gas':
    case 'piped-gas':
    case 'piped_gas':
      return <FlameIcon size={size} className={className} />;
    case 'dth':
      return <TvIcon size={size} className={className} />;
    case 'broadband':
    case 'internet':
      return <WifiIcon size={size} className={className} />;
    case 'mobile':
    case 'mobile_postpaid':
    case 'mobile-postpaid':
    case 'mobile-prepaid':
      return <SmartphoneIcon size={size} className={className} />;
    case 'landline':
    case 'telephone':
      return <PhoneCallIcon size={size} className={className} />;
    case 'fastag':
    case 'credit-card':
    case 'credit_card':
      return <CreditCardIcon size={size} className={className} />;
    case 'insurance':
    case 'life-insurance':
      return <ShieldCheckIcon size={size} className={className} />;
    case 'loan-repayment':
    case 'loan_repayment':
    case 'loan':
    case 'emi':
      return <LandmarkIcon size={size} className={className} />;
    case 'municipal-taxes':
    case 'municipal_taxes':
    case 'municipal':
    case 'property-tax':
      return <BuildingIcon size={size} className={className} />;
    default:
      return <ReceiptIcon size={size} className={className} />;
  }
};

const formatINR = (val) => {
  const num = parseFloat(val) || 0;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (_) {
    return dateStr;
  }
};

const CustomerBillsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Active Tab: 'pay' | 'favorites' | 'history'
  const [activeTab, setActiveTab] = useState('pay');

  // Core Data
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [billers, setBillers] = useState([]);
  const [selectedBiller, setSelectedBiller] = useState(null);
  const [billerSearch, setBillerSearch] = useState('');
  const [isBillerDropdownOpen, setIsBillerDropdownOpen] = useState(false);

  // Form & Fetch State
  const [consumerNumber, setConsumerNumber] = useState('');
  const [inputError, setInputError] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedBill, setFetchedBill] = useState(null);
  const [fetchError, setFetchError] = useState('');

  // Payment Configuration
  const [paymentMode, setPaymentMode] = useState('DEMO'); // 'DEMO' | 'WALLET'
  const [paymentPin, setPaymentPin] = useState('1234');
  const [saveAsFavorite, setSaveAsFavorite] = useState(false);
  const [favoriteNickname, setFavoriteNickname] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null); // Completed receipt object
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Wallet Balance
  const [walletBalance, setWalletBalance] = useState(null);

  // Favorites Tab State
  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [deletingFavoriteId, setDeletingFavoriteId] = useState(null);

  // History Tab State
  const [historyList, setHistoryList] = useState([]);
  const [historyPagination, setHistoryPagination] = useState({});
  const [historyFilterStatus, setHistoryFilterStatus] = useState('ALL');
  const [historyFilterCategory, setHistoryFilterCategory] = useState('ALL');
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Copy Feedback
  const [copiedTxn, setCopiedTxn] = useState(false);
  const [globalNotice, setGlobalNotice] = useState(null); // { type: 'success'|'error', message }

  const billerDropdownRef = useRef(null);

  // Close biller dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (billerDropdownRef.current && !billerDropdownRef.current.contains(e.target)) {
        setIsBillerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Initial Load: Categories & Wallet Balance
  useEffect(() => {
    loadCategories();
    loadWalletBalance();
    loadFavorites();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await billService.getCategories();
      if (res?.data && res.data.length > 0) {
        const normalized = res.data.map((cat) => {
          const resolvedName =
            cat.name ||
            cat.categoryName ||
            cat.category_name ||
            (cat.categoryKey
              ? cat.categoryKey.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
              : 'Category');

          return {
            ...cat,
            name: resolvedName,
            categoryName: resolvedName
          };
        });

        setCategories(normalized);
        // Default to electricity or first category
        const defaultCat = normalized.find((c) => c.categoryKey === 'electricity') || normalized[0];
        setSelectedCategory(defaultCat);
      }
    } catch (err) {
      setGlobalNotice({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load bill categories.'
      });
    }
  };

  const loadWalletBalance = async () => {
    try {
      const res = await walletService.getBalance();
      if (res?.data) {
        setWalletBalance(res.data.availableBalance ?? res.data.balance ?? 0);
      }
    } catch (_) {}
  };

  // 2. Load Billers whenever Category changes
  useEffect(() => {
    if (selectedCategory?.categoryKey) {
      loadBillers(selectedCategory.categoryKey);
    }
  }, [selectedCategory]);

  const loadBillers = async (categoryKey) => {
    try {
      setSelectedBiller(null);
      setFetchedBill(null);
      setFetchError('');
      setInputError('');
      const res = await billService.getBillers(categoryKey);
      if (res?.data) {
        setBillers(res.data);
        if (res.data.length > 0) {
          setSelectedBiller(res.data[0]);
        }
      }
    } catch (err) {
      setBillers([]);
    }
  };

  // 3. Load Favorites
  const loadFavorites = async () => {
    setLoadingFavorites(true);
    try {
      const res = await billService.getFavorites();
      setFavorites(res?.data || []);
    } catch (_) {
      setFavorites([]);
    } finally {
      setLoadingFavorites(false);
    }
  };

  // 4. Load History
  const loadHistory = async (page = 1) => {
    setLoadingHistory(true);
    try {
      const params = { page, limit: 10 };
      if (historyFilterStatus !== 'ALL') params.status = historyFilterStatus;
      if (historyFilterCategory !== 'ALL') params.category = historyFilterCategory;
      if (historySearch.trim()) params.search = historySearch.trim();

      const res = await billService.getHistory(params);
      setHistoryList(res?.data?.payments || []);
      setHistoryPagination(res?.data?.pagination || {});
      setHistoryPage(page);
    } catch (_) {
      setHistoryList([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory(1);
    } else if (activeTab === 'favorites') {
      loadFavorites();
    }
  }, [activeTab, historyFilterStatus, historyFilterCategory]);

  // Handle Category selection
  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setConsumerNumber('');
    setInputError('');
    setFetchedBill(null);
    setFetchError('');
    setBillerSearch('');
    setIsBillerDropdownOpen(false);
  };

  // Handle Biller selection
  const handleSelectBiller = (biller) => {
    setSelectedBiller(biller);
    setIsBillerDropdownOpen(false);
    setFetchedBill(null);
    setFetchError('');
    setInputError('');
  };

  // Quick Pay from Favorite
  const handleQuickPayFavorite = async (fav) => {
    // 1. Find category
    const cat = categories.find((c) => c.categoryKey === fav.categoryKey);
    if (cat) setSelectedCategory(cat);

    // 2. Load billers and select
    try {
      const res = await billService.getBillers(fav.categoryKey);
      setBillers(res?.data || []);
      const match = res?.data?.find((b) => b.id === fav.billerId);
      if (match) setSelectedBiller(match);
      setConsumerNumber(fav.consumerNumber);
      setActiveTab('pay');

      // Auto-trigger fetch
      if (fav.billerId && fav.consumerNumber) {
        setIsFetching(true);
        setFetchError('');
        try {
          const fetchRes = await billService.fetchBill({
            billerId: fav.billerId,
            consumerNumber: fav.consumerNumber
          });
          setFetchedBill(fetchRes?.data || null);
        } catch (fetchErr) {
          setFetchError(fetchErr.response?.data?.message || 'Failed to fetch bill.');
        } finally {
          setIsFetching(false);
        }
      }
    } catch (_) {}
  };

  // Delete Favorite
  const handleDeleteFavorite = async (id) => {
    if (!window.confirm('Are you sure you want to remove this saved biller?')) return;
    setDeletingFavoriteId(id);
    try {
      await billService.deleteFavorite(id);
      setFavorites((prev) => prev.filter((f) => f.id !== id));
      setGlobalNotice({ type: 'success', message: 'Saved biller removed successfully.' });
      setTimeout(() => setGlobalNotice(null), 4000);
    } catch (err) {
      setGlobalNotice({
        type: 'error',
        message: err.response?.data?.message || 'Failed to remove saved biller.'
      });
      setTimeout(() => setGlobalNotice(null), 4000);
    } finally {
      setDeletingFavoriteId(null);
    }
  };

  // Real-time parameter validation
  const validateConsumerInput = (val) => {
    if (!selectedBiller) return true;
    const param = selectedBiller.customerParameter;
    if (!param) return true;

    if (!val || !val.trim()) {
      setInputError(`Please enter your ${param.paramName || 'consumer number'}.`);
      return false;
    }

    const trimmed = val.trim();
    if (param.minLength && trimmed.length < param.minLength) {
      setInputError(`Must be at least ${param.minLength} characters.`);
      return false;
    }
    if (param.maxLength && trimmed.length > param.maxLength) {
      setInputError(`Cannot exceed ${param.maxLength} characters.`);
      return false;
    }
    if (param.regex) {
      try {
        const re = new RegExp(param.regex);
        if (!re.test(trimmed)) {
          setInputError(param.helpText || `Invalid format for ${param.paramName}.`);
          return false;
        }
      } catch (_) {}
    }

    setInputError('');
    return true;
  };

  // Fetch Bill Action
  const handleFetchBill = async (e) => {
    if (e) e.preventDefault();
    if (!selectedBiller) return;

    if (!validateConsumerInput(consumerNumber)) return;

    setIsFetching(true);
    setFetchError('');
    setFetchedBill(null);

    try {
      const res = await billService.fetchBill({
        billerId: selectedBiller.id,
        consumerNumber: consumerNumber.trim()
      });
      setFetchedBill(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to fetch bill details. Please check the consumer number.';
      setFetchError(msg);
    } finally {
      setIsFetching(false);
    }
  };

  // Execute Payment
  const handlePayBill = async () => {
    if (!fetchedBill || !fetchedBill.fetchReferenceId) return;

    // Check wallet balance if in WALLET mode
    if (paymentMode === 'WALLET') {
      if (walletBalance !== null && walletBalance < fetchedBill.billAmount) {
        setFetchError(`Insufficient wallet balance (${formatINR(walletBalance)}). Please choose Demo Mode or top up your wallet.`);
        return;
      }
      if (!paymentPin || paymentPin.length < 4) {
        setFetchError('Please enter your 4-digit Wallet Transaction PIN.');
        return;
      }
    }

    setIsPaying(true);
    setFetchError('');

    try {
      // 1. Client-Side Server Validation Call
      await billService.validateBill({
        fetchReferenceId: fetchedBill.fetchReferenceId,
        billAmount: fetchedBill.billAmount
      });

      // 2. Generate client-side idempotency key for network resilience
      const idempotencyKey = `bp-client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // 3. Execute Payment Request
      const paymentPayload = {
        fetchReferenceId: fetchedBill.fetchReferenceId,
        billerId: selectedBiller.id,
        consumerNumber: consumerNumber.trim(),
        amount: fetchedBill.billAmount,
        paymentMode: paymentMode,
        paymentPin: paymentMode === 'WALLET' ? paymentPin : undefined,
        idempotencyKey
      };

      const res = await billService.payBill(paymentPayload);

      // 4. Save Favorite if requested
      if (saveAsFavorite) {
        try {
          await billService.saveFavorite({
            billerId: selectedBiller.id,
            consumerNumber: consumerNumber.trim(),
            nickname: favoriteNickname.trim() || `${selectedBiller.billerName} (${consumerNumber.slice(-4)})`
          });
          loadFavorites();
        } catch (_) {}
      }

      // 5. Update local wallet balance if WALLET mode
      if (paymentMode === 'WALLET') {
        loadWalletBalance();
      }

      // 6. Set receipt data and open receipt modal
      setPaymentResult(res.data);
      setShowReceiptModal(true);

      // Clear current bill state
      setFetchedBill(null);
      setConsumerNumber('');
      setSaveAsFavorite(false);
      setFavoriteNickname('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Payment execution failed. Please try again.';
      setFetchError(msg);
    } finally {
      setIsPaying(false);
    }
  };

  // View Receipt for previous transaction in history
  const handleViewHistoricalReceipt = async (txn) => {
    try {
      const res = await billService.getPaymentDetails(txn.txnReference || txn.id);
      setPaymentResult(res.data);
      setShowReceiptModal(true);
    } catch (_) {
      // Fallback to local txn object if API lookup fails
      setPaymentResult(txn);
      setShowReceiptModal(true);
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedTxn(true);
    setTimeout(() => setCopiedTxn(false), 2500);
  };

  // Filtered billers in dropdown
  const filteredBillers = billers.filter((b) =>
    b.billerName.toLowerCase().includes(billerSearch.toLowerCase()) ||
    (b.billerCode && b.billerCode.toLowerCase().includes(billerSearch.toLowerCase()))
  );

  return (
    <DashboardLayout
      title="Bill Payments & Utilities"
      subtitle="BBPS-ready simulated utility bill payments, instant status checks, saved billers, and ledger recording"
      backFallback="/app"
      onRefresh={() => {
        loadCategories();
        loadWalletBalance();
        if (activeTab === 'favorites') loadFavorites();
        if (activeTab === 'history') loadHistory(historyPage);
      }}
    >
      {/* Simulation Banner */}
      <div
        className="dashboard-card"
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(10, 20, 34, 0.98) 100%)',
          borderColor: 'rgba(245, 158, 11, 0.35)',
          padding: '14px 18px',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <SparklesIcon size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#FCD34D' }}>
                  DEMO SIMULATION MODE ACTIVE
                </span>
                <span className="sidebar-badge yellow">Sandbox BBPS</span>
              </div>
              <p style={{ fontSize: '12px', color: '#A9BDD7', margin: '2px 0 0 0' }}>
                Simulate authentic utility bills, dynamic bill fetching, and wallet deductions. No real payments are transmitted to utility providers.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#A9BDD7' }}>Escrow Wallet Balance</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#10B981' }}>
                {walletBalance !== null ? formatINR(walletBalance) : 'Loading...'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Notifications */}
      {globalNotice && (
        <div className={`auth-alert ${globalNotice.type}`} style={{ marginBottom: '16px' }}>
          {globalNotice.type === 'success' ? <CheckCircleIcon size={18} /> : <AlertCircleIcon size={18} />}
          <span>{globalNotice.message}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          borderBottom: '1px solid #17385D',
          marginBottom: '24px',
          overflowX: 'auto',
          paddingBottom: '12px'
        }}
      >
        <button
          onClick={() => setActiveTab('pay')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            background: activeTab === 'pay' ? 'linear-gradient(90deg, #087BFF 0%, #00A8FF 100%)' : '#0B1B32',
            border: activeTab === 'pay' ? 'none' : '1px solid #17385D',
            color: activeTab === 'pay' ? '#FFFFFF' : '#A9BDD7',
            fontWeight: activeTab === 'pay' ? '700' : '500',
            cursor: 'pointer',
            fontSize: '13px',
            boxShadow: activeTab === 'pay' ? '0 4px 14px rgba(8, 123, 255, 0.35)' : 'none',
            transition: 'all 0.22s ease'
          }}
        >
          <ReceiptIcon size={16} />
          <span>Pay New Bill</span>
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            background: activeTab === 'favorites' ? 'linear-gradient(90deg, #087BFF 0%, #00A8FF 100%)' : '#0B1B32',
            border: activeTab === 'favorites' ? 'none' : '1px solid #17385D',
            color: activeTab === 'favorites' ? '#FFFFFF' : '#A9BDD7',
            fontWeight: activeTab === 'favorites' ? '700' : '500',
            cursor: 'pointer',
            fontSize: '13px',
            boxShadow: activeTab === 'favorites' ? '0 4px 14px rgba(8, 123, 255, 0.35)' : 'none',
            transition: 'all 0.22s ease'
          }}
        >
          <BookmarkIcon size={16} />
          <span>Saved Billers ({favorites.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            background: activeTab === 'history' ? 'linear-gradient(90deg, #087BFF 0%, #00A8FF 100%)' : '#0B1B32',
            border: activeTab === 'history' ? 'none' : '1px solid #17385D',
            color: activeTab === 'history' ? '#FFFFFF' : '#A9BDD7',
            fontWeight: activeTab === 'history' ? '700' : '500',
            cursor: 'pointer',
            fontSize: '13px',
            boxShadow: activeTab === 'history' ? '0 4px 14px rgba(8, 123, 255, 0.35)' : 'none',
            transition: 'all 0.22s ease'
          }}
        >
          <HistoryIcon size={16} />
          <span>Payment History</span>
        </button>
      </div>

      {/* ================= TAB 1: PAY NEW BILL ================= */}
      {activeTab === 'pay' && (
        <div className="fade-in">
          {/* Step 1: Category Selection Grid */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ZapIcon size={16} style={{ color: '#00D5FF' }} />
                <span>SELECT BILL CATEGORY</span>
              </span>
              <span style={{ fontSize: '12px', color: '#A9BDD7' }}>
                {categories.length} Available BBPS Categories
              </span>
            </div>

            <div className="bill-categories-grid">
              {categories.map((cat) => {
                const isSelected = selectedCategory?.id === cat.id;
                const displayName = cat.name || cat.categoryName || 'Category';
                return (
                  <button
                    key={cat.id || cat.categoryKey}
                    type="button"
                    onClick={() => handleSelectCategory(cat)}
                    className={`bill-category-card ${isSelected ? 'selected' : ''}`}
                    title={`Select ${displayName}`}
                    aria-pressed={isSelected}
                  >
                    <div className="bill-category-icon-wrap">
                      {getCategoryIcon(cat.categoryKey, 22)}
                    </div>
                    <span className="bill-category-name">
                      {displayName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Biller Selector & Consumer Parameter Form */}
          {selectedCategory && (
            <div
              className="dashboard-card fade-in"
              style={{
                background: '#0B1B32',
                borderColor: '#17385D',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(8, 123, 255, 0.16)',
                    border: '1px solid rgba(0, 168, 255, 0.35)',
                    color: '#00D5FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {getCategoryIcon(selectedCategory.categoryKey, 20)}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                    {selectedCategory.name || selectedCategory.categoryName} Bill Details
                  </h3>
                  <span style={{ fontSize: '12px', color: '#A9BDD7' }}>
                    {selectedCategory.description}
                  </span>
                </div>
              </div>

              <form onSubmit={handleFetchBill}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {/* Biller Search / Dropdown */}
                  <div style={{ position: 'relative' }} ref={billerDropdownRef}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#A9BDD7', marginBottom: '6px' }}>
                      Select Biller / Service Provider *
                    </label>

                    <div
                      onClick={() => setIsBillerDropdownOpen(!isBillerDropdownOpen)}
                      style={{
                        background: '#071426',
                        border: '1px solid #17385D',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: selectedBiller ? '#FFFFFF' : '#6B87A8'
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedBiller ? selectedBiller.billerName : 'Choose your provider...'}
                      </span>
                      <ChevronDownIcon size={16} />
                    </div>

                    {/* Biller Dropdown Menu */}
                    {isBillerDropdownOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          zIndex: 50,
                          marginTop: '4px',
                          background: '#0B1B32',
                          border: '1px solid #17385D',
                          borderRadius: '8px',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                          maxHeight: '260px',
                          overflowY: 'auto'
                        }}
                      >
                        <div style={{ padding: '8px', borderBottom: '1px solid #17385D' }}>
                          <input
                            type="text"
                            placeholder="Search provider name or code..."
                            value={billerSearch}
                            onChange={(e) => setBillerSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              width: '100%',
                              background: '#071426',
                              border: '1px solid #17385D',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              color: '#FFFFFF',
                              outline: 'none'
                            }}
                            autoFocus
                          />
                        </div>

                        {filteredBillers.length === 0 ? (
                          <div style={{ padding: '14px', textAlign: 'center', fontSize: '12px', color: '#6B87A8' }}>
                            No billers match your search.
                          </div>
                        ) : (
                          filteredBillers.map((b) => (
                            <div
                              key={b.id}
                              onClick={() => handleSelectBiller(b)}
                              style={{
                                padding: '10px 14px',
                                borderBottom: '1px solid #0E223D',
                                cursor: 'pointer',
                                background: selectedBiller?.id === b.id ? 'rgba(0, 166, 255, 0.15)' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                            >
                              <div>
                                <div style={{ fontSize: '13px', color: '#FFFFFF', fontWeight: '500' }}>
                                  {b.billerName}
                                </div>
                                <div style={{ fontSize: '11px', color: '#6B87A8', marginTop: '2px' }}>
                                  Code: {b.billerCode}
                                </div>
                              </div>
                              {selectedBiller?.id === b.id && <CheckIcon size={16} style={{ color: '#00A8FF' }} />}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Dynamic Parameter Input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#A9BDD7', marginBottom: '6px' }}>
                      {selectedBiller?.customerParameter?.paramName || 'Consumer Number'} *
                    </label>
                    <input
                      type="text"
                      value={consumerNumber}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConsumerNumber(val);
                        validateConsumerInput(val);
                      }}
                      placeholder={selectedBiller?.customerParameter?.placeholder || 'Enter consumer number'}
                      style={{
                        width: '100%',
                        background: '#071426',
                        border: inputError ? '1px solid #EF4444' : '1px solid #17385D',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        fontSize: '13px',
                        color: '#FFFFFF',
                        outline: 'none'
                      }}
                    />
                    <div style={{ fontSize: '11px', color: inputError ? '#EF4444' : '#6B87A8', marginTop: '4px' }}>
                      {inputError || selectedBiller?.customerParameter?.helpText || 'Enter valid customer identifier'}
                    </div>
                  </div>
                </div>

                {/* Simulation Hint Box */}
                <div
                  style={{
                    background: 'rgba(0, 166, 255, 0.05)',
                    border: '1px dashed rgba(0, 166, 255, 0.3)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginTop: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#A9BDD7' }}>
                    💡 <strong style={{ color: '#00A8FF' }}>Demo Tips:</strong> Any valid number gives an unpaid bill.
                    Ending with <code style={{ color: '#10B981', background: '#071426', padding: '1px 4px', borderRadius: '4px' }}>0000</code> tests "Already Paid".
                    Ending with <code style={{ color: '#F59E0B', background: '#071426', padding: '1px 4px', borderRadius: '4px' }}>9999</code> tests "Overdue".
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const base = '1000234567';
                        const len = selectedBiller?.customerParameter?.minLength || 10;
                        const sample = base.slice(0, len).padEnd(len, '1');
                        setConsumerNumber(sample);
                        validateConsumerInput(sample);
                      }}
                      style={{
                        background: '#0E223D',
                        border: '1px solid #17385D',
                        color: '#00A8FF',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      Fill Sample
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const len = selectedBiller?.customerParameter?.minLength || 10;
                        const sample = '1000000000'.slice(0, len - 4).padEnd(len, '0');
                        setConsumerNumber(sample);
                        validateConsumerInput(sample);
                      }}
                      style={{
                        background: '#0E223D',
                        border: '1px solid #17385D',
                        color: '#10B981',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      Fill Paid (0000)
                    </button>
                  </div>
                </div>

                {/* Fetch Button & Error */}
                {fetchError && (
                  <div className="auth-alert error" style={{ marginTop: '16px' }}>
                    <AlertCircleIcon size={16} />
                    <span>{fetchError}</span>
                  </div>
                )}

                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={isFetching || !selectedBiller}
                    className="auth-button"
                    style={{
                      width: 'auto',
                      padding: '0 24px',
                      height: '42px',
                      fontSize: '13px',
                      margin: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {isFetching ? (
                      <>
                        <RefreshCwIcon size={16} className="animate-spin" />
                        <span>Fetching Bill from BBPS...</span>
                      </>
                    ) : (
                      <>
                        <SearchIcon size={16} />
                        <span>Fetch Bill Details</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Fetched Bill Details Card */}
          {fetchedBill && (
            <div
              className="dashboard-card"
              style={{
                background: 'linear-gradient(135deg, rgba(11, 21, 36, 0.98) 0%, rgba(7, 14, 25, 0.98) 100%)',
                borderColor: fetchedBill.isPayable ? '#00A8FF' : '#17385D',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: fetchedBill.isPayable ? '0 0 20px rgba(0, 166, 255, 0.15)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #17385D', paddingBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#00A8FF', fontWeight: '700', letterSpacing: '0.8px' }}>
                    VERIFIED BBPS BILL ENQUIRY
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF', marginTop: '2px' }}>
                    {fetchedBill.billerName}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#A9BDD7', marginTop: '2px' }}>
                    Ref: <code style={{ color: '#00A8FF' }}>{fetchedBill.fetchReferenceId}</code>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    className={`sidebar-badge ${
                      fetchedBill.billStatus === 'paid'
                        ? 'green'
                        : fetchedBill.billStatus === 'overdue'
                        ? 'red'
                        : 'amber'
                    }`}
                    style={{ fontSize: '12px', padding: '4px 10px' }}
                  >
                    ● {fetchedBill.billStatus.toUpperCase()}
                  </span>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: fetchedBill.isPayable ? '#10B981' : '#A9BDD7', marginTop: '6px' }}>
                    {formatINR(fetchedBill.billAmount)}
                  </div>
                </div>
              </div>

              {/* Bill Attributes Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  margin: '20px 0'
                }}
              >
                <div style={{ background: '#071426', padding: '12px', borderRadius: '8px', border: '1px solid #0E223D' }}>
                  <div style={{ fontSize: '11px', color: '#6B87A8' }}>Customer Name</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF', marginTop: '4px' }}>
                    {fetchedBill.customerName || 'N/A'}
                  </div>
                </div>

                <div style={{ background: '#071426', padding: '12px', borderRadius: '8px', border: '1px solid #0E223D' }}>
                  <div style={{ fontSize: '11px', color: '#6B87A8' }}>Consumer Number</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF', marginTop: '4px' }}>
                    {fetchedBill.consumerNumber}
                  </div>
                </div>

                <div style={{ background: '#071426', padding: '12px', borderRadius: '8px', border: '1px solid #0E223D' }}>
                  <div style={{ fontSize: '11px', color: '#6B87A8' }}>Bill Date</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF', marginTop: '4px' }}>
                    {fetchedBill.billDate || 'N/A'}
                  </div>
                </div>

                <div style={{ background: '#071426', padding: '12px', borderRadius: '8px', border: '1px solid #0E223D' }}>
                  <div style={{ fontSize: '11px', color: '#6B87A8' }}>Due Date</div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: fetchedBill.billStatus === 'overdue' ? '#EF4444' : '#FFFFFF',
                      marginTop: '4px'
                    }}
                  >
                    {fetchedBill.dueDate || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Already Paid Notice */}
              {fetchedBill.billStatus === 'paid' && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid #10B981',
                    borderRadius: '8px',
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#10B981'
                  }}
                >
                  <CheckCircleIcon size={20} />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '13px' }}>No Payment Due</div>
                    <div style={{ fontSize: '12px', color: '#A7F3D0', marginTop: '2px' }}>
                      All dues for this consumer number have been settled with {fetchedBill.billerName}.
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Section for Payable Bills */}
              {fetchedBill.isPayable && (
                <div style={{ borderTop: '1px solid #17385D', paddingTop: '20px', marginTop: '10px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF', marginBottom: '14px' }}>
                    Choose Payment Method
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                    {/* DEMO Simulation Mode */}
                    <div
                      onClick={() => setPaymentMode('DEMO')}
                      style={{
                        background: paymentMode === 'DEMO' ? 'rgba(0, 166, 255, 0.12)' : '#071426',
                        border: paymentMode === 'DEMO' ? '2px solid #00A8FF' : '1px solid #17385D',
                        borderRadius: '10px',
                        padding: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <SparklesIcon size={18} style={{ color: '#00A8FF' }} />
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>Demo Sandbox Mode</span>
                        </div>
                        <span className="sidebar-badge blue">Instant Test</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#A9BDD7', marginTop: '6px' }}>
                        Fast simulation with realistic receipt. No wallet balance required or deducted.
                      </div>
                    </div>

                    {/* WALLET Live Escrow Mode */}
                    <div
                      onClick={() => setPaymentMode('WALLET')}
                      style={{
                        background: paymentMode === 'WALLET' ? 'rgba(16, 185, 129, 0.12)' : '#071426',
                        border: paymentMode === 'WALLET' ? '2px solid #10B981' : '1px solid #17385D',
                        borderRadius: '10px',
                        padding: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <WalletIcon size={18} style={{ color: '#10B981' }} />
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>ApnaPay Escrow Wallet</span>
                        </div>
                        <span className="sidebar-badge green">Ledger Tracked</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#A9BDD7', marginTop: '6px' }}>
                        Deducts ₹{fetchedBill.billAmount} from wallet ({formatINR(walletBalance || 0)} available) with double-entry ledger entry.
                      </div>
                    </div>
                  </div>

                  {/* WALLET Mode Pin Prompt */}
                  {paymentMode === 'WALLET' && (
                    <div
                      style={{
                        background: '#071426',
                        border: '1px solid #17385D',
                        borderRadius: '8px',
                        padding: '14px',
                        marginBottom: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#FFFFFF' }}>
                          Wallet Transaction PIN
                        </div>
                        <div style={{ fontSize: '11px', color: '#6B87A8' }}>
                          Enter your 4-digit PIN to authorize escrow balance debit (Default demo PIN: 1234)
                        </div>
                      </div>
                      <input
                        type="password"
                        maxLength={6}
                        value={paymentPin}
                        onChange={(e) => setPaymentPin(e.target.value)}
                        placeholder="1234"
                        style={{
                          width: '120px',
                          background: '#0B1B32',
                          border: '1px solid #17385D',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '14px',
                          letterSpacing: '3px',
                          textAlign: 'center',
                          color: '#FFFFFF'
                        }}
                      />
                    </div>
                  )}

                  {/* Save to Favorites Checkbox */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#A9BDD7' }}>
                      <input
                        type="checkbox"
                        checked={saveAsFavorite}
                        onChange={(e) => setSaveAsFavorite(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#00A8FF' }}
                      />
                      <span>Save this biller to my favorites for quick 1-click recharges</span>
                    </label>

                    {saveAsFavorite && (
                      <input
                        type="text"
                        placeholder="Give a nickname (e.g. Home Electricity, Office DTH)"
                        value={favoriteNickname}
                        onChange={(e) => setFavoriteNickname(e.target.value)}
                        style={{
                          marginTop: '8px',
                          width: '100%',
                          maxWidth: '360px',
                          background: '#071426',
                          border: '1px solid #17385D',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '12px',
                          color: '#FFFFFF'
                        }}
                      />
                    )}
                  </div>

                  {/* Pay Button */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setFetchedBill(null)}
                      className="auth-button secondary"
                      style={{ width: 'auto', padding: '0 20px', height: '42px', fontSize: '13px', margin: 0 }}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handlePayBill}
                      disabled={isPaying}
                      className="auth-button"
                      style={{
                        width: 'auto',
                        padding: '0 28px',
                        height: '42px',
                        fontSize: '13px',
                        margin: 0,
                        background: '#10B981',
                        borderColor: '#10B981',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {isPaying ? (
                        <>
                          <RefreshCwIcon size={16} className="animate-spin" />
                          <span>Processing Payment...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon size={16} />
                          <span>Pay {formatINR(fetchedBill.billAmount)} Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: SAVED BILLERS ================= */}
      {activeTab === 'favorites' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                Saved Billers & Frequent Payees
              </h3>
              <p style={{ fontSize: '12px', color: '#A9BDD7', margin: '2px 0 0 0' }}>
                Quickly fetch dues and settle utility bills with your pre-saved consumer IDs.
              </p>
            </div>
            <button
              onClick={loadFavorites}
              className="auth-button secondary"
              style={{ width: 'auto', padding: '0 14px', height: '34px', fontSize: '12px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCwIcon size={13} />
              <span>Refresh</span>
            </button>
          </div>

          {loadingFavorites ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#A9BDD7' }}>
              <RefreshCwIcon size={24} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
              <div>Loading your saved billers...</div>
            </div>
          ) : favorites.length === 0 ? (
            <div
              className="dashboard-card"
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: '#0B1B32',
                borderColor: '#17385D'
              }}
            >
              <BookmarkIcon size={36} style={{ color: '#17385D', margin: '0 auto 12px auto' }} />
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF' }}>No Saved Billers Yet</div>
              <p style={{ fontSize: '12px', color: '#A9BDD7', maxWidth: '360px', margin: '6px auto 16px auto' }}>
                When paying a bill, check "Save this biller to my favorites" to access 1-click payments here.
              </p>
              <button
                onClick={() => setActiveTab('pay')}
                className="auth-button"
                style={{ width: 'auto', padding: '0 18px', height: '36px', fontSize: '12px', margin: 0 }}
              >
                Pay a New Bill Now
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px'
              }}
            >
              {favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="dashboard-card"
                  style={{
                    background: '#0B1B32',
                    borderColor: '#17385D',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: '#0E223D',
                            color: '#00A8FF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {getCategoryIcon(fav.categoryKey, 18)}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>
                            {fav.nickname || fav.billerName}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6B87A8' }}>
                            {fav.billerName}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteFavorite(fav.id)}
                        disabled={deletingFavoriteId === fav.id}
                        title="Delete saved biller"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>

                    <div style={{ background: '#071426', borderRadius: '6px', padding: '10px 12px', margin: '14px 0 16px 0' }}>
                      <div style={{ fontSize: '11px', color: '#6B87A8' }}>Registered Consumer ID</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#00A8FF', fontFamily: 'monospace' }}>
                        {fav.maskedConsumerNumber || fav.consumerNumber}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleQuickPayFavorite(fav)}
                    className="auth-button"
                    style={{
                      width: '100%',
                      height: '36px',
                      fontSize: '12px',
                      margin: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>Quick Fetch & Pay</span>
                    <ArrowRightIcon size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: PAYMENT HISTORY ================= */}
      {activeTab === 'history' && (
        <div>
          {/* Filters Bar */}
          <div
            className="dashboard-card"
            style={{
              background: '#0B1B32',
              borderColor: '#17385D',
              padding: '16px',
              marginBottom: '18px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
                {/* Search */}
                <div style={{ position: 'relative', minWidth: '200px', flex: 1 }}>
                  <input
                    type="text"
                    placeholder="Search biller or txn reference..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') loadHistory(1); }}
                    style={{
                      width: '100%',
                      background: '#071426',
                      border: '1px solid #17385D',
                      borderRadius: '6px',
                      padding: '8px 12px 8px 32px',
                      fontSize: '12px',
                      color: '#FFFFFF',
                      outline: 'none'
                    }}
                  />
                  <SearchIcon size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#6B87A8' }} />
                </div>

                {/* Status Filter */}
                <select
                  value={historyFilterStatus}
                  onChange={(e) => setHistoryFilterStatus(e.target.value)}
                  style={{
                    background: '#071426',
                    border: '1px solid #17385D',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: '#FFFFFF',
                    outline: 'none'
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUCCESS">Success</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>

                {/* Category Filter */}
                <select
                  value={historyFilterCategory}
                  onChange={(e) => setHistoryFilterCategory(e.target.value)}
                  style={{
                    background: '#071426',
                    border: '1px solid #17385D',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: '#FFFFFF',
                    outline: 'none'
                  }}
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id || c.categoryKey} value={c.categoryKey}>
                      {c.name || c.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => loadHistory(1)}
                className="auth-button secondary"
                style={{ width: 'auto', padding: '0 14px', height: '34px', fontSize: '12px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <FilterIcon size={13} />
                <span>Apply Filter</span>
              </button>
            </div>
          </div>

          {/* History Table */}
          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#A9BDD7' }}>
              <RefreshCwIcon size={24} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
              <div>Loading payment history records...</div>
            </div>
          ) : historyList.length === 0 ? (
            <div
              className="dashboard-card"
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: '#0B1B32',
                borderColor: '#17385D'
              }}
            >
              <HistoryIcon size={36} style={{ color: '#17385D', margin: '0 auto 12px auto' }} />
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF' }}>No Bill Payment Records</div>
              <p style={{ fontSize: '12px', color: '#A9BDD7', maxWidth: '360px', margin: '6px auto 16px auto' }}>
                Your completed utility payments and receipts will appear here with full ledger tracking.
              </p>
              <button
                onClick={() => setActiveTab('pay')}
                className="auth-button"
                style={{ width: 'auto', padding: '0 18px', height: '36px', fontSize: '12px', margin: 0 }}
              >
                Pay Your First Bill
              </button>
            </div>
          ) : (
            <div className="dashboard-card" style={{ background: '#0B1B32', borderColor: '#17385D', padding: '0', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#071426', borderBottom: '1px solid #17385D', color: '#A9BDD7' }}>
                      <th style={{ padding: '12px 16px' }}>Date & Time</th>
                      <th style={{ padding: '12px 16px' }}>Txn Reference</th>
                      <th style={{ padding: '12px 16px' }}>Biller & Category</th>
                      <th style={{ padding: '12px 16px' }}>Consumer No.</th>
                      <th style={{ padding: '12px 16px' }}>Amount</th>
                      <th style={{ padding: '12px 16px' }}>Mode</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyList.map((row) => (
                      <tr
                        key={row.id}
                        style={{
                          borderBottom: '1px solid #0E223D',
                          color: '#FFFFFF',
                          transition: 'background 0.15s'
                        }}
                      >
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', color: '#A9BDD7' }}>
                          {formatDate(row.paidAt || row.createdAt)}
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#00A8FF' }}>
                          {row.txnReference}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: '600' }}>{row.billerName}</div>
                          <div style={{ fontSize: '11px', color: '#6B87A8', textTransform: 'capitalize' }}>
                            {row.categoryName || row.categoryKey}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>
                          {row.maskedConsumerNumber || row.consumerNumber}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: '700', color: '#10B981' }}>
                          {formatINR(row.amount)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className={`sidebar-badge ${row.paymentMode === 'WALLET' ? 'green' : 'blue'}`}>
                            {row.paymentMode}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            className={`sidebar-badge ${
                              row.status === 'SUCCESS' ? 'green' : row.status === 'FAILED' ? 'red' : 'yellow'
                            }`}
                          >
                            ● {row.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleViewHistoricalReceipt(row)}
                            style={{
                              background: '#0E223D',
                              border: '1px solid #17385D',
                              color: '#00A8FF',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              {historyPagination.totalPages > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderTop: '1px solid #17385D',
                    background: '#071426'
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#A9BDD7' }}>
                    Showing page {historyPagination.page} of {historyPagination.totalPages} ({historyPagination.totalRecords} payments)
                  </span>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => loadHistory(historyPage - 1)}
                      disabled={historyPage <= 1}
                      className="auth-button secondary"
                      style={{ width: 'auto', padding: '0 12px', height: '30px', fontSize: '11px', margin: 0 }}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => loadHistory(historyPage + 1)}
                      disabled={historyPage >= historyPagination.totalPages}
                      className="auth-button secondary"
                      style={{ width: 'auto', padding: '0 12px', height: '30px', fontSize: '11px', margin: 0 }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= PAYMENT RECEIPT MODAL ================= */}
      {showReceiptModal && paymentResult && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              background: '#0B1B32',
              border: '1px solid #17385D',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowReceiptModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: '#A9BDD7',
                cursor: 'pointer'
              }}
            >
              <XIcon size={20} />
            </button>

            {/* Receipt Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '2px solid #10B981',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto'
                }}
              >
                <CheckCircleIcon size={30} />
              </div>
              <span className="sidebar-badge green" style={{ fontSize: '11px' }}>
                PAYMENT SUCCESSFUL
              </span>
              <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#FFFFFF', margin: '8px 0 2px 0' }}>
                {formatINR(paymentResult.amount)}
              </h3>
              <p style={{ fontSize: '12px', color: '#A9BDD7', margin: 0 }}>
                Paid to {paymentResult.billerName}
              </p>
            </div>

            {/* Txn Reference Box */}
            <div
              style={{
                background: '#071426',
                border: '1px solid #17385D',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '10px', color: '#6B87A8', textTransform: 'uppercase' }}>
                  Transaction Reference ID
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#00A8FF', fontFamily: 'monospace' }}>
                  {paymentResult.txnReference}
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(paymentResult.txnReference)}
                style={{
                  background: '#0E223D',
                  border: '1px solid #17385D',
                  color: copiedTxn ? '#10B981' : '#A9BDD7',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {copiedTxn ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
                <span>{copiedTxn ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Receipt Breakdown Details */}
            <div style={{ borderTop: '1px dashed #17385D', borderBottom: '1px dashed #17385D', padding: '12px 0', marginBottom: '16px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#A9BDD7' }}>Customer Name</span>
                <span style={{ fontWeight: '600', color: '#FFFFFF' }}>{paymentResult.customerName || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#A9BDD7' }}>Consumer Number</span>
                <span style={{ fontFamily: 'monospace', color: '#FFFFFF' }}>
                  {paymentResult.maskedConsumerNumber || paymentResult.consumerNumber}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#A9BDD7' }}>Payment Mode</span>
                <span className={`sidebar-badge ${paymentResult.paymentMode === 'WALLET' ? 'green' : 'blue'}`}>
                  {paymentResult.paymentMode}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#A9BDD7' }}>BBPS Ref No.</span>
                <span style={{ fontFamily: 'monospace', color: '#A9BDD7' }}>
                  {paymentResult.receipt?.bbpsRefNo || `BBPS-${paymentResult.id || 'SIM'}`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#A9BDD7' }}>Timestamp</span>
                <span style={{ color: '#A9BDD7' }}>
                  {formatDate(paymentResult.paidAt || paymentResult.createdAt)}
                </span>
              </div>
            </div>

            {/* Demo Simulation Notice Watermark */}
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '8px',
                padding: '8px 12px',
                textAlign: 'center',
                fontSize: '11px',
                color: '#FCD34D',
                marginBottom: '18px'
              }}
            >
              Demo Simulation Receipt • For Demonstration Purposes Only
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  window.print();
                }}
                className="auth-button secondary"
                style={{
                  flex: 1,
                  height: '38px',
                  fontSize: '12px',
                  margin: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <DownloadIcon size={14} />
                <span>Print Receipt</span>
              </button>

              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setActiveTab('history');
                  loadHistory(1);
                }}
                className="auth-button"
                style={{ flex: 1, height: '38px', fontSize: '12px', margin: 0 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CustomerBillsPage;

