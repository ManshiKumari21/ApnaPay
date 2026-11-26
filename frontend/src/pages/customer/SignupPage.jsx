import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import FormInput from '../../components/FormInput';
import PasswordInput from '../../components/PasswordInput';
import AuthButton from '../../components/AuthButton';
import { UserIcon, MailIcon, PhoneIcon, ArrowRightIcon } from '../../components/Icons';
import { useAuth } from '../../context/AuthContext';
import userAuthService from '../../services/userAuthService';

const SignupPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/app', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    agreeTerms: false
  });

  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setGlobalError('');
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      errs.fullName = 'Full name must be at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    const cleanDigits = formData.phone.replace(/\D/g, '');
    const cleanPhone = cleanDigits.length > 10 ? cleanDigits.slice(-10) : cleanDigits;
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      errs.phone = 'Please enter a valid 10-digit Indian mobile number.';
    }

    if (!formData.password || formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters long.';
    }

    if (!formData.agreeTerms) {
      errs.agreeTerms = 'You must accept the Terms of Service & Privacy Policy.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setGlobalError('');

    const cleanDigits = formData.phone.replace(/\D/g, '');
    const cleanPhone = cleanDigits.length > 10 ? cleanDigits.slice(-10) : cleanDigits;
    const cleanEmail = formData.email.trim().toLowerCase();

    try {
      // Step 1: Send OTP to user's email for registration verification
      await userAuthService.sendOtp({
        email: cleanEmail,
        phone: cleanPhone,
        purpose: 'email_verification'
      });

      // Navigate to OTP verification page with user details
      navigate('/verify-otp', {
        state: {
          email: cleanEmail,
          phone: cleanPhone,
          fullName: formData.fullName.trim(),
          password: formData.password,
          purpose: 'email_verification',
          mode: 'register'
        }
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unable to send verification code. Please try again.';
      setGlobalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFullNameValid = formData.fullName.trim().length >= 2;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
  const cleanDigits = formData.phone.replace(/\D/g, '');
  const cleanPhone = cleanDigits.length > 10 ? cleanDigits.slice(-10) : cleanDigits;
  const isPhoneValid = cleanPhone.length === 10 && /^[6-9]\d{9}$/.test(cleanPhone);
  const isPasswordValid = formData.password.length >= 8;

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join ApnaPay for smart, fast and secure digital payments"
      error={globalError}
      badgeText="NEW CUSTOMER"
      wide
    >
      <form onSubmit={handleSubmit} noValidate>
        {/* Full Name */}
        <FormInput
          label="Full Name"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="e.g. Gopal Parmar"
          error={errors.fullName}
          success={!errors.fullName && isFullNameValid ? 'Valid full name' : ''}
          icon={UserIcon}
          required
          autoComplete="name"
        />

        {/* Email Address */}
        <FormInput
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="name@email.com"
          error={errors.email}
          success={!errors.email && isEmailValid ? 'Valid email format' : ''}
          icon={MailIcon}
          required
          autoComplete="email"
        />

        {/* Mobile Number */}
        <FormInput
          label="Mobile Number"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="e.g. 9876543210"
          error={errors.phone}
          success={!errors.phone && isPhoneValid ? 'Valid 10-digit mobile number' : ''}
          icon={PhoneIcon}
          required
          autoComplete="tel"
        />

        {/* Password */}
        <PasswordInput
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Minimum 8 characters"
          error={errors.password}
          success={!errors.password && isPasswordValid ? 'Password meets requirements' : ''}
          required
          autoComplete="new-password"
        />

        {/* Terms and Conditions Checkbox */}
        <div className="form-group" style={{ marginBottom: '22px' }}>
          <label className="checkbox-label" style={{ alignItems: 'flex-start', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
            />
            <span className="checkbox-custom" style={{ marginTop: '2px' }} />
            <span style={{ fontSize: '13px', lineHeight: '1.4', color: '#A9BDD7' }}>
              I agree to the <a href="#terms" onClick={(e) => e.preventDefault()} style={{ color: '#00A8FF' }}>Terms of Service</a> and{' '}
              <a href="#privacy" onClick={(e) => e.preventDefault()} style={{ color: '#00A8FF' }}>Privacy Policy</a>.
            </span>
          </label>
          {errors.agreeTerms && (
            <div className="field-error" style={{ marginTop: '6px' }}>
              <span>{errors.agreeTerms}</span>
            </div>
          )}
        </div>

        {/* Create Account Button */}
        <AuthButton
          type="submit"
          isLoading={isSubmitting}
          icon={ArrowRightIcon}
        >
          Create My Account
        </AuthButton>
      </form>

      {/* Footer Navigation */}
      <div className="auth-footer">
        Already have an account?
        <Link to="/login">Sign In</Link>
      </div>
    </AuthLayout>
  );
};

export default SignupPage;

