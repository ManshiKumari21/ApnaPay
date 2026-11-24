import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'white', className = '' }) => {
  const sizeMap = {
    sm: { width: '16px', height: '16px', borderWidth: '2px' },
    md: { width: '20px', height: '20px', borderWidth: '2.5px' },
    lg: { width: '32px', height: '32px', borderWidth: '3px' }
  };

  const style = sizeMap[size] || sizeMap.md;

  return (
    <span
      className={`spinner ${color === 'blue' ? 'blue' : ''} ${className}`}
      style={style}
    />
  );
};

export default LoadingSpinner;

