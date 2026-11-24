import api from "./api";

const disputeService = {
  // ==========================================
  // ADMIN PANEL METHODS
  // ==========================================
  getAdminStats: async () => {
    const res = await api.get("/admin/disputes/stats");
    return res.data;
  },

  getAdminDisputes: async (params = {}) => {
    const res = await api.get("/admin/disputes", { params });
    return res.data;
  },

  getAdminDisputeDetails: async (id) => {
    const res = await api.get(`/admin/disputes/${id}`);
    return res.data;
  },

  updateDisputeStatus: async (id, status, remarks = "") => {
    const res = await api.patch(`/admin/disputes/${id}/status`, { status, remarks });
    return res.data;
  },

  assignDispute: async (id, agent, priority) => {
    const res = await api.patch(`/admin/disputes/${id}/assign`, { agent, priority });
    return res.data;
  },

  addDisputeInternalNote: async (id, note) => {
    const res = await api.post(`/admin/disputes/${id}/notes`, { note });
    return res.data;
  },

  sendAdminMessage: async (id, message, isRequestInfo = false) => {
    const res = await api.post(`/admin/disputes/${id}/messages`, { message, isRequestInfo });
    return res.data;
  },

  // Admin Refunds
  getAdminRefunds: async (params = {}) => {
    const res = await api.get("/admin/refunds", { params });
    return res.data;
  },

  approveRefund: async (id) => {
    const res = await api.post(`/admin/refunds/${id}/approve`);
    return res.data;
  },

  rejectRefund: async (id, reason) => {
    const res = await api.post(`/admin/refunds/${id}/reject`, { reason });
    return res.data;
  },

  initiateRefund: async (id, idempotencyKey = "") => {
    const res = await api.post(`/admin/refunds/${id}/initiate`, { idempotencyKey });
    return res.data;
  },

  retryRefund: async (id) => {
    const res = await api.post(`/admin/refunds/${id}/retry`);
    return res.data;
  },

  getAdminReports: async (type = "disputes") => {
    const res = await api.get("/admin/disputes/reports", { params: { type } });
    return res.data;
  },

  // ==========================================
  // USER PANEL METHODS
  // ==========================================
  getUserStats: async () => {
    const res = await api.get("/disputes/stats");
    return res.data;
  },

  getEligibleTransactions: async () => {
    const res = await api.get("/disputes/eligible-transactions");
    return res.data;
  },

  createDispute: async (disputeData) => {
    const res = await api.post("/disputes", disputeData);
    return res.data;
  },

  getUserDisputes: async (params = {}) => {
    const res = await api.get("/disputes/my-disputes", { params });
    return res.data;
  },

  getUserDisputeDetails: async (id) => {
    const res = await api.get(`/disputes/tracking/${id}`);
    return res.data;
  },

  uploadUserEvidence: async (id, evidenceData) => {
    const res = await api.post(`/disputes/${id}/evidence`, evidenceData);
    return res.data;
  },

  sendUserReply: async (id, message) => {
    const res = await api.post(`/disputes/${id}/reply`, { message });
    return res.data;
  },

  getUserRefunds: async (params = {}) => {
    const res = await api.get("/refunds/my-refunds", { params });
    return res.data;
  },

  getUserRefundDetails: async (id) => {
    const res = await api.get(`/refunds/${id}`);
    return res.data;
  }
};

export default disputeService;
