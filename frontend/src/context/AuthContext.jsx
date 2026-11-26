import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import userAuthService from '../services/userAuthService';

const AuthContext = createContext(null);

// Helper to check if a JWT token is structurally valid and unexpired
const isTokenValid = (jwtToken) => {
  if (!jwtToken || typeof jwtToken !== 'string') return false;
  try {
    const parts = jwtToken.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return true;
    // Check if token has expired (with 10-second buffer)
    return payload.exp * 1000 > Date.now() + 10000;
  } catch {
    return false;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('apnapay_token');
    return isTokenValid(savedToken) ? savedToken : null;
  });

  const [refreshToken, setRefreshToken] = useState(() => {
    const savedRefresh = localStorage.getItem('apnapay_refresh_token');
    return isTokenValid(savedRefresh) ? savedRefresh : null;
  });

  const [user, setUser] = useState(() => {
    const savedToken = localStorage.getItem('apnapay_token');
    const savedRefresh = localStorage.getItem('apnapay_refresh_token');
    // Only restore user if at least one token is valid
    if (!isTokenValid(savedToken) && !isTokenValid(savedRefresh)) {
      localStorage.removeItem('apnapay_token');
      localStorage.removeItem('apnapay_refresh_token');
      localStorage.removeItem('apnapay_user');
      return null;
    }
    try {
      const savedUser = localStorage.getItem('apnapay_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  // Validate or refresh session on mount
  useEffect(() => {
    const initSession = async () => {
      const savedToken = localStorage.getItem('apnapay_token');
      const savedRefresh = localStorage.getItem('apnapay_refresh_token');

      if (!savedToken && !savedRefresh) {
        setToken(null);
        setRefreshToken(null);
        setUser(null);
        return;
      }

      // If access token is expired but refresh token is still valid, attempt silent refresh
      if (!isTokenValid(savedToken) && isTokenValid(savedRefresh)) {
        setIsLoading(true);
        try {
          const res = await userAuthService.refresh(savedRefresh);
          const newAccessToken = res.token || res.accessToken;
          const newRefreshToken = res.refreshToken || savedRefresh;
          const userData = res.user;

          if (newAccessToken) {
            setToken(newAccessToken);
            localStorage.setItem('apnapay_token', newAccessToken);
          }
          if (newRefreshToken) {
            setRefreshToken(newRefreshToken);
            localStorage.setItem('apnapay_refresh_token', newRefreshToken);
          }
          if (userData) {
            setUser(userData);
            localStorage.setItem('apnapay_user', JSON.stringify(userData));
          }
        } catch (err) {
          console.warn('[AuthContext] Session initialization refresh failed:', err.message);
          setToken(null);
          setRefreshToken(null);
          setUser(null);
          localStorage.removeItem('apnapay_token');
          localStorage.removeItem('apnapay_refresh_token');
          localStorage.removeItem('apnapay_user');
        } finally {
          setIsLoading(false);
        }
      } else if (!isTokenValid(savedToken) && !isTokenValid(savedRefresh)) {
        // Both tokens expired or invalid: purge stale data
        setToken(null);
        setRefreshToken(null);
        setUser(null);
        localStorage.removeItem('apnapay_token');
        localStorage.removeItem('apnapay_refresh_token');
        localStorage.removeItem('apnapay_user');
      }
    };

    initSession();
  }, []);

  // Sync token state to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('apnapay_token', token);
    } else {
      localStorage.removeItem('apnapay_token');
    }
  }, [token]);

  // Sync refresh token state to localStorage
  useEffect(() => {
    if (refreshToken) {
      localStorage.setItem('apnapay_refresh_token', refreshToken);
    } else {
      localStorage.removeItem('apnapay_refresh_token');
    }
  }, [refreshToken]);

  // Sync user state to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('apnapay_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('apnapay_user');
    }
  }, [user]);

  // Listen for global auth cleared events (from api interceptor 401s)
  useEffect(() => {
    const handleAuthCleared = () => {
      setToken(null);
      setRefreshToken(null);
      setUser(null);
    };
    window.addEventListener('apnapay:auth_cleared', handleAuthCleared);
    return () => window.removeEventListener('apnapay:auth_cleared', handleAuthCleared);
  }, []);

  const login = async (identifierOrPayload, maybePassword) => {
    setIsLoading(true);
    try {
      let data;
      if (typeof identifierOrPayload === 'object' && identifierOrPayload !== null) {
        if (identifierOrPayload.token && identifierOrPayload.user) {
          // Direct authenticated response data
          data = identifierOrPayload;
        } else if (identifierOrPayload.otp) {
          data = await userAuthService.loginVerifyOtp(identifierOrPayload);
        } else {
          data = await userAuthService.login(identifierOrPayload);
        }
      } else {
        data = await userAuthService.login({ identifier: identifierOrPayload, password: maybePassword });
      }

      const userToken = data.token || data.accessToken;
      const userRefreshToken = data.refreshToken;
      const userData = data.user;

      setToken(userToken);
      setRefreshToken(userRefreshToken);
      setUser(userData);

      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      const data = await userAuthService.register(userData);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (refreshToken) {
        await userAuthService.logout(refreshToken);
      }
    } catch (err) {
      console.warn('Logout API warning:', err.message);
    } finally {
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      localStorage.removeItem('apnapay_token');
      localStorage.removeItem('apnapay_refresh_token');
      localStorage.removeItem('apnapay_user');
    }
  };

  // True only when access token is unexpired and user profile is present
  const isCurrentTokenValid = isTokenValid(token);
  const isAuthenticated = Boolean(isCurrentTokenValid && user);

  const value = {
    user,
    token,
    refreshToken,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    setUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

