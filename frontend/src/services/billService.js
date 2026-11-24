import api from './api';

const billService = {
  // 1. GET /api/bills/categories - All active categories
  getCategories: async () => {
    const res = await api.get('/bills/categories');
    return res.data;
  },

  // 2. GET /api/bills/billers?category=... - Billers for a category
  getBillers: async (category, page = 1, limit = 50, search = '') => {
    const params = { category, page, limit };
    if (search) params.search = search;
    const res = await api.get('/bills/billers', { params });
    return res.data;
  },

  // 3. POST /api/bills/fetch - Fetch bill details by consumer number
  fetchBill: async ({ billerId, consumerNumber }) => {
    const res = await api.post('/bills/fetch', { billerId, consumerNumber });
    return res.data;
  },

  // 4. POST /api/bills/validate - Server-side verification before payment
  validateBill: async ({ fetchReferenceId, billAmount }) => {
    const res = await api.post('/bills/validate', { fetchReferenceId, billAmount });
    return res.data;
  },

  // 5. POST /api/bills/payments - Execute payment (DEMO or WALLET mode)
  payBill: async (payload) => {
    const res = await api.post('/bills/payments', payload);
    return res.data;
  },

  // 6. GET /api/bills/payments/:id - Single payment status & receipt
  getPaymentDetails: async (idOrTxnRef) => {
    const res = await api.get(`/bills/payments/${idOrTxnRef}`);
    return res.data;
  },

  // 7. GET /api/bills/history - User's payment history with filters
  getHistory: async (params = {}) => {
    const res = await api.get('/bills/history', { params });
    return res.data;
  },

  // 8. POST /api/bills/favorites - Save biller & consumer number
  saveFavorite: async ({ billerId, consumerNumber, nickname }) => {
    const res = await api.post('/bills/favorites', { billerId, consumerNumber, nickname });
    return res.data;
  },

  // 9. GET /api/bills/favorites - Retrieve saved favorite billers
  getFavorites: async () => {
    const res = await api.get('/bills/favorites');
    return res.data;
  },

  // 10. DELETE /api/bills/favorites/:id - Remove saved favorite
  deleteFavorite: async (id) => {
    const res = await api.delete(`/bills/favorites/${id}`);
    return res.data;
  }
};

export default billService;

