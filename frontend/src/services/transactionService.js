import api from './api';

const transactionService = {
  // 1. GET /api/transactions - Paginated Transaction History with Filters
  getTransactions: async (params = {}) => {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
    if (params.type && params.type !== 'all') cleanParams.type = params.type;
    if (params.status && params.status !== 'all') cleanParams.status = params.status;
    if (params.search && params.search.trim()) cleanParams.search = params.search.trim();
    if (params.startDate) cleanParams.startDate = params.startDate;
    if (params.endDate) cleanParams.endDate = params.endDate;
    if (params.sort) cleanParams.sort = params.sort;

    const response = await api.get('/transactions', { params: cleanParams });
    return response.data;
  },

  // 2. GET /api/transactions/:id - Detailed Transaction Metadata
  getTransactionById: async (id) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  // 3. GET /api/transactions/summary - Overall Debits, Credits, and Counts
  getSummary: async (period = 'all') => {
    const response = await api.get('/transactions/summary', {
      params: period && period !== 'all' ? { period } : {}
    });
    return response.data;
  },

  // 4. GET /api/transactions/export - Download Statement (CSV or PDF)
  exportStatement: async (format = 'csv', filters = {}) => {
    const cleanParams = { format };
    if (filters.type && filters.type !== 'all') cleanParams.type = filters.type;
    if (filters.status && filters.status !== 'all') cleanParams.status = filters.status;
    if (filters.startDate) cleanParams.startDate = filters.startDate;
    if (filters.endDate) cleanParams.endDate = filters.endDate;

    const response = await api.get('/transactions/export', {
      params: cleanParams,
      responseType: 'blob'
    });

    // Create browser download link for the blob
    const blob = new Blob([response.data], {
      type: format === 'pdf' ? 'application/pdf' : 'text/csv;charset=utf-8;'
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `apnapay_statement_${new Date().toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    return true;
  }
};

export default transactionService;

