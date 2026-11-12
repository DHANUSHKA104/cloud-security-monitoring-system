
import React, {
  forwardRef,
  InputHTMLAttributes,
  useState,
} from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showPasswordToggle?: boolean;
  theme?: 'dark' | 'light';
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
      theme = 'dark',
      ...props
    },
    ref
  ) => {
    const inputId =
      id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const errorId = inputId ? `${inputId}-error` : undefined;
    const helperId = inputId ? `${inputId}-helper` : undefined;

    const [passwordVisible, setPasswordVisible] = useState(false);

    const isPasswordField = type === 'password';
    const effectiveType =
      isPasswordField && passwordVisible ? 'text' : type;

    const isDark = theme === 'dark';

    const labelStyles = isDark
      ? 'text-slate-300'
      : 'text-slate-700';

    const inputStyles = isDark
      ? 'bg-slate-900/80 text-slate-100 border-slate-700 placeholder-slate-500 focus:border-violet-400 focus:ring-violet-400/20'
      : 'bg-white text-slate-900 border-slate-300 placeholder-slate-400 focus:border-violet-500 focus:ring-violet-500/20';

    const helperStyles = isDark
      ? 'text-slate-400'
      : 'text-slate-500';

    const toggleStyles = isDark
      ? 'text-slate-400 hover:text-white focus-visible:ring-violet-400'
      : 'text-slate-500 hover:text-violet-700 focus-visible:ring-violet-500';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={`mb-1.5 block text-xs font-semibold ${labelStyles}`}
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
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={`w-full rounded-xl border px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 ${
              isPasswordField && showPasswordToggle ? 'pr-11' : ''
            } ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : inputStyles
            } ${className}`}
            {...props}
          />

          {isPasswordField && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setPasswordVisible(!passwordVisible)}
              aria-label={passwordVisible ? 'Hide password' : 'Show password'}
              className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 transition-colors focus:outline-none focus-visible:ring-2 ${toggleStyles}`}
            >
              {passwordVisible ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                  <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.3 4.5 9 7-.3 1.1-1 2.2-2 3.2" />
                  <path d="M6.2 6.2C3.8 7.7 2.3 10 2 12c.7 2.5 4 7 10 7 1.1 0 2.1-.2 3-.5" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          )}
        </div>

        {error ? (
          <p
            id={errorId}
            className="mt-1.5 text-xs font-medium text-red-500"
          >
            {error}
          </p>
        ) : helperText ? (
          <p
            id={helperId}
            className={`mt-1.5 text-xs ${helperStyles}`}
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
