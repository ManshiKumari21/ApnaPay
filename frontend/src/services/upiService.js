import api from './api';

const upiService = {
  // 1. GET /upi/handles - List UPI handles
  getUpiHandles: async () => {
    const res = await api.get('/upi/handles');
    return res.data;
  },

  // 2. POST /upi/handles - Register / request UPI handle
  createUpiHandle: async ({ upiId, handle, bankAccountId, isPrimary }) => {
    const res = await api.post('/upi/handles', {
      upiId: upiId || handle,
      bankAccountId,
      isPrimary
    });
    return res.data;
  },

  // 3. DELETE /upi/handles/:id - Delete UPI handle
  deleteUpiHandle: async (id) => {
    const res = await api.delete(`/upi/handles/${id}`);
    return res.data;
  }
};

export default upiService;

