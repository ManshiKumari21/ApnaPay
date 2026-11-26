import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from './Icons';

/**
 * Reusable BackButton Component for ApnaPay
 *
 * - Navigates to previous page if browser history exists in current session.
 * - Falls back safely to logical parent or /app if opened directly via URL.
 * - Allows optional onClick override for custom page-level dismissal (e.g. modals/tabs).
 */
const BackButton = ({
  fallback = '/app',
  label = 'Back',
  onClick = null,
  className = '',
  style = {}
}) => {
  const navigate = useNavigate();

  const handleBack = (e) => {
    e.preventDefault();
    if (onClick) {
      onClick();
      return;
    }

    // Check if browser history has a previous entry in this session
    const hasHistory =
      window.history.state &&
      typeof window.history.state.idx === 'number' &&
      window.history.state.idx > 0;

    if (hasHistory) {
      navigate(-1);
    } else {
      navigate(fallback || '/app');
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`back-button ${className}`}
      style={style}
      aria-label={label || 'Back'}
      title="Go back to previous page"
    >
      <ArrowLeftIcon size={18} />
      <span className="back-button-label">{label}</span>
    </button>
  );
};

export default BackButton;

