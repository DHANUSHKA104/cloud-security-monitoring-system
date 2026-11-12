
import React, { useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/constants/routes.constants';
import { apiClient } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/constants/api.constants';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { User } from '@/types';
import { AuthLayoutContext } from '@/layout/AuthLayout/AuthLayout';

interface LoginResponse {
  accessToken?: string;
  expiresIn?: number;
  user?: User;
  mfaRequired?: boolean;
  mfaToken?: string;
}

export const SignupForm: React.FC = () => {
  const { theme } = useOutletContext<AuthLayoutContext>();
  const isDark = theme === 'dark';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { addToast } = useAppStore();
  const { user, isAuthenticated, setSession, clearSession } = useAuthStore();

  // Password validation
  const hasMinLength = password.length >= 8;
  const hasCapital = /[A-Z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isMatch = password.length > 0 && password === confirmPassword;

  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const dividerStyle = isDark ? 'border-slate-700' : 'border-slate-200';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 2 || fullName.trim().length > 100) {
      setError('Please enter your full name (at least 2 characters)');
      return;
    }

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!hasMinLength) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!hasCapital) {
      setError('Password must contain at least one capital letter (A-Z)');
      return;
    }

    if (!hasSpecial) {
      setError('Password must contain at least one special character');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);

      // 1. Register user
      await apiClient.post(API_ENDPOINTS.AUTH.SIGNUP, {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      // 2. Automatically sign in after registration
      try {
        const loginRes = await apiClient.post<LoginResponse>(
          API_ENDPOINTS.AUTH.LOGIN,
          {
            email: email.trim().toLowerCase(),
            password,
          }
        );

        if (loginRes.user && loginRes.accessToken) {
          setSession(loginRes.user, loginRes.accessToken, loginRes.expiresIn);

          addToast({
            type: 'success',
            message: `Welcome, ${fullName}! Account created and signed in successfully.`,
          });

          navigate(ROUTES.DASHBOARD);
          return;
        }
      } catch {
        // Fall back to the login page if automatic login fails.
      }

      addToast({
        type: 'success',
        message: 'Account created successfully! You can now sign in.',
      });

      navigate(ROUTES.LOGIN);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setLoading(true);

      const res = await apiClient.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        {
          email: 'admin@cloudsec.local',
          password: 'Admin@CloudSec2026!',
        }
      );

      if (res.user && res.accessToken) {
        setSession(res.user, res.accessToken, res.expiresIn);

        addToast({
          type: 'success',
          message: 'Signed in successfully as Demo Administrator',
        });

        navigate(ROUTES.DASHBOARD);
      } else {
        setError('Demo login could not be completed.');
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Auto-login failed');
    } finally {
      setLoading(false);
    }
  };

  const requirementStyle = (valid: boolean) =>
    `flex items-center gap-2 ${
      valid
        ? 'text-emerald-500'
        : isDark
          ? 'text-slate-500'
          : 'text-slate-500'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Heading */}
      <div>
        <h2 className={`text-2xl font-bold tracking-tight ${textPrimary}`}>
          Create your account
        </h2>
        <p className={`mt-1.5 text-sm ${textSecondary}`}>
          Join CloudSec and take control of your cloud security journey.
        </p>
      </div>

      {/* Existing session */}
      {isAuthenticated && user ? (
        <div className={`rounded-xl border p-4 space-y-3 ${
          isDark
            ? 'bg-violet-500/10 border-violet-400/20 text-violet-200'
            : 'bg-violet-50 border-violet-200 text-violet-800'
        }`}>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span>
              Signed in as <strong>{user.fullName}</strong>
            </span>
            <span className="rounded-full px-2 py-1 text-xs bg-violet-500/15">
              {user.role}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={ROUTES.DASHBOARD}
              className="text-sm font-semibold text-violet-500 hover:text-violet-400"
            >
              Continue to Dashboard →
            </Link>

            <button
              type="button"
              onClick={() => clearSession()}
              className={`text-sm underline ${textSecondary}`}
            >
              Sign out
            </button>
          </div>
        </div>
      ) : (
        /* Demo administrator access */
        <div className={`rounded-xl border p-4 flex items-center justify-between gap-3 ${
          isDark
            ? 'bg-gradient-to-r from-violet-500/15 to-blue-500/10 border-violet-400/20'
            : 'bg-gradient-to-r from-violet-50 to-blue-50 border-violet-200'
        }`}>
          <div>
            <p className={`text-sm font-semibold ${textPrimary}`}>
              Want to explore CloudSec?
            </p>
            <p className={`text-xs mt-1 ${textSecondary}`}>
              Try the demo administrator account.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="shrink-0 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 transition-colors"
          >
            Demo Access →
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500"
        >
          {error}
        </div>
      )}

      {/* Registration fields */}
      <div className="space-y-4">
        <Input
          theme={theme}
          id="fullname-input"
          label="Full Name"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <Input
          theme={theme}
          id="signup-email-input"
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          theme={theme}
          id="signup-password-input"
          label="Create Password"
          type="password"
          placeholder="Create a strong password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* Password requirements */}
        <div className={`rounded-xl border p-3 space-y-2 ${
          isDark
            ? 'bg-slate-900/60 border-slate-700'
            : 'bg-slate-50 border-slate-200'
        }`}>
          <p className={`text-xs font-semibold ${textPrimary}`}>
            Password strength requirements
          </p>

          <div className={requirementStyle(hasMinLength)}>
            <span>{hasMinLength ? '✓' : '○'}</span>
            <span>At least 8 characters</span>
          </div>

          <div className={requirementStyle(hasCapital)}>
            <span>{hasCapital ? '✓' : '○'}</span>
            <span>At least one uppercase letter</span>
          </div>

          <div className={requirementStyle(hasSpecial)}>
            <span>{hasSpecial ? '✓' : '○'}</span>
            <span>At least one special character</span>
          </div>
        </div>

        <Input
          theme={theme}
          id="confirm-password-input"
          label="Confirm Password"
          type="password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          error={
            confirmPassword && !isMatch
              ? 'Passwords do not match'
              : undefined
          }
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        loading={loading}
        disabled={!hasMinLength || !hasCapital || !hasSpecial || !isMatch || loading}
        className="w-full"
      >
        Create Account & Continue
      </Button>

      {/* Login link */}
      <div className={`border-t ${dividerStyle} pt-4 text-center text-sm ${textSecondary}`}>
        Already have an account?{' '}
        <Link
          to={ROUTES.LOGIN}
          className="font-semibold text-violet-500 hover:text-violet-400 transition-colors"
        >
          Sign In
        </Link>
      </div>
    </form>
  );
};

export default SignupForm;
