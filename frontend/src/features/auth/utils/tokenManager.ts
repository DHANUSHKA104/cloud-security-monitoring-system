let accessToken: string | null = null;
let refreshTimer: NodeJS.Timeout | null = null;

export const tokenManager = {
  get: (): string | null => accessToken,
  set: (token: string | null, expiresInSeconds?: number, onRefresh?: () => void) => {
    accessToken = token;
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
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
  },
};
