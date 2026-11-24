import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isAdminAuthenticated, isLoadingAdmin } = useAdminAuth() || {};
  const location = useLocation();

  if (isLoading || isLoadingAdmin) {
    return (
      <div className="auth-page-container">
        <LoadingSpinner size="lg" color="blue" />
      </div>
    );
  }

  // Allow access if logged in as customer OR as admin previewing customer portal
  if (!isAuthenticated && !isAdminAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;

