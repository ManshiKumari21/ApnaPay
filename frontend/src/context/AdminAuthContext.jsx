import React, { createContext, useContext, useState, useEffect } from 'react';
import adminAuthService from '../services/adminAuthService';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    try {
      const saved = localStorage.getItem('apnapay_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('apnapay_admin_token') || null);
  const [adminRefreshToken, setAdminRefreshToken] = useState(() => localStorage.getItem('apnapay_admin_refresh_token') || null);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);

  useEffect(() => {
    if (adminToken) {
      localStorage.setItem('apnapay_admin_token', adminToken);
    } else {
      localStorage.removeItem('apnapay_admin_token');
    }
  }, [adminToken]);

  useEffect(() => {
    if (adminRefreshToken) {
      localStorage.setItem('apnapay_admin_refresh_token', adminRefreshToken);
    } else {
      localStorage.removeItem('apnapay_admin_refresh_token');
    }
  }, [adminRefreshToken]);

  useEffect(() => {
    if (admin) {
      localStorage.setItem('apnapay_admin_user', JSON.stringify(admin));
    } else {
      localStorage.removeItem('apnapay_admin_user');
    }
  }, [admin]);

  const adminLogin = async (email, password) => {
    setIsLoadingAdmin(true);
    try {
      const data = await adminAuthService.login({ email, password });
      const accessToken = data.data?.accessToken;
      const refreshToken = data.data?.refreshToken;
      const adminInfo = data.data?.admin;

      setAdminToken(accessToken);
      setAdminRefreshToken(refreshToken);
      setAdmin(adminInfo);

      return data;
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  const adminVerifyOtpLogin = async (email, otp) => {
    setIsLoadingAdmin(true);
    try {
      const data = await adminAuthService.verifyOtp({ email, otp, purpose: 'login' });
      const accessToken = data.data?.accessToken;
      const refreshToken = data.data?.refreshToken;
      const adminInfo = data.data?.admin;

      if (accessToken) setAdminToken(accessToken);
      if (refreshToken) setAdminRefreshToken(refreshToken);
      if (adminInfo) setAdmin(adminInfo);

      return data;
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  const fetchAdminProfile = async () => {
    try {
      const data = await adminAuthService.getProfile();
      if (data?.data?.admin) {
        setAdmin(data.data.admin);
      }
      return data;
    } catch (err) {
      console.warn('Failed to fetch admin profile:', err.message);
      throw err;
    }
  };

  const adminLogout = async () => {
    try {
      if (adminRefreshToken) {
        await adminAuthService.logout(adminRefreshToken);
      }
    } catch (err) {
      console.warn('Admin logout warning:', err.message);
    } finally {
      setAdminToken(null);
      setAdminRefreshToken(null);
      setAdmin(null);
      localStorage.removeItem('apnapay_admin_token');
      localStorage.removeItem('apnapay_admin_refresh_token');
      localStorage.removeItem('apnapay_admin_user');
    }
  };

  const value = {
    admin,
    adminToken,
    adminRefreshToken,
    isAdminAuthenticated: Boolean(adminToken && admin),
    isLoadingAdmin,
    adminLogin,
    adminVerifyOtpLogin,
    adminLogout,
    fetchAdminProfile,
    setAdmin
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export default AdminAuthContext;

