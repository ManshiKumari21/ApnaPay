import React, { createContext, useContext, useState, useEffect } from 'react';
import userAuthService from '../services/userAuthService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('apnapay_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('apnapay_token') || null);
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('apnapay_refresh_token') || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('apnapay_token', token);
    } else {
      localStorage.removeItem('apnapay_token');
    }
  }, [token]);

  useEffect(() => {
    if (refreshToken) {
      localStorage.setItem('apnapay_refresh_token', refreshToken);
    } else {
      localStorage.removeItem('apnapay_refresh_token');
    }
  }, [refreshToken]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('apnapay_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('apnapay_user');
    }
  }, [user]);

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

  const value = {
    user,
    token,
    refreshToken,
    isAuthenticated: Boolean(token && user),
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

