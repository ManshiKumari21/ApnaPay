import api from './api';

const walletService = {
  // 1. GET /api/wallet - Full Wallet Overview
  getOverview: async () => {
    const response = await api.get('/wallet');
    return response.data;
  },

  // 2. GET /api/wallet/balance - Quick Balance Check
  getBalance: async () => {
    const response = await api.get('/wallet/balance');
    return response.data;
  },

  // 3. GET /api/wallet/ledger - Paginated Ledger Entries (Debits & Credits)
  getLedger: async (params = {}) => {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
    if (params.type && params.type !== 'all') cleanParams.type = params.type;
    if (params.startDate) cleanParams.startDate = params.startDate;
    if (params.endDate) cleanParams.endDate = params.endDate;
    if (params.sort) cleanParams.sort = params.sort;

    const response = await api.get('/wallet/ledger', { params: cleanParams });
    return response.data;
  },

  // 4. GET /api/wallet/summary - Financial Metrics & Periodic Flow
  getSummary: async (period = 'all') => {
    const response = await api.get('/wallet/summary', {
      params: period && period !== 'all' ? { period } : {}
    });
    return response.data;
  },

  // 5. GET /api/wallet/limits - KYC Tier & Dynamic Transaction Limits
  getLimits: async () => {
    const response = await api.get('/wallet/limits');
    return response.data;
  }
};

export default walletService;

