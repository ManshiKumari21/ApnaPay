import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import LoadingSpinner from './LoadingSpinner';

const AdminProtectedRoute = ({ children }) => {
  const { isAdminAuthenticated, isLoadingAdmin } = useAdminAuth();
  const location = useLocation();

  if (isLoadingAdmin) {
    return (
      <div className="auth-page-container">
        <LoadingSpinner size="lg" color="blue" />
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminProtectedRoute;

