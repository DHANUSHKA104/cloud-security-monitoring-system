import React, { forwardRef, InputHTMLAttributes, useState } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      id,
      className = '',
      type = 'text',
      showPasswordToggle = true,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const errorId = inputId ? `${inputId}-error` : undefined;
    const helperId = inputId ? `${inputId}-helper` : undefined;

    const [passwordVisible, setPasswordVisible] = useState(false);
    const isPasswordField = type === 'password';
    const effectiveType = isPasswordField && passwordVisible ? 'text' : type;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-gray-300 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={effectiveType}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`w-full px-3 py-2 bg-gray-900 border rounded-md text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors ${
              isPasswordField && showPasswordToggle ? 'pr-10' : ''
            } ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-700 focus:border-purple-500 focus:ring-purple-500/20'
            } ${className}`}
            {...props}
          />
          {isPasswordField && showPasswordToggle && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setPasswordVisible(!passwordVisible)}
              aria-label={passwordVisible ? 'Hide password' : 'Show password'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-200 transition-colors focus:outline-none"
            >
              {passwordVisible ? (
                // Eye slash icon
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                  />
                </svg>
              ) : (
                // Eye icon
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          )}
        </div>
        {error ? (
          <p id={errorId} className="mt-1 text-xs text-red-400">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="mt-1 text-xs text-gray-400">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
