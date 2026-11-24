import api from './api';

const wealthService = {
  // Wealth Dashboard
  getWealthDashboard: async () => {
    const res = await api.get('/admin/wealth/dashboard');
    return res.data;
  },

  // Mutual Funds
  getMutualFunds: async (params = {}) => {
    const res = await api.get('/admin/wealth/mutual-funds', { params });
    return res.data;
  },

  updateMutualFundStatus: async (id, status) => {
    const res = await api.put(`/admin/wealth/mutual-funds/${id}/status`, { status });
    return res.data;
  },

  // SIP Management
  getSipManagementData: async (params = {}) => {
    const res = await api.get('/admin/wealth/sip', { params });
    return res.data;
  },

  updateSipStatus: async (id, action) => {
    const res = await api.put(`/admin/wealth/sip/${id}/status`, { action });
    return res.data;
  },

  // Investment Transactions
  getInvestmentTransactions: async (params = {}) => {
    const res = await api.get('/admin/wealth/transactions', { params });
    return res.data;
  },

  // Loan Management
  getLoanDashboard: async () => {
    const res = await api.get('/admin/loans/dashboard');
    return res.data;
  },

  getLoanApplications: async (params = {}) => {
    const res = await api.get('/admin/loans/applications', { params });
    return res.data;
  },

  getLoanApplicationDetails: async (id) => {
    const res = await api.get(`/admin/loans/applications/${id}`);
    return res.data;
  },

  updateLoanApplicationStatus: async (id, data) => {
    const res = await api.put(`/admin/loans/applications/${id}/status`, data);
    return res.data;
  },

  getLoanProducts: async () => {
    const res = await api.get('/admin/loans/products');
    return res.data;
  },

  getLoanRepayments: async () => {
    const res = await api.get('/admin/loans/repayments');
    return res.data;
  },

  getLenderPartners: async () => {
    const res = await api.get('/admin/loans/lenders');
    return res.data;
  },

  // Credit Score Management
  getCreditDashboard: async () => {
    const res = await api.get('/admin/credit/dashboard');
    return res.data;
  },

  getCreditScoreRequests: async (params = {}) => {
    const res = await api.get('/admin/credit/requests', { params });
    return res.data;
  },

  getCreditScoreDetails: async (id) => {
    const res = await api.get(`/admin/credit/requests/${id}`);
    return res.data;
  },

  getCreditScoreHistory: async () => {
    const res = await api.get('/admin/credit/history');
    return res.data;
  },

  getCreditBureauPartners: async () => {
    const res = await api.get('/admin/credit/bureaus');
    return res.data;
  },

  // Unified Partner Management
  getUnifiedPartners: async () => {
    const res = await api.get('/admin/partners');
    return res.data;
  }
};

export default wealthService;
