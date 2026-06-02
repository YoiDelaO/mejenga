import React, { forwardRef } from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
    const hasError = !!error;

    return (
      <div className={`mj-input-wrapper ${className}`}>
        {label && (
          <label htmlFor={inputId} className="mj-input-label">
            {label}
          </label>
        )}
        <div className={`mj-input-container ${hasError ? 'mj-input-container--error' : ''}`}>
          {leftIcon && <span className="mj-input-icon mj-input-icon--left">{leftIcon}</span>}
          <input
            id={inputId}
            ref={ref}
            className={`mj-input-field ${leftIcon ? 'mj-input-field--with-left-icon' : ''} ${
              rightIcon ? 'mj-input-field--with-right-icon' : ''
            }`}
            {...props}
          />
          {rightIcon && <span className="mj-input-icon mj-input-icon--right">{rightIcon}</span>}
        </div>
        {hasError && <span className="mj-input-error-msg">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
