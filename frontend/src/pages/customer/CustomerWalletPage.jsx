import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  WalletIcon,
  TrendingUpIcon,
  ShieldIcon,
  RefreshCwIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  FilterIcon
} from '../../components/Icons';
import walletService from '../../services/walletService';

const CustomerWalletPage = () => {
  const [overview, setOverview] = useState(null);
  const [limits, setLimits] = useState(null);
  const [summary, setSummary] = useState(null);
  const [ledgerData, setLedgerData] = useState({ ledger: [], pagination: {} });

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filters & Pagination for Ledger
  const [ledgerType, setLedgerType] = useState('all');
  const [ledgerPage, setLedgerPage] = useState(1);
  const [summaryPeriod, setSummaryPeriod] = useState('all');

  // Load Wallet Overview & Limits
  const loadWalletMeta = async () => {
    setLoadingOverview(true);
    setErrorMsg('');
    try {
      const [ovRes, limRes, sumRes] = await Promise.all([
        walletService.getOverview().catch((err) => ({ error: err.response?.data?.message || 'Could not load overview' })),
        walletService.getLimits().catch(() => ({ data: null })),
        walletService.getSummary(summaryPeriod).catch(() => ({ data: null }))
      ]);

      if (ovRes.error) {
        setErrorMsg(ovRes.error);
      } else {
        setOverview(ovRes.data || null);
      }
      setLimits(limRes?.data || null);
      setSummary(sumRes?.data || null);
    } catch (err) {
      setErrorMsg('Failed to connect to wallet service.');
    } finally {
      setLoadingOverview(false);
    }
  };

  // Load Ledger Entries
  const loadLedgerEntries = async (page = 1, type = ledgerType) => {
    setLoadingLedger(true);
    try {
      const res = await walletService.getLedger({ page, limit: 10, type });
      setLedgerData(res.data || { ledger: [], pagination: {} });
    } catch (_) {
      setLedgerData({ ledger: [], pagination: {} });
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    loadWalletMeta();
  }, [summaryPeriod]);

  useEffect(() => {
    loadLedgerEntries(ledgerPage, ledgerType);
  }, [ledgerPage, ledgerType]);

  const handleRefreshAll = () => {
    loadWalletMeta();
    loadLedgerEntries(ledgerPage, ledgerType);
  };

  const handleTypeChange = (newType) => {
    setLedgerType(newType);
    setLedgerPage(1);
  };

  const formatINR = (val) => {
    const num = parseFloat(val) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <DashboardLayout
      title="Wallet & Ledger"
      subtitle="Inspect your available balance, RBI compliance limits, and debit/credit ledger records"
      backFallback="/app"
      onRefresh={handleRefreshAll}
    >
      {errorMsg && (
        <div className="auth-alert error" style={{ marginBottom: '20px' }}>
          <AlertCircleIcon size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Top Banner: Available Balance & KYC Tier */}
      <div
        className="dashboard-card"
        style={{
          background: 'linear-gradient(135deg, rgba(22, 119, 255, 0.22) 0%, rgba(10, 20, 34, 0.98) 100%)',
          borderColor: '#17385D',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00A8FF', fontSize: '12px', fontWeight: '700', letterSpacing: '0.8px', marginBottom: '8px' }}>
              <WalletIcon size={16} />
              <span>APNAPAY SECURE ESCROW WALLET</span>
            </div>
            <div style={{ fontSize: '13px', color: '#A9BDD7' }}>Available Balance</div>
            <div style={{ fontSize: '36px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.5px', marginTop: '4px' }}>
              {loadingOverview ? '₹...' : overview?.formattedBalance || formatINR(overview?.balance || 0)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <span className={`sidebar-badge ${overview?.status === 'active' ? 'green' : 'yellow'}`}>
                ● Status: {overview?.status || 'Active'}
              </span>
              <span className="sidebar-badge blue">
                Currency: {overview?.currency || 'INR'}
              </span>
              {overview?.walletId && (
                <span style={{ fontSize: '11px', color: '#A9BDD7' }}>
                  Wallet A/C: #WLT-{overview.walletId}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ background: '#071426', border: '1px solid #17385D', borderRadius: '12px', padding: '12px 18px', textAlign: 'left' }}>
              <div style={{ fontSize: '11px', color: '#A9BDD7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                KYC Compliance Tier
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: limits?.isVerified ? '#10B981' : '#F59E0B', marginTop: '2px' }}>
                {limits?.tierName || (limits?.isVerified ? 'Full KYC Verified' : 'Minimum KYC')}
              </div>
              <div style={{ fontSize: '11px', color: '#647B9C', marginTop: '4px' }}>
                Max Capacity: {formatINR(limits?.limits?.maxBalance || 10000)}
              </div>
            </div>

            <button
              onClick={handleRefreshAll}
              className="auth-button secondary"
              style={{ width: 'auto', padding: '0 16px', height: '36px', fontSize: '12px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCwIcon size={14} />
              <span>Sync Balance</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Limits & Utilization Card */}
      {limits?.limits && (
        <div className="dashboard-card" style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldIcon size={18} style={{ color: '#00A8FF' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                Transaction & Velocity Limits
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircleIcon size={14} />
              RBI Compliant
            </span>
          </div>

          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {/* Per Transaction */}
            <div className="stat-item">
              <span className="stat-label">Per-Transaction Limit</span>
              <div className="stat-value" style={{ fontSize: '18px', color: '#FFFFFF' }}>
                {formatINR(limits.limits.perTransactionLimit)}
              </div>
              <div style={{ fontSize: '11px', color: '#A9BDD7', marginTop: '4px' }}>Single transfer ceiling</div>
            </div>

            {/* Daily Limit */}
            <div className="stat-item">
              <span className="stat-label">Daily Outflow Limit</span>
              <div className="stat-value" style={{ fontSize: '18px', color: '#00A8FF' }}>
                {formatINR(limits.limits.dailyLimit)}
              </div>
              <div style={{ fontSize: '11px', color: '#10B981', marginTop: '4px' }}>
                Remaining: {formatINR(limits.usage?.dailyRemaining || 0)}
              </div>
            </div>

            {/* Monthly Limit */}
            <div className="stat-item">
              <span className="stat-label">Monthly Velocity Limit</span>
              <div className="stat-value" style={{ fontSize: '18px', color: '#F59E0B' }}>
                {formatINR(limits.limits.monthlyLimit)}
              </div>
              <div style={{ fontSize: '11px', color: '#10B981', marginTop: '4px' }}>
                Remaining: {formatINR(limits.usage?.monthlyRemaining || 0)}
              </div>
            </div>

            {/* Capacity Remaining */}
            <div className="stat-item">
              <span className="stat-label">Deposit Headroom</span>
              <div className="stat-value" style={{ fontSize: '18px', color: '#10B981' }}>
                {formatINR(limits.usage?.walletCapacityRemaining || 0)}
              </div>
              <div style={{ fontSize: '11px', color: '#A9BDD7', marginTop: '4px' }}>Allowed inflow</div>
            </div>
          </div>
        </div>
      )}

      {/* Financial Summary & Cashflow */}
      <div className="dashboard-card" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUpIcon size={18} style={{ color: '#10B981' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
              Financial Flow Summary
            </h3>
          </div>

          {/* Period Filter Buttons */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Lifetime' },
              { id: 'today', label: 'Today' },
              { id: 'weekly', label: 'Last 7 Days' },
              { id: 'monthly', label: 'This Month' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSummaryPeriod(p.id)}
                style={{
                  background: summaryPeriod === p.id ? 'var(--primary-blue)' : '#071426',
                  color: summaryPeriod === p.id ? '#ffffff' : '#A9BDD7',
                  border: '1px solid #17385D',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: summaryPeriod === p.id ? '600' : '400',
                  transition: 'all 0.2s'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {summary && (
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {/* Total Credit */}
            <div className="stat-item" style={{ background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="stat-label">Total Credits (+)</span>
                <ArrowDownLeftIcon size={16} style={{ color: '#10B981' }} />
              </div>
              <div className="stat-value" style={{ color: '#10B981', fontSize: '20px' }}>
                +{formatINR(summary.periodSummary?.periodCredit ?? summary.lifetimeSummary?.totalCredit ?? 0)}
              </div>
              <div style={{ fontSize: '11px', color: '#A9BDD7', marginTop: '4px' }}>
                {summary.periodSummary?.creditCount ?? summary.lifetimeSummary?.creditCount ?? 0} credit inflows
              </div>
            </div>

            {/* Total Debit */}
            <div className="stat-item" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="stat-label">Total Debits (-)</span>
                <ArrowUpRightIcon size={16} style={{ color: '#EF4444' }} />
              </div>
              <div className="stat-value" style={{ color: '#EF4444', fontSize: '20px' }}>
                -{formatINR(summary.periodSummary?.periodDebit ?? summary.lifetimeSummary?.totalDebit ?? 0)}
              </div>
              <div style={{ fontSize: '11px', color: '#A9BDD7', marginTop: '4px' }}>
                {summary.periodSummary?.debitCount ?? summary.lifetimeSummary?.debitCount ?? 0} debit outflows
              </div>
            </div>

            {/* Net Flow */}
            <div className="stat-item">
              <span className="stat-label">Net Financial Flow</span>
              <div
                className="stat-value"
                style={{
                  fontSize: '20px',
                  color: (summary.periodSummary?.periodNetFlow ?? summary.lifetimeSummary?.netFlow ?? 0) >= 0 ? '#10B981' : '#EF4444'
                }}
              >
                {(summary.periodSummary?.periodNetFlow ?? summary.lifetimeSummary?.netFlow ?? 0) >= 0 ? '+' : ''}
                {formatINR(summary.periodSummary?.periodNetFlow ?? summary.lifetimeSummary?.netFlow ?? 0)}
              </div>
              <div style={{ fontSize: '11px', color: '#A9BDD7', marginTop: '4px' }}>Balance impact</div>
            </div>

            {/* Total Transactions */}
            <div className="stat-item">
              <span className="stat-label">Total Operations</span>
              <div className="stat-value" style={{ fontSize: '20px', color: '#00A8FF' }}>
                {summary.periodSummary?.totalTransactions ?? summary.lifetimeSummary?.totalTransactions ?? 0}
              </div>
              <div style={{ fontSize: '11px', color: '#A9BDD7', marginTop: '4px' }}>Ledger audit entries</div>
            </div>
          </div>
        )}
      </div>

      {/* Debit & Credit Ledger Table */}
      <div className="dashboard-card" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WalletIcon size={18} style={{ color: '#00A8FF' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
              Debit & Credit Ledger Entries
            </h3>
          </div>

          {/* Type Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Entries' },
              { id: 'credit', label: 'Credits Only' },
              { id: 'debit', label: 'Debits Only' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => handleTypeChange(t.id)}
                style={{
                  background: ledgerType === t.id ? '#087BFF' : '#071426',
                  color: ledgerType === t.id ? '#ffffff' : '#A9BDD7',
                  border: '1px solid #17385D',
                  borderRadius: '16px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: ledgerType === t.id ? '600' : '400',
                  transition: 'all 0.2s'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loadingLedger ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#A9BDD7' }}>
            Loading ledger entries...
          </div>
        ) : !ledgerData.ledger || ledgerData.ledger.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', background: '#071426', borderRadius: '10px', border: '1px dashed #17385D' }}>
            <p style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: '600', margin: 0 }}>No Ledger Entries Found</p>
            <p style={{ color: '#A9BDD7', fontSize: '12px', margin: '4px 0 0' }}>
              Transactions matching the selected filter ({ledgerType}) will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #17385D', color: '#A9BDD7', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 14px' }}>Type</th>
                  <th style={{ padding: '12px 14px' }}>Description</th>
                  <th style={{ padding: '12px 14px' }}>Reference</th>
                  <th style={{ padding: '12px 14px' }}>Date & Time</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Balance After</th>
                </tr>
              </thead>
              <tbody>
                {ledgerData.ledger.map((entry) => {
                  const isCredit = entry.entryType === 'credit';
                  return (
                    <tr
                      key={entry.id}
                      style={{ borderBottom: '1px solid rgba(35, 55, 80, 0.4)', transition: 'background 0.2s' }}
                    >
                      {/* Entry Type */}
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: isCredit ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: isCredit ? '#10B981' : '#EF4444',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            textTransform: 'uppercase'
                          }}
                        >
                          {isCredit ? <ArrowDownLeftIcon size={12} /> : <ArrowUpRightIcon size={12} />}
                          {entry.entryType}
                        </span>
                      </td>

                      {/* Description */}
                      <td style={{ padding: '12px 14px', color: '#FFFFFF', fontWeight: '500' }}>
                        {entry.description || 'Ledger Operation'}
                      </td>

                      {/* Reference */}
                      <td style={{ padding: '12px 14px', color: '#A9BDD7', fontFamily: 'monospace', fontSize: '12px' }}>
                        {entry.referenceNumber || `#TXN-${entry.id}`}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '12px 14px', color: '#A9BDD7', whiteSpace: 'nowrap' }}>
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString('en-IN') : 'N/A'}
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700', color: isCredit ? '#10B981' : '#EF4444', whiteSpace: 'nowrap' }}>
                        {isCredit ? '+' : '-'}{entry.formattedAmount || formatINR(entry.amount)}
                      </td>

                      {/* Balance After */}
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#FFFFFF', fontWeight: '600', whiteSpace: 'nowrap' }}>
                        {entry.formattedBalanceAfter || formatINR(entry.balanceAfter)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {ledgerData.pagination?.totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginTop: '18px', paddingTop: '12px', borderTop: '1px solid #17385D' }}>
                <span style={{ fontSize: '12px', color: '#A9BDD7' }}>
                  Showing Page {ledgerData.pagination.page} of {ledgerData.pagination.totalPages} ({ledgerData.pagination.totalRecords} records)
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    disabled={!ledgerData.pagination.hasPrevPage}
                    onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
                    style={{
                      background: '#071426',
                      border: '1px solid #17385D',
                      color: ledgerData.pagination.hasPrevPage ? '#FFFFFF' : '#475569',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '12px',
                      cursor: ledgerData.pagination.hasPrevPage ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Previous
                  </button>
                  <button
                    disabled={!ledgerData.pagination.hasNextPage}
                    onClick={() => setLedgerPage((p) => p + 1)}
                    style={{
                      background: '#071426',
                      border: '1px solid #17385D',
                      color: ledgerData.pagination.hasNextPage ? '#FFFFFF' : '#475569',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '12px',
                      cursor: ledgerData.pagination.hasNextPage ? 'pointer' : 'not-allowed'
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
    </DashboardLayout>
  );
};

export default CustomerWalletPage;

