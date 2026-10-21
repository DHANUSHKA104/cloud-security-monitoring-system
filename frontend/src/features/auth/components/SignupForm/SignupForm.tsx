import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/constants/routes.constants';
import { apiClient } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/constants/api.constants';
import { useAppStore } from '@/store/useAppStore';

export const SignupForm: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 2 || fullName.trim().length > 100) {
      setError('Enter your full name (2 to 100 characters)');
      return;
    }
    if (!email) {
      setError('Enter a valid email address');
      return;
    }
    if (password.length < 10 || password.length > 72 || password === email) {
      setError('Password must be 10 to 72 characters and different from your email');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post(API_ENDPOINTS.AUTH.SIGNUP, {
        fullName,
        email,
        password,
      });

      addToast({
        type: 'success',
        message: 'Account created successfully! Please sign in.',
      });
      navigate(ROUTES.LOGIN);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-100">Create Account</h2>
        <p className="text-xs text-gray-400 mt-1">Sign up for read-only access as a Viewer</p>
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
          label="Full Name"
          placeholder="Ravi Kumar"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <Input
          id="signup-email-input"
          label="Email Address"
          type="email"
          placeholder="user@cloudsec.local"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          id="signup-password-input"
          label="Password (min 10 chars)"
          type="password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Input
          id="confirm-password-input"
          label="Confirm Password"
          type="password"
          placeholder="••••••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      <Button type="submit" loading={loading} className="w-full">
        Sign Up
      </Button>

      <div className="text-center text-xs text-gray-400 pt-2">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="text-blue-400 hover:underline font-medium">
          Sign In
        </Link>
      </div>
    </form>
  );
};
