import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Single-flight refresh token promises for strict queue isolation
let adminRefreshPromise = null;
let customerRefreshPromise = null;

/**
 * Checks whether an endpoint is considered an Admin route.
 * Matches:
 *  - Explicit config.isAdmin === true
 *  - Any path starting with /admin, /api/admin, /api/v1/admin
 *  - Any path containing /admin/ (e.g. /land/admin/orders, /recharge/admin/overview)
 */
export const isAdminRequest = (configOrUrl) => {
  if (configOrUrl && typeof configOrUrl === 'object' && configOrUrl.isAdmin !== undefined) {
    return Boolean(configOrUrl.isAdmin);
  }
  const url = typeof configOrUrl === 'string' ? configOrUrl : configOrUrl?.url || '';
  if (!url) return false;
  
  // Normalise path (strip query params)
  const cleanUrl = url.split('?')[0];
  return /(^|\/)admin(\/|$)/i.test(cleanUrl);
};

/**
 * Checks whether an endpoint is public and does not require default Bearer tokens.
 */
export const isPublicEndpoint = (url) => {
  if (!url || typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  
  const publicExactOrSuffix = [
    '/auth/login',
    '/auth/login/lookup-phone',
    '/auth/login/send-otp',
    '/auth/login/verify-otp',
    '/auth/register',
    '/auth/send-otp',
    '/auth/verify-otp',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/refresh',
    '/admin/auth/login',
    '/admin/auth/send-otp',
    '/admin/auth/verify-otp',
    '/admin/auth/forgot-password',
    '/admin/auth/reset-password',
    '/admin/auth/refresh',
    '/health',
    '/api/health'
  ];

  return publicExactOrSuffix.some(
    (p) => cleanUrl.endsWith(p) || cleanUrl.includes(p)
  );
};

// ==========================================
// 1. REQUEST INTERCEPTOR: Strict Token Isolation
// ==========================================
api.interceptors.request.use(
  (config) => {
    const url = config.url || '';

    // If request is an unauthenticated public route, do not attach Bearer token by default
    if (isPublicEndpoint(url)) {
      if (!config.headers?.Authorization) {
        delete config.headers?.Authorization;
      }
      return config;
    }

    const isAdmin = isAdminRequest(config);

    if (isAdmin) {
      // STRICT ADMIN TOKEN: Read ONLY apnapay_admin_token (never fall back to customer token)
      const adminToken = localStorage.getItem('apnapay_admin_token');
      if (adminToken && typeof adminToken === 'string' && adminToken.trim()) {
        config.headers.Authorization = `Bearer ${adminToken.trim()}`;
      } else {
        delete config.headers?.Authorization;
      }
    } else {
      // STRICT CUSTOMER TOKEN: Read ONLY apnapay_token (never fall back to admin token)
      const userToken = localStorage.getItem('apnapay_token');
      if (userToken && typeof userToken === 'string' && userToken.trim()) {
        config.headers.Authorization = `Bearer ${userToken.trim()}`;
      } else {
        delete config.headers?.Authorization;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// 2. RESPONSE INTERCEPTOR: Single-Flight Refresh
// ==========================================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Reject immediately if no request config exists
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || '';

    // Do NOT retry or refresh on auth/login/refresh/public endpoints
    if (isPublicEndpoint(url) || url.includes('/refresh') || url.includes('/login')) {
      return Promise.reject(error);
    }

    // Only handle 401 Unauthorized for initial requests
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const isAdmin = isAdminRequest(originalRequest);

      // ----------------------------------------
      // A. ADMIN REFRESH FLOW
      // ----------------------------------------
      if (isAdmin) {
        const adminRefreshToken = localStorage.getItem('apnapay_admin_refresh_token');

        if (!adminRefreshToken) {
          // No admin refresh token: clear ONLY admin credentials
          localStorage.removeItem('apnapay_admin_token');
          localStorage.removeItem('apnapay_admin_refresh_token');
          localStorage.removeItem('apnapay_admin_user');
          return Promise.reject(error);
        }

        try {
          // Single-flight admin queue: Reuse ongoing refresh promise or create one
          if (!adminRefreshPromise) {
            adminRefreshPromise = (async () => {
              try {
                const res = await axios.post(`${API_BASE_URL}/admin/auth/refresh`, {
                  refreshToken: adminRefreshToken
                });

                // Admin refresh response wrapped in res.data.data
                const newAccessToken = res.data?.data?.accessToken;
                const newRefreshToken = res.data?.data?.refreshToken;

                if (!newAccessToken) {
                  throw new Error('Admin token refresh succeeded but accessToken was missing.');
                }

                localStorage.setItem('apnapay_admin_token', newAccessToken);
                if (newRefreshToken) {
                  localStorage.setItem('apnapay_admin_refresh_token', newRefreshToken);
                }

                return newAccessToken;
              } catch (refreshErr) {
                // Refresh failed or revoked: clear ONLY admin credentials
                localStorage.removeItem('apnapay_admin_token');
                localStorage.removeItem('apnapay_admin_refresh_token');
                localStorage.removeItem('apnapay_admin_user');
                throw refreshErr;
              } finally {
                adminRefreshPromise = null;
              }
            })();
          }

          // Await the shared single-flight refresh result
          const freshAdminAccessToken = await adminRefreshPromise;

          // Retry the original admin request with the new access token
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${freshAdminAccessToken}`;
          return api(originalRequest);

        } catch (adminErr) {
          return Promise.reject(adminErr);
        }

      // ----------------------------------------
      // B. CUSTOMER REFRESH FLOW
      // ----------------------------------------
      } else {
        const userRefreshToken = localStorage.getItem('apnapay_refresh_token');

        if (!userRefreshToken) {
          // No customer refresh token: do not clear admin credentials!
          return Promise.reject(error);
        }

        try {
          // Single-flight customer queue: Reuse ongoing refresh promise or create one
          if (!customerRefreshPromise) {
            customerRefreshPromise = (async () => {
              try {
                const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                  refreshToken: userRefreshToken
                });

                // Customer refresh response contains accessToken/token at root of data
                const newAccessToken = res.data?.accessToken || res.data?.token;
                const newRefreshToken = res.data?.refreshToken;

                if (!newAccessToken) {
                  throw new Error('Customer token refresh succeeded but accessToken was missing.');
                }

                localStorage.setItem('apnapay_token', newAccessToken);
                if (newRefreshToken) {
                  localStorage.setItem('apnapay_refresh_token', newRefreshToken);
                }

                return newAccessToken;
              } catch (refreshErr) {
                // Refresh failed or revoked: clear ONLY customer credentials
                localStorage.removeItem('apnapay_token');
                localStorage.removeItem('apnapay_refresh_token');
                localStorage.removeItem('apnapay_user');
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('apnapay:auth_cleared'));
                }
                throw refreshErr;
              } finally {
                customerRefreshPromise = null;
              }
            })();
          }

          // Await the shared single-flight refresh result
          const freshUserAccessToken = await customerRefreshPromise;

          // Retry the original customer request with the new access token
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${freshUserAccessToken}`;
          return api(originalRequest);

        } catch (userErr) {
          return Promise.reject(userErr);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
