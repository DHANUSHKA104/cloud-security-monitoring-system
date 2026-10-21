import { create } from 'zustand';
import { User } from '@/types/models.types';
import { tokenManager } from '@/features/auth/utils/tokenManager';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (user: User, token?: string, expiresIn?: number) => void;
  clearSession: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // starts true during silent refresh / me check
  setSession: (user, token, expiresIn) => {
    if (token) {
      tokenManager.set(token, expiresIn);
    }
    set({ user, isAuthenticated: true, isLoading: false });
  },
  clearSession: () => {
    tokenManager.clear();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
  setLoading: (loading) => set({ isLoading: loading }),
}));
