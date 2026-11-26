import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import FormInput from '../../components/FormInput';
import AuthButton from '../../components/AuthButton';
import {
  PhoneIcon,
  MailIcon,
  LockIcon,
  ArrowRightIcon,
  ShieldIcon
} from '../../components/Icons';
import { useAuth } from '../../context/AuthContext';
import userAuthService from '../../services/userAuthService';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
const DEFAULT_COOLDOWN_SECONDS = 60;

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading } = useAuth();

  // Redirect to dashboard (or intended protected route) if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const destination = location.state?.from?.pathname || '/app';
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location.state]);

  // 1. Controlled input fields: Phone, Email, OTP (strictly empty on load)
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // User interaction tracking (validation feedback only appears after interaction or submit)
  const [touched, setTouched] = useState({
    phone: false,
    email: false,
    otp: false
  });

  // Clean up any previously saved autofill items from localStorage on mount
  useEffect(() => {
    try {
      localStorage.removeItem('apnapay_saved_phone');
      localStorage.removeItem('apnapay_saved_email');
      localStorage.removeItem('apnapay_remember_login');
    } catch {
      // Ignore if localStorage unavailable
    }
  }, []);

  // 2. OTP session and cooldown state
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownIntervalRef = useRef(null);

  // 3. Validation, submission & alert states
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const otpInputRef = useRef(null);

  // Cleanup interval on unmount
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

  // Field 1: Phone number change (numeric digits only, max 10)
  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const cleanPhone = raw.length > 10 && (raw.startsWith('91') || raw.length === 12)
      ? raw.slice(-10)
      : raw.slice(0, 10);
    setPhone(cleanPhone);
    setTouched((prev) => ({ ...prev, phone: true }));

    // If 10 digits entered, check if valid; if not valid yet, clear previous error until blur/submit
    if (cleanPhone.length === 10) {
      if (INDIAN_PHONE_REGEX.test(cleanPhone)) {
        setErrors((prev) => ({ ...prev, phone: '' }));
      } else {
        setErrors((prev) => ({ ...prev, phone: 'Mobile number must start with 6, 7, 8, or 9.' }));
      }
    } else if (cleanPhone.length === 0) {
      setErrors((prev) => ({ ...prev, phone: '' }));
    } else if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: '' }));
    }
    setGlobalError('');
  };

  const handlePhoneBlur = () => {
    setTouched((prev) => ({ ...prev, phone: true }));
    if (phone.length > 0 && (phone.length !== 10 || !INDIAN_PHONE_REGEX.test(phone))) {
      setErrors((prev) => ({ ...prev, phone: 'Please enter a valid 10-digit Indian mobile number.' }));
    }
  };

  const handlePhonePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    const cleanPhone = pasted.length > 10 ? pasted.slice(-10) : pasted.slice(0, 10);
    setPhone(cleanPhone);
    setTouched((prev) => ({ ...prev, phone: true }));
    if (cleanPhone.length === 10 && INDIAN_PHONE_REGEX.test(cleanPhone)) {
      setErrors((prev) => ({ ...prev, phone: '' }));
    }
    setGlobalError('');
  };

  // Field 2: Email address change
  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setTouched((prev) => ({ ...prev, email: true }));

    if (val.trim() === '') {
      setErrors((prev) => ({ ...prev, email: '' }));
    } else if (EMAIL_REGEX.test(val.trim().toLowerCase())) {
      setErrors((prev) => ({ ...prev, email: '' }));
    } else if (errors.email) {
      setErrors((prev) => ({ ...prev, email: '' }));
    }
    setGlobalError('');
  };

  const handleEmailBlur = () => {
    setTouched((prev) => ({ ...prev, email: true }));
    const trimmed = email.trim();
    if (trimmed.length > 0 && !EMAIL_REGEX.test(trimmed.toLowerCase())) {
      setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address format.' }));
    }
  };

  // Field 3: OTP change (numeric digits only, max 6)
  const handleOtpChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(digitsOnly);
    setTouched((prev) => ({ ...prev, otp: true }));
    if (digitsOnly.length === 6) {
      setErrors((prev) => ({ ...prev, otp: '' }));
    } else if (digitsOnly.length === 0) {
      setErrors((prev) => ({ ...prev, otp: '' }));
    } else if (errors.otp) {
      setErrors((prev) => ({ ...prev, otp: '' }));
    }
    setGlobalError('');
  };

  const handleOtpBlur = () => {
    setTouched((prev) => ({ ...prev, otp: true }));
    if (otp.length > 0 && otp.length !== 6) {
      setErrors((prev) => ({ ...prev, otp: 'Please enter a valid 6-digit OTP.' }));
    }
  };

  // Support pasting full 6-digit OTP
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setOtp(pasted);
    setTouched((prev) => ({ ...prev, otp: true }));
    if (pasted.length === 6) {
      setErrors((prev) => ({ ...prev, otp: '' }));
    }
    setGlobalError('');
  };

  // Validation for sending OTP
  const validatePhoneAndEmail = () => {
    const errs = {};
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim().toLowerCase();

    setTouched((prev) => ({ ...prev, phone: true, email: true }));

    if (!cleanPhone && !cleanEmail) {
      errs.phone = 'Please enter your 10-digit mobile number.';
      errs.email = 'Please enter your registered email address.';
      setErrors(errs);
      return false;
    }

    if (!cleanPhone) {
      errs.phone = 'Please enter your 10-digit mobile number.';
    } else if (cleanPhone.length !== 10 || !INDIAN_PHONE_REGEX.test(cleanPhone)) {
      errs.phone = 'Please enter a valid 10-digit Indian mobile number.';
    }

    if (!cleanEmail) {
      errs.email = 'Please enter your registered email address.';
    } else if (!EMAIL_REGEX.test(cleanEmail)) {
      errs.email = 'Please enter a valid email address format.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Send OTP / Resend OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (resendCooldown > 0 || isSendingOtp) return;

    setGlobalError('');
    setSuccessMessage('');

    if (!validatePhoneAndEmail()) return;

    setIsSendingOtp(true);
    try {
      const res = await userAuthService.loginSendOtp({
        phone: phone || undefined,
        email: email ? email.trim().toLowerCase() : undefined,
        deliveryMethod: 'email'
      });

      setOtpSent(true);
      setOtp(''); // strictly empty, user enters OTP from email
      startCooldownTimer(res.data?.resendCooldown || DEFAULT_COOLDOWN_SECONDS);
      setSuccessMessage(res.message || 'Verification code sent to your registered email address. Please check your inbox.');

      // Focus the OTP input field
      setTimeout(() => {
        if (otpInputRef.current) {
          otpInputRef.current.focus();
        }
      }, 100);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unable to send OTP. Please try again.';
      setGlobalError(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Login to ApnaPay
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');
    setSuccessMessage('');
    setTouched({ phone: true, email: true, otp: true });

    if (!validatePhoneAndEmail()) return;

    // If OTP has not been sent yet or OTP field is empty, automatically send OTP to email
    if (!otpSent || !otp) {
      await handleSendOtp(e);
      return;
    }

    // Validate OTP field if user has entered partial OTP
    if (otp.length !== 6) {
      setErrors((prev) => ({ ...prev, otp: 'Please enter a valid 6-digit OTP.' }));
      return;
    }

    setIsSubmitting(true);
    try {
      const authData = await userAuthService.loginVerifyOtp({
        phone: phone || undefined,
        email: email ? email.trim().toLowerCase() : undefined,
        otp
      });

      // Complete customer login session in AuthContext
      await login(authData);

      // Redirect to customer dashboard
      const destination = location.state?.from?.pathname || '/app';
      navigate(destination, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid OTP. Please try again.';
      setGlobalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend button label logic
  const getSendButtonLabel = () => {
    if (isSendingOtp) return 'Sending OTP...';
    if (resendCooldown > 0) {
      return `Resend OTP in ${resendCooldown}s`;
    }
    return otpSent ? 'Resend OTP' : 'Send OTP';
  };

  const isPhoneValid = phone.length === 10 && INDIAN_PHONE_REGEX.test(phone);
  const isEmailValid = EMAIL_REGEX.test(email.trim().toLowerCase());
  const isOtpValid = otp.length === 6;

  // Validation messages only appear after user interaction/typing
  const phoneSuccess = touched.phone && !errors.phone && isPhoneValid ? 'Valid 10-digit mobile number' : '';
  const emailSuccess = touched.email && !errors.email && isEmailValid ? 'Valid email format' : '';
  const otpSuccess = touched.otp && !errors.otp && isOtpValid ? '6-digit OTP complete' : '';

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Log in securely using your phone, email and OTP"
      error={globalError}
      success={successMessage || location.state?.successMessage}
      badgeText="CUSTOMER LOGIN"
      compact={true}
    >
      <form onSubmit={handleLoginSubmit} noValidate>
        {/* ================= 1. PHONE NUMBER ================= */}
        <FormInput
          label="Phone Number"
          name="phone"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={phone}
          onChange={handlePhoneChange}
          onBlur={handlePhoneBlur}
          onPaste={handlePhonePaste}
          placeholder="Enter your registered mobile number"
          error={errors.phone}
          success={phoneSuccess}
          icon={PhoneIcon}
          required
          autoComplete="off"
        />

        {/* ================= 2. EMAIL ADDRESS ================= */}
        <FormInput
          label="Email Address"
          name="email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          onBlur={handleEmailBlur}
          placeholder="Enter your registered email address"
          error={errors.email}
          success={emailSuccess}
          icon={MailIcon}
          required
          autoComplete="off"
        />

        {/* ================= 3. 6-DIGIT OTP ================= */}
        <FormInput
          ref={otpInputRef}
          label="6-Digit OTP"
          name="otp"
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={handleOtpChange}
          onBlur={handleOtpBlur}
          onPaste={handleOtpPaste}
          placeholder="Enter the 6-digit OTP"
          error={errors.otp}
          success={otpSuccess}
          icon={LockIcon}
          required
          autoComplete="off"
        />

        {/* ================= 4. REMEMBER ME CHECKBOX ================= */}
        <div style={{ marginTop: '2px', marginBottom: '14px' }}>
          <label className="checkbox-label" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span className="checkbox-custom" />
            <span style={{ fontSize: '12.5px', color: '#A9BDD7' }}>Remember this device for faster login</span>
          </label>
        </div>

        {/* ================= 5. SEND / RESEND OTP BUTTON ================= */}
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

        {/* ================= 5. LOGIN TO APNAPAY BUTTON ================= */}
        <AuthButton
          type="submit"
          isLoading={isSubmitting}
          icon={ArrowRightIcon}
          disabled={isSubmitting}
        >
          Login to ApnaPay
        </AuthButton>

        {/* ================= 6. CREATE AN ACCOUNT FOOTER ================= */}
        <div className="auth-footer" style={{ marginTop: '14px', textAlign: 'center', fontSize: '12px' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#00A8FF', fontWeight: '600' }}>
            Create an Account
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
