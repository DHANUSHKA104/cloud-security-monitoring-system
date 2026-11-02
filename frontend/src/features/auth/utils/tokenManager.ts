let accessToken: string | null = null;
let refreshTimer: NodeJS.Timeout | null = null;

const STORAGE_KEY = 'cs_access_token';

export const tokenManager = {
  get: (): string | null => {
    if (accessToken) return accessToken;
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string | null, expiresInSeconds?: number, onRefresh?: () => void) => {
    accessToken = token;
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEY, token);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
    if (token && expiresInSeconds && expiresInSeconds > 60 && onRefresh) {
      // Schedule silent refresh 1 minute before expiry
      const delayMs = (expiresInSeconds - 60) * 1000;
      refreshTimer = setTimeout(() => {
        onRefresh();
      }, delayMs);
    }
  },
  clear: () => {
    accessToken = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
  },
};
