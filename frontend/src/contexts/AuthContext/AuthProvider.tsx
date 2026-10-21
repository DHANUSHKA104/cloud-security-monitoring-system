import React, { useEffect, ReactNode, useCallback } from 'react';
import { AuthContext, AuthContextType } from './AuthContext';
import { useAuthStore } from '@/store/useAuthStore';
import { apiClient } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/constants/api.constants';
import { User, Role } from '@/types';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading, setSession, clearSession, setLoading } =
    useAuthStore();

  const handleLogout = useCallback(async () => {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch {
      // Ignore network failure on logout
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const hasRole = useCallback(
    (requiredRole: Role | Role[]): boolean => {
      if (!user) return false;
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      // Role hierarchy: ADMIN > ANALYST > VIEWER
      if (user.role === 'ADMIN') return true;
      if (user.role === 'ANALYST') return roles.includes('ANALYST') || roles.includes('VIEWER');
      return roles.includes('VIEWER');
    },
    [user]
  );

  useEffect(() => {
    // Attempt silent refresh on startup
    const initAuth = async () => {
      try {
        setLoading(true);
        // Refresh token from HttpOnly cookie
        const refreshRes = await apiClient.post<{ accessToken: string; expiresIn: number }>(
          API_ENDPOINTS.AUTH.REFRESH
        );
        // Fetch current user details
        const meRes = await apiClient.get<User>(API_ENDPOINTS.AUTH.ME, {
          headers: { Authorization: `Bearer ${refreshRes.accessToken}` },
        });
        setSession(meRes, refreshRes.accessToken, refreshRes.expiresIn);
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [clearSession, setSession, setLoading]);

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    hasRole,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
