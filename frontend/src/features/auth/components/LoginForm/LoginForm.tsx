
import React, { useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ROUTES } from '@/constants/routes.constants';
import { apiClient } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/constants/api.constants';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import { authService } from '@/features/auth/services/authService';
import { OtpVerification } from '@/features/auth/components/OtpVerification';
import { User } from '@/types';
import { AuthLayoutContext } from '@/layout/AuthLayout/AuthLayout';

interface LoginResponse {
  accessToken?: string;
  expiresIn?: number;
  user?: User;
  mfaRequired?: boolean;
  mfaToken?: string;
}

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMfa, setShowMfa] = useState(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { addToast } = useAppStore();
  const { user, isAuthenticated, setSession, clearSession } = useAuthStore();
  const { theme } = useOutletContext<AuthLayoutContext>();

  const isDark = theme === 'dark';

  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-blue-100/65' : 'text-slate-600';
  const borderColor = isDark ? 'border-white/10' : 'border-slate-200';

  const handleQuickFill = (role: 'ADMIN' | 'ANALYST') => {
    if (role === 'ADMIN') {
      setEmail('admin@cloudsec.local');
      setPassword('Admin@CloudSec2026!');
    } else {
      setEmail('alice.analyst@cloudsec.local');
      setPassword('Admin@CloudSec2026!');
    }
    setError(null);
  };

  const handleDirectDemoLogin = async () => {
    handleQuickFill('ADMIN');

    try {
      setLoading(true);
      setError(null);

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
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Auto-login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    const targetEmail = resetEmail.trim().toLowerCase();

    if (!targetEmail || !targetEmail.includes('@')) {
      setResetError('Please enter a valid email address');
      return;
    }

    if (resetPassword.length < 8) {
      setResetError('Password must be at least 8 characters');
      return;
    }

    if (!/[A-Z]/.test(resetPassword)) {
      setResetError('Password must contain at least one capital letter (A-Z)');
      return;
    }

    if (!/[^A-Za-z0-9]/.test(resetPassword)) {
      setResetError('Password must contain at least one special character');
      return;
    }

    if (resetPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match');
      return;
    }

    try {
      setResetLoading(true);

      await authService.resetPassword({
        email: targetEmail,
        newPassword: resetPassword,
      });

      addToast({
        type: 'success',
        message: 'Password reset and account unlocked successfully! You can now sign in.',
      });

      setEmail(targetEmail);
      setPassword(resetPassword);
      setResetModalOpen(false);
      setResetPassword('');
      setResetConfirmPassword('');
      setError(null);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setResetError(apiErr.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your full name or email address');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    try {
      setLoading(true);

      const res = await apiClient.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        {
          email: email.trim(),
          password,
        }
      );

      if (res.mfaRequired && res.mfaToken) {
        setMfaToken(res.mfaToken);
        sessionStorage.setItem('mfaToken', res.mfaToken);
        setShowMfa(true);
      } else if (res.user && res.accessToken) {
        setSession(res.user, res.accessToken, res.expiresIn);
        navigate(ROUTES.DASHBOARD);
      }
    } catch (err: unknown) {
      const apiErr = err as { message?: string; code?: string };

      if (apiErr.code === 'ACCOUNT_LOCKED') {
        setError(apiErr.message || 'Account locked, try again in 15 minutes.');
      } else {
        setError(apiErr.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = isDark
    ? 'bg-[#0b1530] border-blue-400/20 text-white placeholder:text-slate-500 focus:border-blue-400 focus:ring-blue-500/20'
    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20';

  const secondaryButton = isDark
    ? 'bg-white/5 border-white/10 text-blue-200 hover:bg-white/10'
    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200';

  if (showMfa) {
    return (
      <div className="space-y-5">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-2xl">
            🔐
          </div>
          <h2 className={`text-2xl font-bold ${textPrimary}`}>
            Verify your identity
          </h2>
          <p className={`text-sm ${textSecondary}`}>
            Complete the additional security verification to continue.
          </p>
        </div>

        <OtpVerification mfaToken={mfaToken || undefined} />

        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowMfa(false)}
            className="text-sm text-blue-400 hover:text-cyan-400 transition-colors"
          >
            ← Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
        data-testid="login-form"
      >
        {/* Heading */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500">
              Secure Authentication
            </span>
          </div>

          <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight ${textPrimary}`}>
            Welcome back<span className="text-blue-500">.</span>
          </h2>

          <p className={`text-sm leading-relaxed ${textSecondary}`}>
            Sign in to access your cloud security monitoring and incident
            management dashboard.
          </p>
        </div>

        {/* Active session */}
        {isAuthenticated && user ? (
          <div className={`rounded-2xl border border-emerald-500/30 p-4 space-y-3 ${
            isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-emerald-600">
                  Active Session
                </p>
                <p className={`text-xs mt-1 ${textSecondary}`}>
                  Signed in as {user.fullName}
                </p>
              </div>

              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                {user.role}
              </span>
            </div>

            <div className={`flex items-center gap-3 pt-3 border-t ${
              isDark ? 'border-emerald-500/20' : 'border-emerald-200'
            }`}>
              <Link
                to={ROUTES.DASHBOARD}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-500"
              >
                Continue to Dashboard →
              </Link>

              <button
                type="button"
                onClick={() => clearSession()}
                className={`text-xs ${textSecondary} hover:text-red-500`}
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          /* Demo account card */
          <div className={`rounded-2xl border p-4 space-y-3 ${
            isDark
              ? 'bg-gradient-to-br from-blue-500/10 to-violet-500/10 border-blue-400/20'
              : 'bg-gradient-to-br from-blue-50 to-violet-50 border-blue-100'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
                🛡️
              </div>

              <div>
                <p className={`text-sm font-bold ${textPrimary}`}>
                  Explore CloudSec Demo
                </p>
                <p className={`text-xs mt-1 ${textSecondary}`}>
                  Experience the platform using a demo administrator account.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDirectDemoLogin}
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:brightness-110 hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connecting...' : 'Launch Demo Dashboard →'}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            role="alert"
            className={`flex items-start gap-2 p-3 rounded-xl border text-xs ${
              isDark
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <span className="text-base">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login fields */}
        <div className="space-y-4">
          <Input
          theme={theme}
            id="email-input"
            label="Full Name or Email Address"
            type="text"
            placeholder="Enter your name or email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            className={fieldClass}
          />

          <Input
          theme={theme}
            id="password-input"
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className={fieldClass}
          />

          <div className="flex items-center justify-between gap-2 text-xs">
            <span className={textSecondary}>
              Forgot your password?
            </span>

            <button
              type="button"
              onClick={() => {
                setResetEmail(email || '');
                setResetError(null);
                setResetModalOpen(true);
              }}
              className="font-semibold text-blue-500 hover:text-violet-500 transition-colors"
            >
              Reset Password →
            </button>
          </div>
        </div>

        {/* Demo quick fill */}
        <div className={`flex flex-wrap items-center justify-between gap-2 pt-3 border-t ${borderColor}`}>
          <span className={`text-xs font-medium ${textSecondary}`}>
            Quick Demo Fill
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('ADMIN')}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${secondaryButton}`}
            >
              Admin
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('ANALYST')}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${secondaryButton}`}
            >
              Analyst
            </button>
          </div>
        </div>

        {/* Sign in */}
        <Button
          type="submit"
          loading={loading}
          className="w-full !rounded-xl !py-3 !bg-gradient-to-r !from-blue-600 !via-indigo-600 !to-violet-600 !text-white !shadow-lg !shadow-blue-600/20 hover:!brightness-110"
        >
          Sign In →
        </Button>

        {/* Signup link */}
        <div className={`text-center text-xs pt-4 border-t ${borderColor} ${textSecondary}`}>
          Don't have an account?{' '}
          <Link
            to={ROUTES.SIGNUP}
            className="font-semibold text-blue-500 hover:text-violet-500 transition-colors"
          >
            Create an account
          </Link>
        </div>
      </form>

      {/* Password Reset Modal */}
      <Modal
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset Account Password"
        maxWidth="sm"
        theme={theme}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className={`text-xs leading-relaxed ${textSecondary}`}>
            Enter your registered email and a new password to restore and
            unlock your account.
          </p>

          {resetError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
              {resetError}
            </div>
          )}

          <Input
          theme={theme}
            id="reset-email"
            label="Email Address"
            type="email"
            placeholder="Enter your registered email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            required
            className={fieldClass}
          />

          <Input
          theme={theme}
            id="reset-new-password"
            label="New Password"
            type="password"
            placeholder="Minimum 8 characters"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            required
            className={fieldClass}
          />

          <Input
          theme={theme}
            id="reset-confirm-password"
            label="Confirm New Password"
            type="password"
            placeholder="Confirm your new password"
            value={resetConfirmPassword}
            onChange={(e) => setResetConfirmPassword(e.target.value)}
            required
            className={fieldClass}
          />

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setResetModalOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              size="sm"
              loading={resetLoading}
            >
              Reset & Unlock Account
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default LoginForm;
