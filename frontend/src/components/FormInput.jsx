import React from 'react';
import { AlertCircleIcon, CheckCircleIcon } from './Icons';

const FormInput = ({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  success,
  required = false,
  disabled = false,
  icon: Icon,
  rightElement,
  autoComplete,
  className = '',
  ...rest
}) => {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label htmlFor={id || name} className="form-label" style={{ marginBottom: 0 }}>
            {label} {required && <span style={{ color: '#00A8FF' }}>*</span>}
          </label>
          {!error && success && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10B981', fontSize: '11px', fontWeight: '600' }}>
              <CheckCircleIcon size={13} style={{ flexShrink: 0 }} />
              <span>{success}</span>
            </div>
          )}
        </div>
      )}
      <div className="input-wrapper">
        {Icon && (
          <div className="input-icon-left">
            <Icon size={18} />
          </div>
        )}
        <input
          id={id || name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`form-input ${!Icon ? 'no-left-icon' : ''} ${rightElement ? 'has-right-icon' : ''} ${error ? 'input-error' : ''} ${!error && success ? 'input-success' : ''}`}
          {...rest}
        />
        {rightElement && (
          <div className="input-icon-right">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <div className="field-error">
          <AlertCircleIcon size={14} />
          <span>{error}</span>
        </div>
      )}
      {!label && !error && success && (
        <div className="field-status-msg success" style={{ marginTop: '5px' }}>
          <CheckCircleIcon size={13} style={{ flexShrink: 0 }} />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
};

export default FormInput;
