import api from './api';

export const userAuthService = {
  // Customer OTP Login: Step 1 Lookup Mobile Number
  loginLookupPhone: async (phone) => {
    const response = await api.post('/auth/login/lookup-phone', { phone });
    return response.data;
  },

  // Customer OTP Login: Step 2 & 3 Send Login OTP
  loginSendOtp: async (payload) => {
    // payload: { phone, email, deliveryMethod }
    const response = await api.post('/auth/login/send-otp', payload);
    return response.data;
  },

  // Customer OTP Login: Step 4 Verify Login OTP
  loginVerifyOtp: async (payload) => {
    // payload: { phone, email, otp }
    const response = await api.post('/auth/login/verify-otp', payload);
    return response.data;
  },

  // 1. Send OTP
  sendOtp: async (payload) => {
    // payload: { email, phone, purpose }
    const response = await api.post('/auth/send-otp', payload);
    return response.data;
  },

  // 2. Verify OTP
  verifyOtp: async (payload) => {
    // payload: { email, phone, otp, purpose }
    const response = await api.post('/auth/verify-otp', payload);
    return response.data;
  },

  // 3. Register Account
  register: async (payload) => {
    // payload: { full_name, phone, email, password }
    const response = await api.post('/auth/register', payload);
    return response.data;
  },

  // 4. Login
  login: async (payload) => {
    // payload: { identifier (or email/phone), password }
    const response = await api.post('/auth/login', payload);
    return response.data;
  },

  // 5. Refresh Access Token
  refresh: async (refreshToken) => {
    const token = typeof refreshToken === 'string' ? refreshToken : refreshToken?.refreshToken || refreshToken?.token;
    const response = await api.post('/auth/refresh', { refreshToken: token });
    return response.data;
  },

  // 6. Logout
  logout: async (refreshToken) => {
    const token = typeof refreshToken === 'string' ? refreshToken : refreshToken?.refreshToken || refreshToken?.token;
    const response = await api.post('/auth/logout', { refreshToken: token });
    return response.data;
  },

  // 7. Forgot Password
  forgotPassword: async (email) => {
    const emailVal = typeof email === 'string' ? email : email?.email;
    const response = await api.post('/auth/forgot-password', { email: emailVal });
    return response.data;
  },

  // 8. Reset Password
  resetPassword: async (payload) => {
    // payload: { token, newPassword }
    const response = await api.post('/auth/reset-password', payload);
    return response.data;
  }
};

export default userAuthService;

