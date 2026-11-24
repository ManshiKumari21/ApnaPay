import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  HistoryIcon,
  TrendingUpIcon,
  DownloadIcon,
  SearchIcon,
  FilterIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  XIcon,
  FileTextIcon,
  CalendarIcon
} from '../../components/Icons';
import transactionService from '../../services/transactionService';

const CustomerTransactionsPage = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({});
  const [summary, setSummary] = useState(null);
  const [selectedTxn, setSelectedTxn] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filters & Search
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [summaryPeriod, setSummaryPeriod] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch Transactions List
  const loadTransactions = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await transactionService.getTransactions({
        page,
        limit: 10,
        type: typeFilter,
        status: statusFilter,
        search: searchTerm,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
      setTransactions(res.data?.transactions || []);
      setPagination(res.data?.pagination || {});
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load transaction history.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Financial Summary
  const loadSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await transactionService.getSummary(summaryPeriod);
      setSummary(res.data || null);
    } catch (_) {
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [page, typeFilter, statusFilter, startDate, endDate]);

  useEffect(() => {
    loadSummary();
  }, [summaryPeriod]);

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadTransactions();
  };

  // Open Details Modal
  const handleViewDetails = async (txnId) => {
    setModalLoading(true);
    try {
      const res = await transactionService.getTransactionById(txnId);
      setSelectedTxn(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not fetch transaction details.');
    } finally {
      setModalLoading(false);
    }
  };

  // Export Statement
  const handleExport = async (format) => {
    setExporting(true);
    try {
      await transactionService.exportStatement(format, {
        type: typeFilter,
        status: statusFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
    } catch (err) {
      alert(err.response?.data?.message || `Failed to export ${format.toUpperCase()} statement.`);
    } finally {
      setExporting(false);
    }
  };

  const formatINR = (val) => {
    const num = parseFloat(val) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleBack = () => {
    if (selectedTxn) {
      setSelectedTxn(null);
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
      title="Transaction History"
      subtitle="Complete chronological statement of all payments, peer transfers, and billing records"
      backFallback="/app"
      onBack={handleBack}
      onRefresh={() => {
        loadTransactions();
        loadSummary();
      }}
    >
      {errorMsg && (
        <div className="auth-alert error" style={{ marginBottom: '20px' }}>
          <AlertCircleIcon size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Top Summary & Cashflow Breakdown */}
      <div className="dashboard-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUpIcon size={18} style={{ color: '#00A8FF' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
              Transaction Summary & Cashflow
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Period Pills */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'weekly', label: '7 Days' },
                { id: 'monthly', label: 'Month' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSummaryPeriod(p.id)}
                  style={{
                    background: summaryPeriod === p.id ? 'var(--primary-blue)' : '#071426',
                    color: summaryPeriod === p.id ? '#ffffff' : '#A9BDD7',
                    border: '1px solid #17385D',
                    borderRadius: '16px',
                    padding: '3px 10px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: summaryPeriod === p.id ? '600' : '400'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Export Buttons */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="auth-button secondary"
                style={{ width: 'auto', padding: '0 12px', height: '32px', fontSize: '11px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Download CSV Statement"
              >
                <DownloadIcon size={13} />
                <span>CSV</span>
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                className="auth-button secondary"
                style={{ width: 'auto', padding: '0 12px', height: '32px', fontSize: '11px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Download Formal PDF Statement"
              >
                <FileTextIcon size={13} />
                <span>PDF Statement</span>
              </button>
            </div>
          </div>
        </div>

        {summary && (
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {/* Total Credits */}
            <div className="stat-item" style={{ background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="stat-label">Inflow Credits (+)</span>
                <ArrowDownLeftIcon size={16} style={{ color: '#10B981' }} />
              </div>
              <div className="stat-value" style={{ color: '#10B981', fontSize: '20px' }}>
                +{summary.formattedTotalCredit || formatINR(summary.totalCredit || 0)}
              </div>
              <div style={{ fontSize: '11px', color: '#A9BDD7', marginTop: '4px' }}>
                {summary.counts?.successfulTransactions || 0} completed
              </div>
            </div>

            {/* Total Debits */}
            <div className="stat-item" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="stat-label">Outflow Debits (-)</span>
                <ArrowUpRightIcon size={16} style={{ color: '#EF4444' }} />
              </div>
              <div className="stat-value" style={{ color: '#EF4444', fontSize: '20px' }}>
                -{summary.formattedTotalDebit || formatINR(summary.totalDebit || 0)}
              </div>
              <div style={{ fontSize: '11px', color: '#A9BDD7', marginTop: '4px' }}>
                {summary.counts?.totalTransactions || 0} total transactions
              </div>
            </div>

            {/* Net Flow */}
            <div className="stat-item">
              <span className="stat-label">Net Financial Impact</span>
              <div
                className="stat-value"
                style={{
                  fontSize: '20px',
                  color: (summary.netAmount || 0) >= 0 ? '#10B981' : '#EF4444'
                }}
              >
                {(summary.netAmount || 0) >= 0 ? '+' : ''}
                {formatINR(summary.netAmount || 0)}
              </div>
              <div style={{ fontSize: '11px', color: '#A9BDD7', marginTop: '4px' }}>Period: {summary.period}</div>
            </div>

            {/* Success Rate */}
            <div className="stat-item">
              <span className="stat-label">Execution Status</span>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '12px' }}>
                <span style={{ color: '#10B981' }}>✓ {summary.counts?.successfulTransactions || 0}</span>
                <span style={{ color: '#F59E0B' }}>⏳ {summary.counts?.pendingTransactions || 0}</span>
                <span style={{ color: '#EF4444' }}>✕ {summary.counts?.failedTransactions || 0}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#A9BDD7', marginTop: '6px' }}>Settlement integrity</div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="dashboard-card" style={{ marginTop: '20px', padding: '16px 20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Keyword Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 220px', minWidth: '200px', background: '#071426', border: '1px solid #17385D', borderRadius: '8px', padding: '0 12px', height: '40px' }}>
            <SearchIcon size={16} style={{ color: '#A9BDD7' }} />
            <input
              type="text"
              placeholder="Search by description or transaction reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#FFFFFF', width: '100%', fontSize: '13px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', flex: '1 1 auto' }}>
            {/* Type Selector */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              style={{ background: '#071426', border: '1px solid #17385D', color: '#FFFFFF', borderRadius: '8px', height: '40px', padding: '0 10px', fontSize: '13px', flex: '1 1 120px' }}
            >
              <option value="all">All Types</option>
              <option value="credit">Credits Inflow (+)</option>
              <option value="debit">Debits Outflow (-)</option>
            </select>

            {/* Status Selector */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{ background: '#071426', border: '1px solid #17385D', color: '#FFFFFF', borderRadius: '8px', height: '40px', padding: '0 10px', fontSize: '13px', flex: '1 1 120px' }}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            <button
              type="submit"
              className="auth-button"
              style={{ width: 'auto', padding: '0 16px', height: '40px', fontSize: '13px', margin: 0, flex: '1 1 100px' }}
            >
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* Transactions List Table */}
      <div className="dashboard-card" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HistoryIcon size={18} style={{ color: '#00A8FF' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
              Transaction Statement Records
            </h3>
          </div>
          <span style={{ fontSize: '12px', color: '#A9BDD7' }}>
            Total: {pagination.totalRecords || 0} entries
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#A9BDD7' }}>
            Loading statement records...
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', background: '#071426', borderRadius: '10px', border: '1px dashed #17385D' }}>
            <p style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '600', margin: 0 }}>No Transactions Found</p>
            <p style={{ color: '#A9BDD7', fontSize: '12px', margin: '4px 0 0' }}>
              No transaction matched your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #17385D', color: '#A9BDD7', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 14px' }}>Status</th>
                  <th style={{ padding: '12px 14px' }}>Description / Type</th>
                  <th style={{ padding: '12px 14px' }}>Transaction ID</th>
                  <th style={{ padding: '12px 14px' }}>Method</th>
                  <th style={{ padding: '12px 14px' }}>Date</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => {
                  const isCredit = t.entryType === 'credit';
                  let statusColor = '#10B981';
                  let statusBg = 'rgba(16, 185, 129, 0.12)';
                  if (t.status === 'pending') {
                    statusColor = '#F59E0B';
                    statusBg = 'rgba(245, 158, 11, 0.12)';
                  } else if (t.status === 'failed') {
                    statusColor = '#EF4444';
                    statusBg = 'rgba(239, 68, 68, 0.12)';
                  }

                  return (
                    <tr
                      key={t.id}
                      style={{ borderBottom: '1px solid rgba(35, 55, 80, 0.4)', transition: 'background 0.2s' }}
                    >
                      {/* Status */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: statusBg, color: statusColor, padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
                          ● {t.status}
                        </span>
                      </td>

                      {/* Description / Type */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ color: '#FFFFFF', fontWeight: '600' }}>
                          {t.description || t.transactionType}
                        </div>
                        <div style={{ fontSize: '11px', color: '#A9BDD7', textTransform: 'capitalize' }}>
                          {t.transactionType?.replace('_', ' ')}
                        </div>
                      </td>

                      {/* ID / Ref */}
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '12px', color: '#00A8FF' }}>
                        {t.referenceNumber || `#TXN-${t.id}`}
                      </td>

                      {/* Payment Method */}
                      <td style={{ padding: '12px 14px', color: '#A9BDD7', textTransform: 'capitalize' }}>
                        {t.paymentMethod || 'Wallet'}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '12px 14px', color: '#A9BDD7', whiteSpace: 'nowrap' }}>
                        {t.createdAt ? new Date(t.createdAt).toLocaleString('en-IN') : 'N/A'}
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700', color: isCredit ? '#10B981' : '#EF4444', whiteSpace: 'nowrap' }}>
                        {isCredit ? '+' : '-'}{t.formattedAmount || formatINR(t.amount)}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleViewDetails(t.id)}
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
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginTop: '18px', paddingTop: '12px', borderTop: '1px solid #17385D' }}>
                <span style={{ fontSize: '12px', color: '#A9BDD7' }}>
                  Showing Page {pagination.page} of {pagination.totalPages} ({pagination.totalRecords} records)
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    disabled={!pagination.hasPrevPage}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    style={{
                      background: '#071426',
                      border: '1px solid #17385D',
                      color: pagination.hasPrevPage ? '#FFFFFF' : '#475569',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '12px',
                      cursor: pagination.hasPrevPage ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Previous
                  </button>
                  <button
                    disabled={!pagination.hasNextPage}
                    onClick={() => setPage((p) => p + 1)}
                    style={{
                      background: '#071426',
                      border: '1px solid #17385D',
                      color: pagination.hasNextPage ? '#FFFFFF' : '#475569',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '12px',
                      cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTxn && (
        <div className="modal-overlay" onClick={() => setSelectedTxn(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HistoryIcon size={18} style={{ color: '#00A8FF' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                  Transaction Receipt Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedTxn(null)}
                style={{ background: 'transparent', border: 'none', color: '#A9BDD7', cursor: 'pointer' }}
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Receipt Header */}
              <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid #17385D' }}>
                <div style={{ fontSize: '28px', fontWeight: '800', color: selectedTxn.entryType === 'credit' ? '#10B981' : '#EF4444' }}>
                  {selectedTxn.entryType === 'credit' ? '+' : '-'}{selectedTxn.formattedAmount || formatINR(selectedTxn.amount)}
                </div>
                <div style={{ fontSize: '13px', color: '#A9BDD7', marginTop: '4px' }}>
                  {selectedTxn.description || 'Transaction Transfer'}
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: '8px',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    background: selectedTxn.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: selectedTxn.status === 'completed' ? '#10B981' : '#F59E0B'
                  }}
                >
                  ● Status: {selectedTxn.status}
                </span>
              </div>

              {/* Data Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #071426', paddingBottom: '6px' }}>
                  <span style={{ color: '#A9BDD7' }}>Transaction ID:</span>
                  <span style={{ color: '#FFFFFF', fontFamily: 'monospace' }}>#{selectedTxn.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #071426', paddingBottom: '6px' }}>
                  <span style={{ color: '#A9BDD7' }}>Provider Reference:</span>
                  <span style={{ color: '#00A8FF', fontFamily: 'monospace' }}>{selectedTxn.providerReference || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #071426', paddingBottom: '6px' }}>
                  <span style={{ color: '#A9BDD7' }}>Type:</span>
                  <span style={{ color: '#FFFFFF', textTransform: 'capitalize' }}>{selectedTxn.transactionType?.replace('_', ' ')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #071426', paddingBottom: '6px' }}>
                  <span style={{ color: '#A9BDD7' }}>Payment Method:</span>
                  <span style={{ color: '#FFFFFF', textTransform: 'uppercase' }}>{selectedTxn.paymentMethod || 'Wallet'}</span>
                </div>

                {/* Bank Details if present */}
                {selectedTxn.bankDetails && (
                  <div style={{ background: '#071426', padding: '10px 12px', borderRadius: '8px', border: '1px solid #17385D', marginTop: '4px' }}>
                    <div style={{ color: '#00A8FF', fontWeight: '600', fontSize: '12px', marginBottom: '4px' }}>Bank Information</div>
                    <div style={{ color: '#FFFFFF' }}>Bank: {selectedTxn.bankDetails.bankName}</div>
                    <div style={{ color: '#A9BDD7', fontSize: '12px' }}>A/C: ••••{selectedTxn.bankDetails.accountLast4} • IFSC: {selectedTxn.bankDetails.ifscCode}</div>
                  </div>
                )}

                {/* Transfer Details if present */}
                {selectedTxn.transferDetails && (
                  <div style={{ background: '#071426', padding: '10px 12px', borderRadius: '8px', border: '1px solid #17385D', marginTop: '4px' }}>
                    <div style={{ color: '#10B981', fontWeight: '600', fontSize: '12px', marginBottom: '4px' }}>UPI Transfer Details</div>
                    <div style={{ color: '#FFFFFF' }}>Receiver UPI: {selectedTxn.transferDetails.receiverUpiId}</div>
                    <div style={{ color: '#A9BDD7', fontSize: '12px' }}>Status: {selectedTxn.transferDetails.status}</div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #071426', paddingBottom: '6px' }}>
                  <span style={{ color: '#A9BDD7' }}>Date & Time:</span>
                  <span style={{ color: '#FFFFFF' }}>{selectedTxn.createdAt ? new Date(selectedTxn.createdAt).toLocaleString('en-IN') : 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  const txnCode = selectedTxn.transaction_id || selectedTxn.id;
                  navigate(`/app/disputes?tab=raise&txnId=${txnCode}`);
                }}
                style={{
                  background: 'rgba(255, 107, 107, 0.15)',
                  border: '1px solid rgba(255, 107, 107, 0.35)',
                  color: '#FF6B6B',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                ⚠️ Raise Dispute / Claim
              </button>
              <button
                onClick={() => setSelectedTxn(null)}
                className="auth-button"
                style={{ width: 'auto', padding: '0 20px', height: '36px', fontSize: '13px', margin: 0 }}
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CustomerTransactionsPage;

