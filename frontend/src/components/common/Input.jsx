import React, { forwardRef, useState } from 'react';
import './Input.css';

const Input = forwardRef(({
  label,
  type = 'text',
  error,
  helperText,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  disabled = false,
  required = false,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const inputType = type === 'password' && showPassword ? 'text' : type;
  
  const containerClasses = [
    'input-container',
    fullWidth && 'input-full',
    error && 'input-error',
    disabled && 'input-disabled',
    containerClassName,
  ].filter(Boolean).join(' ');
  
  const inputClasses = [
    'input-field',
    icon && iconPosition === 'left' && 'input-with-icon-left',
    icon && iconPosition === 'right' && 'input-with-icon-right',
    type === 'password' && 'input-with-password-toggle',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      <div className="input-wrapper">
        {icon && iconPosition === 'left' && (
          <span className="input-icon input-icon-left">{icon}</span>
        )}
        <input
          ref={ref}
          type={inputType}
          className={inputClasses}
          disabled={disabled}
          required={required}
          {...props}
        />
        {type === 'password' && (
          <button
            type="button"
            className="input-password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
        {icon && iconPosition === 'right' && (
          <span className="input-icon input-icon-right">{icon}</span>
        )}
      </div>
      {(error || helperText) && (
        <span className={`input-helper ${error ? 'input-helper-error' : ''}`}>
          {error || helperText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
