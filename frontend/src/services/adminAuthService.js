import api from './api';

export const adminAuthService = {
  // 1. Admin Login
  login: async (payload) => {
    // payload: { email, password }
    const response = await api.post('/admin/auth/login', payload);
    return response.data;
  },

  // 2. Admin Logout
  logout: async (refreshToken) => {
    const token = typeof refreshToken === 'string' ? refreshToken : refreshToken?.refreshToken || refreshToken?.token;
    const response = await api.post('/admin/auth/logout', { refreshToken: token });
    return response.data;
  },

  // 3. Send Admin OTP
  sendOtp: async (payload) => {
    // payload: { email, purpose }
    const response = await api.post('/admin/auth/send-otp', payload);
    return response.data;
  },

  // 4. Verify Admin OTP
  verifyOtp: async (payload) => {
    // payload: { email, otp, purpose }
    const response = await api.post('/admin/auth/verify-otp', payload);
    return response.data;
  },

  // 5. Refresh Admin Token
  refresh: async (refreshToken) => {
    const token = typeof refreshToken === 'string' ? refreshToken : refreshToken?.refreshToken || refreshToken?.token;
    const response = await api.post('/admin/auth/refresh', { refreshToken: token });
    return response.data;
  },

  // 6. Admin Forgot Password
  forgotPassword: async (email) => {
    const emailVal = typeof email === 'string' ? email : email?.email;
    const response = await api.post('/admin/auth/forgot-password', { email: emailVal });
    return response.data;
  },

  // 7. Admin Reset Password
  resetPassword: async (payload) => {
    // payload: { token, newPassword }
    const response = await api.post('/admin/auth/reset-password', payload);
    return response.data;
  },

  // 8. Admin Change Password (Protected)
  changePassword: async (payload) => {
    // payload: { currentPassword, newPassword }
    const response = await api.post('/admin/auth/change-password', payload);
    return response.data;
  },

  // 9. Admin Profile (Protected)
  getProfile: async () => {
    const response = await api.get('/admin/auth/profile');
    return response.data;
  }
};

export default adminAuthService;

