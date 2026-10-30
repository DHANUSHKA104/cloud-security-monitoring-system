import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/constants/routes.constants';
import { apiClient } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/constants/api.constants';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { User } from '@/types';

interface LoginResponse {
  accessToken?: string;
  expiresIn?: number;
  user?: User;
  mfaRequired?: boolean;
  mfaToken?: string;
}

export const SignupForm: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { addToast } = useAppStore();
  const { setSession } = useAuthStore();

  // Password rules validation
  const hasMinLength = password.length >= 8;
  const hasCapital = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password);
  const isMatch = password.length > 0 && password === confirmPassword;

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
      setError('Password must contain at least one special character (!@#$...)');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      // 1. Sign up the user
      await apiClient.post(API_ENDPOINTS.AUTH.SIGNUP, {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      // 2. Immediately log them in seamlessly
      try {
        const loginRes = await apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
          email: email.trim().toLowerCase(),
          password,
        });

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
        // If auto-login fails, redirect to login page with clear instructions
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-xl font-bold font-serif text-gray-100 tracking-tight">
          Join the CloudSec Defense
        </h2>
        <p className="text-xs text-purple-300/80 mt-1 font-light">
          Empower your cloud security journey. Build a safer, more resilient digital world.
        </p>
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
          id="fullname-input"
          label="Your Full Name"
          placeholder="e.g., Alex Johnson"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <Input
          id="signup-email-input"
          label="Email Address"
          type="email"
          placeholder="e.g., alex@cloudsec.local"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          id="signup-password-input"
          label="Create Password"
          type="password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* Real-time Password Requirements Checklist */}
        <div className="p-2.5 rounded bg-gray-950 border border-gray-800 text-[11px] space-y-1">
          <div className="text-gray-400 font-medium mb-1">Password requirements:</div>
          <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400' : 'text-gray-500'}`}>
            <span>{hasMinLength ? '✓' : '○'}</span>
            <span>At least 8 characters</span>
          </div>
          <div className={`flex items-center gap-1.5 ${hasCapital ? 'text-emerald-400' : 'text-gray-500'}`}>
            <span>{hasCapital ? '✓' : '○'}</span>
            <span>At least 1 capital letter (A-Z)</span>
          </div>
          <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-400' : 'text-gray-500'}`}>
            <span>{hasSpecial ? '✓' : '○'}</span>
            <span>At least 1 special character (!@#$%^&*...)</span>
          </div>
        </div>

        <Input
          id="confirm-password-input"
          label="Confirm Password"
          type="password"
          placeholder="••••••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {confirmPassword && !isMatch && (
          <div className="text-[11px] text-red-400">Passwords do not match</div>
        )}
      </div>

      <Button
        type="submit"
        loading={loading}
        disabled={!hasMinLength || !hasCapital || !hasSpecial || !isMatch || loading}
        className="w-full"
      >
        Sign Up & Access Dashboard
      </Button>

      <div className="text-center text-xs text-gray-400 pt-2 border-t border-gray-800">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="text-sky-400 hover:text-sky-300 font-medium underline">
          Sign In here
        </Link>
      </div>
    </form>
  );
};
export default SignupForm;
