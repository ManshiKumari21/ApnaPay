import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Request Interceptor: Attach correct token based on route
api.interceptors.request.use(
  (config) => {
    const isAdminRoute = config.url?.includes('/admin/');
    
    if (isAdminRoute) {
      const adminToken = localStorage.getItem('apnapay_admin_token');
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      } else {
        const userToken = localStorage.getItem('apnapay_token');
        if (userToken) {
          config.headers.Authorization = `Bearer ${userToken}`;
        }
      }
    } else {
      const userToken = localStorage.getItem('apnapay_token');
      const adminToken = localStorage.getItem('apnapay_admin_token');
      const effectiveToken = userToken || adminToken;
      if (effectiveToken) {
        config.headers.Authorization = `Bearer ${effectiveToken}`;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format error messages
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Don't loop refresh requests
    if (originalRequest?.url?.includes('/refresh') || originalRequest?.url?.includes('/login')) {
      return Promise.reject(error);
    }

    // Auto-refresh token if 401 and refresh token exists
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const isAdminRoute = originalRequest.url?.includes('/admin/');

      try {
        if (isAdminRoute) {
          const adminRefreshToken = localStorage.getItem('apnapay_admin_refresh_token');
          if (adminRefreshToken) {
            const res = await axios.post(`${API_BASE_URL}/admin/auth/refresh`, {
              refreshToken: adminRefreshToken
            });
            const newAccessToken = res.data?.data?.accessToken;
            if (newAccessToken) {
              localStorage.setItem('apnapay_admin_token', newAccessToken);
              if (res.data?.data?.refreshToken) {
                localStorage.setItem('apnapay_admin_refresh_token', res.data.data.refreshToken);
              }
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return api(originalRequest);
            }
          }
        } else {
          const userRefreshToken = localStorage.getItem('apnapay_refresh_token');
          if (userRefreshToken) {
            const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken: userRefreshToken
            });
            const newAccessToken = res.data?.token || res.data?.accessToken;
            if (newAccessToken) {
              localStorage.setItem('apnapay_token', newAccessToken);
              if (res.data?.refreshToken) {
                localStorage.setItem('apnapay_refresh_token', res.data.refreshToken);
              }
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return api(originalRequest);
            }
          }
        }
      } catch (refreshErr) {
        // If refresh fails, clear corresponding auth
        if (isAdminRoute) {
          localStorage.removeItem('apnapay_admin_token');
          localStorage.removeItem('apnapay_admin_refresh_token');
          localStorage.removeItem('apnapay_admin_user');
        } else {
          localStorage.removeItem('apnapay_token');
          localStorage.removeItem('apnapay_refresh_token');
          localStorage.removeItem('apnapay_user');
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

