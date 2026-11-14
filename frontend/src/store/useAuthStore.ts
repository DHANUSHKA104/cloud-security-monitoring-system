import { create } from 'zustand';
import { User } from '@/types/models.types';
import { tokenManager } from '@/features/auth/utils/tokenManager';

const USER_STORAGE_KEY = 'cs_user';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (user: User, token?: string, expiresIn?: number) => void;
  clearSession: () => void;
  setLoading: (loading: boolean) => void;
}

const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialUser = getStoredUser();
const initialToken = tokenManager.get();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  isAuthenticated: Boolean(initialUser && initialToken),
  isLoading: false,
  setSession: (user, token, expiresIn) => {
    if (token) {
      tokenManager.set(token, expiresIn);
    }
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // Ignore storage errors in restricted contexts
    }
    set({ user, isAuthenticated: true, isLoading: false });
  },
  clearSession: () => {
    tokenManager.clear();
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {
      // Ignore
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
  setLoading: (loading) => set({ isLoading: loading }),
}));
