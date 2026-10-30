import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/constants/routes.constants';
import { apiClient } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/constants/api.constants';
import { useAuthStore } from '@/store/useAuthStore';
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

  const navigate = useNavigate();
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
        email,
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
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
      <div>
        <h2 className="text-xl font-bold font-serif text-gray-100 tracking-tight">
          Welcome back!
        </h2>
        <p className="text-xs text-purple-300/80 mt-1 font-light">
          Where vigilant cloud defense meets serene clarity. Step into your command center.
        </p>
      </div>

      {isAuthenticated && user && (
        <div className="p-3 bg-blue-950/40 border border-blue-900/60 rounded-md text-xs text-blue-200 space-y-2">
          <div className="flex items-center justify-between">
            <span>Currently signed in as: <strong>{user.fullName}</strong></span>
            <span className="text-[10px] font-mono uppercase bg-blue-900/60 px-1.5 py-0.5 rounded">{user.role}</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-blue-900/40">
            <Link
              to={ROUTES.DASHBOARD}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium px-2.5 py-1 rounded transition-colors"
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
  );
};
export default LoginForm;
