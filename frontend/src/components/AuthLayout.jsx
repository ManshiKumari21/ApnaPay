import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldIcon, AlertCircleIcon, CheckCircleIcon } from './Icons';

const AuthLayout = ({
  children,
  title,
  subtitle,
  badgeText = 'SECURE FINTECH',
  isAdmin = false,
  error = null,
  success = null,
  wide = false,
  compact = false
}) => {
  return (
    <div className={`auth-page-container ${compact ? 'compact-auth-page' : ''}`}>
      {/* Background ambient lighting */}
      <div className="auth-ambient-glow" />

      <div className={`auth-card ${wide ? 'wide' : ''} ${compact ? 'compact-auth' : ''}`}>
        {/* Brand Header */}
        <div className="auth-brand">
          <div className={`brand-badge ${isAdmin ? 'admin' : ''}`}>
            <ShieldIcon size={compact ? 12 : 13} />
            <span>{badgeText}</span>
          </div>

          <Link
            to="/login"
            className="brand-logo-wrap"
            title="Go to ApnaPay Login"
            aria-label="ApnaPay Home"
          >
            <div className="brand-logo-icon">
              <ShieldIcon size={compact ? 20 : 24} />
            </div>
            <h1 className="brand-title">
              Apna<span>Pay</span>
            </h1>
          </Link>

          {title && <h2 style={{ fontSize: compact ? '17px' : '20px', fontWeight: '600', color: '#FFFFFF', marginTop: compact ? '4px' : '10px' }}>{title}</h2>}
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="alert-banner error fade-in">
            <AlertCircleIcon size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>{error}</div>
          </div>
        )}

        {/* Global Success Banner */}
        {success && (
          <div className="alert-banner success fade-in">
            <CheckCircleIcon size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>{success}</div>
          </div>
        )}

        {/* Form Content */}
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;

