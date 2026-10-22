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
  const { setSession } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Enter a valid email address');
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
        <h2 className="text-lg font-semibold text-gray-100">Sign In</h2>
        <p className="text-xs text-gray-400 mt-1">Enter your credentials to access the SOC console</p>
      </div>

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
          label="Email Address"
          type="email"
          placeholder="analyst@cloudsec.local"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
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

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="text-[11px] text-gray-500">Default dev account available</span>
        <span className="text-[11px] text-sky-400 font-mono">admin@cloudsec.local</span>
      </div>

      <Button type="submit" loading={loading} className="w-full">
        Sign In
      </Button>

      <div className="text-center text-xs text-gray-400 pt-2 border-t border-gray-800">
        Don&apos;t have an account?{' '}
        <Link to={ROUTES.SIGNUP} className="text-sky-400 hover:text-sky-300 font-medium">
          Create viewer account
        </Link>
      </div>
    </form>
  );
};
export default LoginForm;
