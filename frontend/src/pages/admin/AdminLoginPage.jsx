import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import FormInput from '../../components/FormInput';
import PasswordInput from '../../components/PasswordInput';
import AuthButton from '../../components/AuthButton';
import {
  MailIcon,
  LockIcon,
  ArrowRightIcon,
  ShieldIcon
} from '../../components/Icons';
import { useAdminAuth } from '../../context/AdminAuthContext';
import adminAuthService from '../../services/adminAuthService';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_COOLDOWN_SECONDS = 60;

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminLogin, adminVerifyOtpLogin } = useAdminAuth();

  // Mode: OTP (default, identical to customer login format) vs Password
  const [showPasswordMode, setShowPasswordMode] = useState(false);

  // Form inputs
  const [email, setEmail] = useState(() => localStorage.getItem('apnapay_admin_saved_email') || '');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('apnapay_admin_remember') === 'true');

  // OTP session & cooldown state
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownIntervalRef = useRef(null);
  const otpInputRef = useRef(null);

  // Validation & alerts
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load saved credentials on mount if remembered
  useEffect(() => {
    if (localStorage.getItem('apnapay_admin_remember') === 'true') {
      const savedEmail = localStorage.getItem('apnapay_admin_saved_email');
      if (savedEmail) setEmail(savedEmail);
    }
  }, []);

  // Cleanup cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  // Cooldown countdown timer
  const startCooldownTimer = (seconds = DEFAULT_COOLDOWN_SECONDS) => {
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
    }
    setResendCooldown(seconds);
    cooldownIntervalRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Field change handlers
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
    setGlobalError('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
    setGlobalError('');
  };

  const handleOtpChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(digitsOnly);
    if (errors.otp) setErrors((prev) => ({ ...prev, otp: '' }));
    setGlobalError('');
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setOtp(pasted);
    if (errors.otp) setErrors((prev) => ({ ...prev, otp: '' }));
    setGlobalError('');
  };

  // Validate Email
  const validateEmail = () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrors((prev) => ({ ...prev, email: 'Please enter a valid admin email address.' }));
      return false;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address format.' }));
      return false;
    }
    return true;
  };

  // Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (resendCooldown > 0 || isSendingOtp) return;

    setGlobalError('');
    setSuccessMessage('');

    if (!validateEmail()) return;

    setIsSendingOtp(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await adminAuthService.sendOtp({
        email: cleanEmail,
        purpose: 'login'
      });

      setOtpSent(true);
      setOtp(''); // strictly empty, administrator enters OTP from email
      startCooldownTimer(DEFAULT_COOLDOWN_SECONDS);
      setSuccessMessage(res?.message || 'Verification code sent to your registered admin email address. Please check your inbox.');

      setTimeout(() => {
        if (otpInputRef.current) {
          otpInputRef.current.focus();
        }
      }, 100);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unable to send admin OTP. Please try again.';
      setGlobalError(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Submit Handler (OTP or Password)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');
    setSuccessMessage('');

    if (!validateEmail()) return;

    const cleanEmail = email.trim().toLowerCase();

    // Password Mode submission
    if (showPasswordMode) {
      if (!password) {
        setErrors((prev) => ({ ...prev, password: 'Admin password is required.' }));
        return;
      }

      setIsSubmitting(true);
      try {
        if (rememberMe) {
          localStorage.setItem('apnapay_admin_remember', 'true');
          localStorage.setItem('apnapay_admin_saved_email', cleanEmail);
        } else {
          localStorage.removeItem('apnapay_admin_remember');
          localStorage.removeItem('apnapay_admin_saved_email');
        }

        await adminLogin(cleanEmail, password);
        navigate('/admin', { replace: true });
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Invalid admin credentials.';
        setGlobalError(msg);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // OTP Mode submission (Default - matching customer login flow)
    if (!otpSent || !otp) {
      await handleSendOtp(e);
      return;
    }

    if (otp.length !== 6) {
      setErrors((prev) => ({ ...prev, otp: 'Please enter a valid 6-digit OTP.' }));
      return;
    }

    setIsSubmitting(true);
    try {
      if (rememberMe) {
        localStorage.setItem('apnapay_admin_remember', 'true');
        localStorage.setItem('apnapay_admin_saved_email', cleanEmail);
      } else {
        localStorage.removeItem('apnapay_admin_remember');
        localStorage.removeItem('apnapay_admin_saved_email');
      }

      await adminVerifyOtpLogin(cleanEmail, otp);
      navigate('/admin', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid or expired OTP. Please try again.';
      setGlobalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send button label logic
  const getSendButtonLabel = () => {
    if (isSendingOtp) return 'Sending OTP...';
    if (resendCooldown > 0) {
      return `Resend OTP in ${resendCooldown}s`;
    }
    return otpSent ? 'Resend OTP' : 'Send OTP';
  };

  const isEmailValid = EMAIL_REGEX.test(email.trim().toLowerCase());
  const isOtpValid = otp.length === 6;
  const isPasswordValid = Boolean(password && password.length >= 6);

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle={showPasswordMode ? "Log in securely using your administrator credentials" : "Log in securely using your admin email and OTP"}
      error={globalError}
      success={successMessage || location.state?.successMessage}
      badgeText="ADMIN CONSOLE"
      compact={true}
      isAdmin
    >
      <form onSubmit={handleLoginSubmit} noValidate>
        {/* ================= 1. ADMIN EMAIL ADDRESS ================= */}
        <FormInput
          label="Admin Email Address"
          name="email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="admin@apnapay.com"
          error={errors.email}
          success={!errors.email && isEmailValid ? 'Valid admin email format' : ''}
          icon={MailIcon}
          required
          autoComplete="username"
          autoFocus
        />

        {/* ================= 2. 6-DIGIT OTP (OR PASSWORD IF TOGGLED) ================= */}
        {!showPasswordMode ? (
          <FormInput
            ref={otpInputRef}
            label="6-Digit OTP"
            name="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={handleOtpChange}
            onPaste={handleOtpPaste}
            placeholder="Enter the 6-digit OTP"
            error={errors.otp}
            success={!errors.otp && isOtpValid ? '6-digit OTP complete' : ''}
            icon={LockIcon}
            required
            autoComplete="one-time-code"
          />
        ) : (
          <PasswordInput
            label="Admin Password"
            name="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="Enter admin password"
            error={errors.password}
            success={!errors.password && isPasswordValid ? 'Password entered' : ''}
            required
            autoComplete="current-password"
          />
        )}

        {/* ================= 3. REMEMBER ME CHECKBOX ================= */}
        <div style={{ marginTop: '2px', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <label className="checkbox-label" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span className="checkbox-custom" />
            <span style={{ fontSize: '12.5px', color: '#A9BDD7' }}>Remember this device for faster login</span>
          </label>

          {showPasswordMode && (
            <Link to="/admin/forgot-password" style={{ fontSize: '12px', color: '#00A8FF' }}>
              Forgot Password?
            </Link>
          )}
        </div>

        {/* ================= 4. SEND / RESEND OTP BUTTON (OTP MODE) ================= */}
        {!showPasswordMode && (
          <div style={{ marginBottom: '12px' }}>
            <button
              type="button"
              className="auth-button secondary"
              disabled={isSendingOtp || isSubmitting || resendCooldown > 0}
              onClick={handleSendOtp}
              style={{
                width: '100%',
                height: '40px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <ShieldIcon size={16} />
              <span>{getSendButtonLabel()}</span>
            </button>
          </div>
        )}

        {/* ================= 5. LOGIN BUTTON ================= */}
        <AuthButton
          type="submit"
          isLoading={isSubmitting}
          icon={ArrowRightIcon}
          disabled={isSubmitting}
        >
          {showPasswordMode ? 'Sign In as Administrator' : 'Login to Admin Console'}
        </AuthButton>

        {/* ================= 6. SECONDARY TOGGLE OPTION ================= */}
        <div style={{ marginTop: '14px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => {
              setShowPasswordMode(!showPasswordMode);
              setGlobalError('');
              setSuccessMessage('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#00A8FF',
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px'
            }}
          >
            <LockIcon size={13} />
            <span>{showPasswordMode ? '← Login with Email OTP Instead' : 'Or Sign In with Password instead →'}</span>
          </button>
        </div>

        {/* ================= 7. FOOTER ================= */}
        <div className="auth-footer" style={{ marginTop: '14px', textAlign: 'center', fontSize: '12px' }}>
          Are you a customer?{' '}
          <Link to="/login" style={{ color: '#00A8FF', fontWeight: '600' }}>
            Go to Customer Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default AdminLoginPage;
