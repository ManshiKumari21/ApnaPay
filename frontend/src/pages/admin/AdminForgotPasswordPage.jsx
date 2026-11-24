import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import FormInput from '../../components/FormInput';
import AuthButton from '../../components/AuthButton';
import { MailIcon, ArrowRightIcon, ChevronLeftIcon } from '../../components/Icons';
import adminAuthService from '../../services/adminAuthService';

const AdminForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [globalSuccess, setGlobalSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    const emailTrimmed = email.trim().toLowerCase();

    if (!emailTrimmed) {
      errs.email = 'Administrator email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      errs.email = 'Please enter a valid administrator email address.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setGlobalError('');
    setGlobalSuccess('');

    const targetEmail = email.trim().toLowerCase();

    try {
      const res = await adminAuthService.forgotPassword(targetEmail);
      const successMsg = res?.message || 'If an account exists, a 6-digit OTP has been sent to your registered email address.';
      setGlobalSuccess(successMsg);

      // Navigate to /admin/verify-reset-otp with target email in navigation state
      setTimeout(() => {
        navigate('/admin/verify-reset-otp', {
          state: {
            email: targetEmail,
            message: successMsg
          }
        });
      }, 600);

    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unable to process admin password reset request.';
      setGlobalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Admin Password Recovery"
      subtitle="Enter your administrator email address to receive a secure 6-digit recovery OTP"
      badgeText="ADMIN RECOVERY"
      isAdmin
      error={globalError}
      success={globalSuccess}
    >
      <form onSubmit={handleSendOtp} noValidate>
        <FormInput
          label="Administrator Email Address"
          id="adminEmail"
          name="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
          }}
          placeholder="admin@apnapay.com"
          error={errors.email}
          success={!errors.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? 'Valid admin email format' : ''}
          icon={MailIcon}
          autoComplete="email"
          required
        />

        <div style={{ marginTop: '24px' }}>
          <AuthButton
            type="submit"
            isLoading={isSubmitting}
            icon={ArrowRightIcon}
            isAdmin
          >
            Send Admin OTP
          </AuthButton>
        </div>

        <div className="auth-footer" style={{ marginTop: '20px' }}>
          <Link
            to="/admin/login"
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
            Back to Admin Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default AdminForgotPasswordPage;
