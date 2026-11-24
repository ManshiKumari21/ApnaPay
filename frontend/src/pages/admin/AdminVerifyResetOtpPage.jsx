import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import OTPInput from '../../components/OTPInput';
import AuthButton from '../../components/AuthButton';
import { ShieldIcon, ArrowRightIcon, RefreshCwIcon, ChevronLeftIcon } from '../../components/Icons';
import adminAuthService from '../../services/adminAuthService';

const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email || '';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  const masked = user[0] + '*'.repeat(Math.max(3, user.length - 2)) + user[user.length - 1];
  return `${masked}@${domain}`;
};

const AdminVerifyResetOtpPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || '';

  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message || '');

  // Cooldown countdown
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // If directly accessed without entering email, redirect to /admin/forgot-password
  if (!email) {
    return <Navigate to="/admin/forgot-password" replace />;
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP sent to your administrator email.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await adminAuthService.verifyOtp({
        email,
        otp,
        purpose: 'password_reset'
      });

      const authToken = res?.resetAuthorizationToken || res?.resetToken;

      if (!authToken) {
        throw new Error('Unable to obtain reset authorization. Please try again.');
      }

      setSuccess('Admin OTP verified successfully! Proceeding to reset password...');

      setTimeout(() => {
        navigate('/admin/reset-password', {
          state: {
            email,
            resetAuthorizationToken: authToken
          }
        });
      }, 600);

    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Incorrect or expired OTP.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      const res = await adminAuthService.sendOtp({
        email,
        purpose: 'password_reset'
      });

      setSuccess(res?.message || 'A new 6-digit OTP has been sent to your administrator email.');
      setCountdown(60);
      setCanResend(false);
      setOtp('');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unable to resend admin OTP.';
      setError(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout
      title="Admin Code Verification"
      subtitle="Enter the 6-digit OTP sent to your registered administrator email"
      badgeText="ADMIN VERIFICATION"
      isAdmin
      error={error}
      success={success}
    >
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#071426',
            border: '1px solid #17385D',
            borderRadius: '20px',
            padding: '6px 16px',
            fontSize: '13px',
            color: '#A9BDD7'
          }}
        >
          <ShieldIcon size={14} color="#00A8FF" />
          <span>Code sent to: <strong style={{ color: '#FFFFFF' }}>{maskEmail(email)}</strong></span>
        </div>
      </div>

      <form onSubmit={handleVerifyOtp} noValidate>
        <div style={{ marginBottom: '20px' }}>
          <OTPInput
            length={6}
            value={otp}
            onChange={(val) => {
              setOtp(val);
              if (error) setError('');
            }}
            disabled={isSubmitting}
            error={!!error}
          />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={!canResend || isResending}
            style={{
              background: 'none',
              border: 'none',
              color: canResend ? '#00A8FF' : '#64748B',
              cursor: canResend ? 'pointer' : 'not-allowed',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 500,
              transition: 'color 0.2s'
            }}
          >
            <RefreshCwIcon size={14} className={isResending ? 'spinning' : ''} />
            {isResending
              ? 'Sending code...'
              : canResend
                ? 'Resend OTP'
                : `Resend code in ${countdown}s`}
          </button>
        </div>

        <AuthButton
          type="submit"
          isLoading={isSubmitting}
          disabled={otp.length !== 6}
          icon={ArrowRightIcon}
          isAdmin
        >
          Verify Admin OTP
        </AuthButton>

        <div className="auth-footer" style={{ marginTop: '20px' }}>
          <Link
            to="/admin/forgot-password"
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
            Change Administrator Email
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default AdminVerifyResetOtpPage;

