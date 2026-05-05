import React from 'react';
import './Spinner.css';

const Spinner = ({
  size = 'md',
  color = 'primary',
  className = '',
  ...props
}) => {
  const classes = [
    'spinner',
    `spinner-${size}`,
    `spinner-${color}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      <svg viewBox="0 0 50 50">
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

// Loading Overlay
export const LoadingOverlay = ({ show, message = 'Loading...' }) => {
  if (!show) return null;
  
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <Spinner size="lg" />
        <p>{message}</p>
      </div>
    </div>
  );
};

// Loading Skeleton
export const Skeleton = ({ 
  width = '100%', 
  height = '20px', 
  borderRadius = 'var(--radius-md)',
  className = '' 
}) => (
  <div 
    className={`skeleton ${className}`}
    style={{ width, height, borderRadius }}
  />
);

// Page Loader
export const PageLoader = () => (
  <div className="page-loader">
    <Spinner size="lg" color="primary" />
  </div>
);

export default Spinner;
