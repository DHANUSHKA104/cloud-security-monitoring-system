import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { LoginRequest, LoginResponse } from '../types/auth.types';
import { useAuthStore } from '@/store/useAuthStore';
import { ROUTES } from '@/constants/routes.constants';

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setSession } = useAuthStore();
  const navigate = useNavigate();

  const login = async (credentials: LoginRequest): Promise<LoginResponse | undefined> => {
    try {
      setLoading(true);
      setError(null);
      const res = await authService.login(credentials);
      if (res.user && res.accessToken) {
        setSession(res.user, res.accessToken, res.expiresIn);
        navigate(ROUTES.DASHBOARD);
      }
      return res;
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
};
