import React, { useState } from 'react';
import FormInput from './FormInput';
import { LockIcon, EyeIcon, EyeOffIcon } from './Icons';

const PasswordInput = ({
  label = 'Password',
  id = 'password',
  name = 'password',
  value,
  onChange,
  placeholder = '••••••••',
  error,
  success,
  required = false,
  autoComplete = 'current-password',
  className = '',
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FormInput
      label={label}
      id={id}
      name={name}
      type={showPassword ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      error={error}
      success={success}
      required={required}
      autoComplete={autoComplete}
      icon={LockIcon}
      className={className}
      rightElement={
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}
        >
          {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
        </button>
      }
      {...rest}
    />
  );
};

export default PasswordInput;
