import api from './api';

const landService = {
  // 1. GET /api/land/projects - Available Land Projects Marketplace
  getProjects: async (params = {}) => {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
    if (params.status && params.status !== 'all') cleanParams.status = params.status;
    if (params.search && params.search.trim()) cleanParams.search = params.search.trim();

    const response = await api.get('/land/projects', { params: cleanParams });
    return response.data;
  },

  // 2. GET /api/land/projects/:id - Project Details & Latest Appraisals
  getProjectById: async (id) => {
    const response = await api.get(`/land/projects/${id}`);
    return response.data;
  },

  // 3. GET /api/land/holdings - User Digital Land Portfolio
  getHoldings: async (params = {}) => {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;

    const response = await api.get('/land/holdings', { params: cleanParams });
    return response.data;
  },

  // 4. POST /api/land/orders - Create Purchase Order Request
  createOrder: async (orderData) => {
    const response = await api.post('/land/orders', orderData);
    return response.data;
  },

  // 5. GET /api/land/orders/:id - Specific Order Status & Details
  getOrderById: async (id) => {
    const response = await api.get(`/land/orders/${id}`);
    return response.data;
  },

  // 6. GET /api/land/transactions - Land Transactions Audit Log
  getTransactions: async (params = {}) => {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
    if (params.type && params.type !== 'all') cleanParams.type = params.type;
    if (params.status && params.status !== 'all') cleanParams.status = params.status;
    if (params.projectId) cleanParams.projectId = params.projectId;

    const response = await api.get('/land/transactions', { params: cleanParams });
    return response.data;
  },

  // 7. GET /api/land/valuations - Historical Valuations & Growth Jumps
  getValuations: async (params = {}) => {
    const cleanParams = {};
    if (params.projectId) cleanParams.projectId = params.projectId;
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;

    const response = await api.get('/land/valuations', { params: cleanParams });
    return response.data;
  },

  // 8. GET /api/land/orders - Logged-in Customer's Land Orders
  getUserOrders: async (params = {}) => {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
    if (params.status && params.status !== 'all') cleanParams.status = params.status;

    const response = await api.get('/land/orders', { params: cleanParams });
    return response.data;
  },

  // ==========================================
  // ADMIN DIGITAL LAND WORKFLOW METHODS
  // ==========================================

  // 9. GET /api/land/admin/orders - Admin Land Orders with Dashboard Counts
  getAdminOrders: async (params = {}) => {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
    if (params.status && params.status !== 'all') cleanParams.status = params.status;
    if (params.search && params.search.trim()) cleanParams.search = params.search.trim();

    const response = await api.get('/land/admin/orders', { params: cleanParams });
    return response.data;
  },

  // 10. GET /api/land/admin/orders/:id - Admin Single Order Details
  getAdminOrderById: async (id) => {
    const response = await api.get(`/land/admin/orders/${id}`);
    return response.data;
  },

  // 11. POST /api/land/admin/orders/:id/approve - Admin Approve Land Order
  approveOrder: async (id) => {
    const response = await api.post(`/land/admin/orders/${id}/approve`);
    return response.data;
  },

  // 12. POST /api/land/admin/orders/:id/reject - Admin Reject Land Order
  rejectOrder: async (id, reason) => {
    const response = await api.post(`/land/admin/orders/${id}/reject`, { reason });
    return response.data;
  }
};

export default landService;

