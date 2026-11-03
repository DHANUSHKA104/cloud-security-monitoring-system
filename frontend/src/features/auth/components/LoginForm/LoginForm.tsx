import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

  // Reset Password Modal State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { addToast } = useAppStore();
  const { user, isAuthenticated, setSession, clearSession } = useAuthStore();

  const handleQuickFill = (role: 'ADMIN' | 'ANALYST') => {
    if (role === 'ADMIN') {
      setEmail('admin@cloudsec.local');
      setPassword('Admin@CloudSec2026!');
    } else {
      setEmail('alice.analyst@cloudsec.local');
      setPassword('Admin@CloudSec2026!');
    }
  };

  const handleDirectDemoLogin = async () => {
    handleQuickFill('ADMIN');
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
        email: 'admin@cloudsec.local',
        password: 'Admin@CloudSec2026!',
      });
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
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(resetPassword)) {
      setResetError('Password must contain at least one special character (!@#$...)');
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

    if (!email) {
      setError('Please enter your full name or email address');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
        email: email.trim(),
        password,
      });

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

  if (showMfa) {
    return (
      <div className="space-y-4">
        <OtpVerification mfaToken={mfaToken || undefined} />
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowMfa(false)}
            className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
          >
            ← Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
        <div>
          <h2 className="text-xl font-bold font-serif text-gray-100 tracking-tight">
            Welcome back!
          </h2>
          <p className="text-xs text-purple-300/80 mt-1 font-light">
            Where vigilant cloud defense meets serene clarity. Step into your command center.
          </p>
        </div>

        {isAuthenticated && user ? (
          <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-lg text-xs text-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span>Currently signed in as: <strong>{user.fullName}</strong></span>
              <span className="text-[10px] font-mono uppercase bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-300">{user.role}</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-emerald-900/40">
              <Link
                to={ROUTES.DASHBOARD}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3 py-1 rounded transition-colors"
              >
                Continue to Dashboard &rarr;
              </Link>
              <button
                type="button"
                onClick={() => clearSession()}
                className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1 underline"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-gradient-to-r from-blue-950/70 via-indigo-950/60 to-purple-950/70 border border-blue-800/60 rounded-lg flex items-center justify-between gap-3 shadow-md">
            <div>
              <div className="text-xs font-semibold text-blue-200">Already signed up or want instant access?</div>
              <div className="text-[11px] text-blue-300/80">Enter command center directly as Administrator</div>
            </div>
            <button
              type="button"
              onClick={handleDirectDemoLogin}
              disabled={loading}
              className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded shadow transition-all whitespace-nowrap"
            >
              Continue to Dashboard &rarr;
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-md"
          >
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Input
            id="email-input"
            label="Full Name or Email Address"
            type="text"
            placeholder="e.g., Alice Analyst or admin@cloudsec.local"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />

          <Input
            id="password-input"
            label="Password"
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <div className="flex items-center justify-between text-xs pt-0.5">
            <span className="text-[11px] text-gray-500">Forgot your password?</span>
            <button
              type="button"
              onClick={() => {
                setResetEmail(email || '');
                setResetError(null);
                setResetModalOpen(true);
              }}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium underline transition-colors"
            >
              Reset Password
            </button>
          </div>
        </div>

        {/* Quick Fill Demo Helpers */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
          <span className="text-[11px] text-gray-500">Quick Demo Fill:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickFill('ADMIN')}
              className="text-[11px] px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-purple-300 border border-purple-900/40 font-mono transition-colors"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('ANALYST')}
              className="text-[11px] px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-sky-300 border border-sky-900/40 font-mono transition-colors"
            >
              Analyst
            </button>
            <button
              type="button"
              onClick={handleDirectDemoLogin}
              className="text-[11px] px-2.5 py-0.5 rounded bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium shadow-sm transition-all"
            >
              Instant Enter &rarr;
            </button>
          </div>
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Sign In
        </Button>

        <div className="text-center text-xs text-gray-400 pt-3 border-t border-gray-800">
          Don&apos;t have an account?{' '}
          <Link to={ROUTES.SIGNUP} className="text-sky-400 hover:text-sky-300 font-medium underline">
            Create new account (Sign Up)
          </Link>
        </div>
      </form>

      {/* Self-Service Password Reset Modal */}
      <Modal
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset Account Password"
        maxWidth="sm"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-xs text-gray-400">
            Enter your registered email and a new password to immediately restore and unlock your account.
          </p>

          {resetError && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-md">
              {resetError}
            </div>
          )}

          <Input
            id="reset-email"
            label="Email Address"
            type="email"
            placeholder="e.g. dhanushka1042007@gmail.com"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            required
          />

          <Input
            id="reset-new-password"
            label="New Password (min 8 chars, 1 uppercase, 1 special char)"
            type="password"
            placeholder="••••••••••••"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            required
          />

          <Input
            id="reset-confirm-password"
            label="Confirm New Password"
            type="password"
            placeholder="••••••••••••"
            value={resetConfirmPassword}
            onChange={(e) => setResetConfirmPassword(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
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
