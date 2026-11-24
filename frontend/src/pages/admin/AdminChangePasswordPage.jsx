import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboardLayout from '../../components/layout/AdminDashboardLayout';
import PasswordInput from '../../components/PasswordInput';
import { KeyIcon, CheckCircleIcon, AlertCircleIcon, ShieldIcon } from '../../components/Icons';
import adminAuthService from '../../services/adminAuthService';
import { useAdminAuth } from '../../context/AdminAuthContext';

const AdminChangePasswordPage = () => {
  const navigate = useNavigate();
  const { adminLogout } = useAdminAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [globalSuccess, setGlobalSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!currentPassword) {
      errs.currentPassword = 'Current password is required.';
    }
    if (!newPassword || newPassword.length < 8) {
      errs.newPassword = 'New password must be at least 8 characters long.';
    }
    if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'New passwords do not match.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setGlobalError('');
    setGlobalSuccess('');

    try {
      const res = await adminAuthService.changePassword({
        currentPassword,
        newPassword
      });

      setGlobalSuccess(res.message || 'Password changed successfully! Redirecting to login...');
      setTimeout(async () => {
        await adminLogout();
        navigate('/admin/login', {
          state: { successMessage: 'Password changed successfully. Please log in again.' }
        });
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unable to change admin password.';
      setGlobalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminDashboardLayout
      title="Change Administrator Password"
      subtitle="Update your administrator credentials with salted bcrypt encryption"
      backFallback="/admin"
    >
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Info Card */}
        <div className="dashboard-card" style={{ marginBottom: '20px', padding: '16px 20px', background: 'rgba(22, 119, 255, 0.08)', borderColor: 'rgba(22, 119, 255, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00A8FF', fontWeight: '700', fontSize: '13px', marginBottom: '4px' }}>
            <ShieldIcon size={16} />
            <span>CREDENTIAL ROTATION POLICY</span>
          </div>
          <p style={{ color: '#A9BDD7', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>
            For high security, changing your password revokes existing active sessions and requires you to sign in again. Use at least 8 characters with letters, numbers, and symbols.
          </p>
        </div>

        {/* Form Card */}
        <div className="dashboard-card">
          {globalError && (
            <div className="auth-alert error" style={{ marginBottom: '16px' }}>
              <AlertCircleIcon size={16} />
              <span>{globalError}</span>
            </div>
          )}

          {globalSuccess && (
            <div className="auth-alert success" style={{ marginBottom: '16px' }}>
              <CheckCircleIcon size={16} />
              <span>{globalSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <PasswordInput
              label="Current Administrator Password"
              name="currentPassword"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setErrors((prev) => ({ ...prev, currentPassword: '' }));
              }}
              placeholder="Enter current password"
              error={errors.currentPassword}
              required
            />

            <PasswordInput
              label="New Administrator Password"
              name="newPassword"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setErrors((prev) => ({ ...prev, newPassword: '' }));
              }}
              placeholder="Minimum 8 characters"
              error={errors.newPassword}
              success={!errors.newPassword && newPassword.length >= 8 ? 'Min 8 characters met' : ''}
              required
            />

            <PasswordInput
              label="Confirm New Password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((prev) => ({ ...prev, confirmPassword: '' }));
              }}
              placeholder="Re-enter new password"
              error={errors.confirmPassword}
              success={!errors.confirmPassword && confirmPassword && newPassword === confirmPassword ? 'Passwords match' : ''}
              required
            />

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                className="auth-button"
                style={{ flex: '1 1 180px', margin: 0, height: '42px', fontSize: '13px' }}
              >
                {isSubmitting ? 'Updating Password...' : 'Save New Password'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="auth-button secondary"
                style={{ flex: '1 1 100px', padding: '0 20px', height: '42px', fontSize: '13px', margin: 0 }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminChangePasswordPage;
