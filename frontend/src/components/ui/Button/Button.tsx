
import React from 'react';
import { ButtonProps } from './Button.types';

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  children,
  className = '',
  type = 'button',
  onClick,
  ...rest
}) => {
  const baseStyles = `
    inline-flex items-center justify-center
    font-semibold rounded-xl
    transition-all duration-200 ease-out
    focus:outline-none focus-visible:ring-2
    focus-visible:ring-offset-2
    active:scale-[0.97]
    disabled:opacity-50
    disabled:cursor-not-allowed
    disabled:pointer-events-none
  `;

  const variantStyles = {
    primary: `
      bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600
      hover:from-violet-500 hover:via-indigo-500 hover:to-blue-500
      text-white shadow-lg shadow-violet-600/20
      hover:shadow-violet-500/30
      focus-visible:ring-violet-500
      focus-visible:ring-offset-slate-900
    `,
    secondary: `
      bg-slate-800 hover:bg-slate-700
      text-slate-100 border border-slate-700
      hover:border-slate-600
      focus-visible:ring-slate-400
      focus-visible:ring-offset-slate-900
    `,
    danger: `
      bg-gradient-to-r from-red-600 to-rose-600
      hover:from-red-500 hover:to-rose-500
      text-white shadow-md shadow-red-600/20
      focus-visible:ring-red-500
      focus-visible:ring-offset-slate-900
    `,
    ghost: `
      bg-transparent hover:bg-violet-500/10
      text-slate-400 hover:text-violet-400
      focus-visible:ring-violet-500
      focus-visible:ring-offset-slate-900
    `,
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-2 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) {
      e.preventDefault();
      return;
    }

    onClick?.(e);
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-busy={loading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            data-testid="loading-spinner"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Processing...</span>
        </>
      ) : (
        <>
          {leftIcon && (
            <span className="inline-flex shrink-0">{leftIcon}</span>
          )}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

export default Button;
