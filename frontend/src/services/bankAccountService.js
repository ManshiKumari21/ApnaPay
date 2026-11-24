import api from './api';

const bankAccountService = {
  // 1. GET /bank-accounts - List linked accounts
  getLinkedAccounts: async () => {
    const res = await api.get('/bank-accounts');
    return res.data;
  },

  // 2. POST /bank-accounts/link - Initiate bank linking
  linkAccount: async ({ bankName, accountNumber, confirmAccountNumber, ifscCode, accountHolderName, isPrimary, deliveryMethod = 'sms' }) => {
    const res = await api.post('/bank-accounts/link', {
      bankName,
      accountNumber,
      confirmAccountNumber,
      ifscCode,
      accountHolderName,
      isPrimary,
      deliveryMethod
    });
    return res.data;
  },

  // 3. POST /bank-accounts/verify - Verify bank linking
  verifyAccount: async ({ bankAccountId, otp }) => {
    const res = await api.post('/bank-accounts/verify', {
      bankAccountId,
      otp
    });
    return res.data;
  },

  // 4. POST /bank-accounts/resend-otp - Resend verification OTP
  resendOtp: async (bankAccountId, deliveryMethod = 'sms') => {
    const res = await api.post('/bank-accounts/resend-otp', {
      bankAccountId,
      deliveryMethod
    });
    return res.data;
  },

  // 5. DELETE /bank-accounts/:id - Unlink bank account
  unlinkAccount: async (id) => {
    const res = await api.delete(`/bank-accounts/${id}`);
    return res.data;
  },

  // 6. PATCH /bank-accounts/:id/primary - Set primary account
  setPrimaryAccount: async (id) => {
    const res = await api.patch(`/bank-accounts/${id}/primary`);
    return res.data;
  }
};

export default bankAccountService;

