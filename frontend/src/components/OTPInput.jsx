import React, { useRef, useEffect } from 'react';

const OTPInput = ({ length = 6, value = '', onChange, disabled = false, error = false }) => {
  const inputsRef = useRef([]);

  // Split string into array of characters
  const otpDigits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    // Focus first empty box on mount
    const firstEmptyIndex = otpDigits.findIndex((d) => !d);
    const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
    if (inputsRef.current[targetIndex] && !disabled) {
      inputsRef.current[targetIndex].focus();
    }
  }, []);

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, ''); // Digits only

    if (!val) {
      // Clear digit
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      onChange(newDigits.join(''));
      return;
    }

    // Take last digit if multiple entered
    const digit = val[val.length - 1];
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    const combined = newDigits.join('');
    onChange(combined);

    // Auto-advance to next input
    if (index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        // Move back and delete previous
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) {
      onChange(pasted);
      const nextIndex = Math.min(pasted.length, length - 1);
      inputsRef.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="otp-container">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputsRef.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={otpDigits[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`otp-box ${error ? 'input-error' : ''}`}
          aria-label={`OTP Digit ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default OTPInput;

