import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import OTPInput from '../../components/OTPInput';
import AuthButton from '../../components/AuthButton';
import { ArrowRightIcon, CheckCircleIcon } from '../../components/Icons';
import adminAuthService from '../../services/adminAuthService';

const AdminVerifyOtpPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || '';
  const purpose = location.state?.purpose || 'login';

  // OTP input starts strictly empty (never pre-filled)
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [globalSuccess, setGlobalSuccess] = useState('');

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

  const handleResend = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    setGlobalError('');
    setGlobalSuccess('');

    try {
      await adminAuthService.sendOtp({ email, purpose });
      setCountdown(60);
      setCanResend(false);
      setGlobalSuccess('A fresh 6-digit OTP has been sent to the admin email.');
      setOtp(''); // Keep empty
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unable to resend OTP.';
      setGlobalError(msg);
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (otp.length !== 6) {
      setGlobalError('Please enter all 6 digits of the admin OTP.');
      return;
    }

    setIsSubmitting(true);
    setGlobalError('');
    setGlobalSuccess('');

    try {
      const res = await adminAuthService.verifyOtp({
        email,
        otp,
        purpose
      });

      if (res.data?.accessToken) {
        localStorage.setItem('apnapay_admin_token', res.data.accessToken);
        if (res.data.refreshToken) {
          localStorage.setItem('apnapay_admin_refresh_token', res.data.refreshToken);
        }
        if (res.data.admin) {
          localStorage.setItem('apnapay_admin_user', JSON.stringify(res.data.admin));
        }
        navigate('/admin', { replace: true });
        return;
      }

      setGlobalSuccess('Admin OTP verified successfully!');
      setTimeout(() => {
        navigate('/admin/login', {
          state: { successMessage: 'OTP verified. Please log in with your credentials.' }
        });
      }, 1200);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'OTP verification failed.';
      setGlobalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Admin OTP Verification"
      subtitle={`Enter the 6-digit administrative verification code sent to ${email || 'your admin email'}`}
      error={globalError}
      success={globalSuccess}
      badgeText="ADMIN SECURITY"
      isAdmin
    >
      <form onSubmit={handleSubmit}>
        <OTPInput
          value={otp}
          onChange={(newVal) => {
            setOtp(newVal);
            setGlobalError('');
          }}
          disabled={isSubmitting}
          error={Boolean(globalError)}
        />

        {otp.length === 6 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#10B981', fontSize: '12px', fontWeight: '600', marginTop: '-6px', marginBottom: '10px' }}>
            <CheckCircleIcon size={14} />
            <span>6-digit admin OTP complete</span>
          </div>
        )}

        <div className="otp-timer-row">
          <span>
            {countdown > 0 ? (
              <>Expires in <strong>{countdown}s</strong></>
            ) : (
              <span style={{ color: '#EF4444' }}>OTP Expired</span>
            )}
          </span>

          <button
            type="button"
            className="resend-btn"
            disabled={!canResend || isResending}
            onClick={handleResend}
          >
            {isResending ? 'Sending...' : 'Resend Code'}
          </button>
        </div>

        <AuthButton
          type="submit"
          isLoading={isSubmitting}
          disabled={otp.length !== 6}
          icon={ArrowRightIcon}
        >
          Verify Admin OTP
        </AuthButton>
      </form>

      <div className="auth-footer">
        Back to Admin Login?
        <Link to="/admin/login">Admin Sign In</Link>
      </div>
    </AuthLayout>
  );
};

export default AdminVerifyOtpPage;

