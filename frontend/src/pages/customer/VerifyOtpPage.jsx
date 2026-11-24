import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import OTPInput from '../../components/OTPInput';
import AuthButton from '../../components/AuthButton';
import { ArrowRightIcon, CheckCircleIcon } from '../../components/Icons';
import userAuthService from '../../services/userAuthService';

// Format email in professional masked format (e.g. hkh*****123@gmail.com)
const maskEmail = (emailStr) => {
  if (!emailStr || typeof emailStr !== 'string') return '';
  const parts = emailStr.split('@');
  if (parts.length !== 2) return '******';
  const [username, domain] = parts;
  if (username.length <= 4) {
    return `${username[0]}*****${username[username.length - 1]}@${domain}`;
  }
  const start = username.slice(0, 3);
  const end = username.slice(-3);
  return `${start}*****${end}@${domain}`;
};

// Format phone in masked format (e.g. ******2434)
const maskPhone = (phoneStr) => {
  if (!phoneStr) return '';
  const clean = String(phoneStr).replace(/\D/g, '');
  if (clean.length < 4) return '******';
  return `******${clean.slice(-4)}`;
};

const VerifyOtpPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || '';
  const phone = location.state?.phone || '';
  const fullName = location.state?.fullName || '';
  const password = location.state?.password || '';
  const mode = location.state?.mode || 'verification';
  const purpose = location.state?.purpose || 'email_verification';

  // OTP input starts strictly empty (never pre-filled)
  const [otp, setOtp] = useState('');
  const [expiryCountdown, setExpiryCountdown] = useState(300); // 5 minutes (300s)
  const [resendCooldown, setResendCooldown] = useState(30); // 30 seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [globalSuccess, setGlobalSuccess] = useState('');

  // Guard: if user lands on page without email or phone, redirect to signup
  useEffect(() => {
    if (!email && !phone) {
      navigate('/signup', { replace: true });
    }
  }, [email, phone, navigate]);

  // 5-minute expiry countdown timer
  useEffect(() => {
    let timer;
    if (expiryCountdown > 0) {
      timer = setInterval(() => {
        setExpiryCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [expiryCountdown]);

  // 30-second resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setGlobalError('');
    setGlobalSuccess('');

    try {
      const res = await userAuthService.sendOtp({
        email: email || undefined,
        phone: phone || undefined,
        purpose
      });

      // Set input boxes on resend
      if (res?.devOtp || res?.otp) {
        setOtp(String(res.devOtp || res.otp));
      } else {
        setOtp('');
      }
      setExpiryCountdown(300); // Reset 5-minute expiry
      setResendCooldown(30); // Reset 30-second cooldown
      setGlobalSuccess(res?.message || 'Verification code sent to your registered email.');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unable to send verification code. Please try again.';
      setGlobalError(msg);
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (expiryCountdown <= 0) {
      setGlobalError('OTP has expired. Please request a new code.');
      return;
    }

    if (otp.length !== 6) {
      setGlobalError('Please enter a valid 6-digit OTP.');
      return;
    }

    setIsSubmitting(true);
    setGlobalError('');
    setGlobalSuccess('');

    try {
      // 1. Verify OTP with backend
      await userAuthService.verifyOtp({
        email: email || undefined,
        phone: phone || undefined,
        otp,
        purpose
      });

      // 2. If part of registration flow, complete registration
      if (mode === 'register' && fullName && password) {
        await userAuthService.register({
          full_name: fullName,
          email: email || undefined,
          phone: phone,
          password
        });

        navigate('/login', {
          state: {
            successMessage: 'Account created successfully! Please sign in with your registered phone number and email.'
          }
        });
      } else {
        setGlobalSuccess('OTP verified successfully!');
        setTimeout(() => {
          navigate('/login');
        }, 1200);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Incorrect OTP. Please check and try again.';
      setGlobalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactDisplay = email
    ? maskEmail(email)
    : phone
      ? maskPhone(phone)
      : 'your registered contact';

  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle={`We've sent a 6-digit verification code to ${contactDisplay}`}
      error={globalError}
      success={globalSuccess}
      badgeText="SECURITY VERIFICATION"
    >
      <form onSubmit={handleSubmit} noValidate>
        {/* Six Separate OTP Input Boxes */}
        <OTPInput
          length={6}
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
            <span>6-digit OTP code complete</span>
          </div>
        )}

        {/* Expiry Countdown & Resend Button */}
        <div className="otp-timer-row">
          <span>
            {expiryCountdown > 0 ? (
              <>Expires in <strong>{formatTime(expiryCountdown)}</strong></>
            ) : (
              <span style={{ color: '#EF4444', fontWeight: '600' }}>OTP has expired. Please request a new code.</span>
            )}
          </span>

          <button
            type="button"
            className="resend-btn"
            disabled={resendCooldown > 0 || isResending}
            onClick={handleResend}
          >
            {isResending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
          </button>
        </div>

        {/* Submit Button */}
        <AuthButton
          type="submit"
          isLoading={isSubmitting}
          disabled={otp.length !== 6 || expiryCountdown <= 0}
          icon={ArrowRightIcon}
        >
          {mode === 'register' ? 'Verify & Create Account' : 'Verify Code'}
        </AuthButton>

        <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', margin: '14px 0 0', lineHeight: '1.4' }}>
          Didn't receive the email? Check your <strong>Spam</strong> or <strong>Promotions</strong> folder.
        </p>
      </form>

      <div className="auth-footer">
        Wrong email address?{' '}
        <Link to="/signup">Start Over</Link>
      </div>
    </AuthLayout>
  );
};

export default VerifyOtpPage;
