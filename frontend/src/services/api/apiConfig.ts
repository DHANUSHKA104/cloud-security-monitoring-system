import { ENV } from '@/config/env';

export const API_CONFIG = {
  baseURL: ENV.API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
} as const;
