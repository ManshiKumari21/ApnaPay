import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const AuthButton = ({
  children,
  type = 'submit',
  isLoading = false,
  disabled = false,
  variant = 'primary',
  className = '',
  onClick,
  icon: Icon
}) => {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`auth-button ${variant === 'secondary' ? 'secondary' : ''} ${className}`}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" color={variant === 'secondary' ? 'blue' : 'white'} />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && <Icon size={18} />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

export default AuthButton;

