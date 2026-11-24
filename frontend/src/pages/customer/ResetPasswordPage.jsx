import React, { useState } from 'react';
import { useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import PasswordInput from '../../components/PasswordInput';
import AuthButton from '../../components/AuthButton';
import { ArrowRightIcon, CheckCircleIcon, ChevronLeftIcon } from '../../components/Icons';
import userAuthService from '../../services/userAuthService';

const ResetPasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Reset authorization token from previous OTP verification step
  const resetAuthorizationToken = location.state?.resetAuthorizationToken;
  const email = location.state?.email || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [globalSuccess, setGlobalSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Strictly block direct unauthorized access if no resetAuthorizationToken
  if (!resetAuthorizationToken) {
    return <Navigate to="/forgot-password" replace />;
  }

  const validate = () => {
    const errs = {};
    if (!newPassword || newPassword.length < 8) {
      errs.newPassword = 'Password must be at least 8 characters long.';
    }
    if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setGlobalError('');
    setGlobalSuccess('');

    try {
      const res = await userAuthService.resetPassword({
        token: resetAuthorizationToken,
        newPassword
      });

      const successMsg = res?.message || 'Password reset successfully. Please login with your new password.';
      setGlobalSuccess(successMsg);

      // Redirect to login after successful reset
      setTimeout(() => {
        navigate('/login', {
          state: {
            successMessage: successMsg
          }
        });
      }, 1500);

    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unable to reset password. Please try again.';
      setGlobalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMinLength = newPassword.length >= 8;
  const isMatching = newPassword && newPassword === confirmPassword;

  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Establish a new high-security password for your ApnaPay account"
      badgeText="SECURITY UPDATE"
      error={globalError}
      success={globalSuccess}
    >
      <form onSubmit={handleResetPassword} noValidate>
        <PasswordInput
          label="New Password"
          id="newPassword"
          name="newPassword"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }));
          }}
          placeholder="At least 8 characters"
          error={errors.newPassword}
          autoComplete="new-password"
          required
        />

        <PasswordInput
          label="Confirm New Password"
          id="confirmPassword"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
          }}
          placeholder="Re-enter new password"
          error={errors.confirmPassword}
          autoComplete="new-password"
          required
        />

        {/* Validation indicators */}
        <div style={{ marginTop: '12px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: isMinLength ? '#10B981' : '#64748B' }}>
            <CheckCircleIcon size={14} />
            <span>Minimum 8 characters</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: isMatching ? '#10B981' : '#64748B' }}>
            <CheckCircleIcon size={14} />
            <span>Passwords match</span>
          </div>
        </div>

        <AuthButton
          type="submit"
          isLoading={isSubmitting}
          icon={ArrowRightIcon}
        >
          Update Password
        </AuthButton>

        <div className="auth-footer" style={{ marginTop: '20px' }}>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#A9BDD7',
              textDecoration: 'none',
              fontSize: '13px'
            }}
          >
            <ChevronLeftIcon size={16} />
            Back to Customer Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
