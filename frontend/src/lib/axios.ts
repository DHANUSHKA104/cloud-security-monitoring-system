import axios from 'axios';
import { ENV } from '@/config/env';
import { tokenManager } from '@/features/auth/utils/tokenManager';

export const rawAxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Interceptor to normalize path & attach Bearer token
rawAxiosInstance.interceptors.request.use(
  (config) => {
    // If URL starts with '/api/', strip '/api' prefix to prevent doubling with baseURL
    if (config.url && config.url.startsWith('/api/')) {
      config.url = config.url.substring(4);
    } else if (config.url && config.url.startsWith('/api?')) {
      config.url = config.url.substring(4);
    }

    const token = tokenManager.get();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to extract backend ErrorResponse
rawAxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data;
    const message = data?.message || error.message || 'An unexpected error occurred';
    const code = data?.code || 'INTERNAL_ERROR';

    const enhancedError = new Error(message) as Error & { code?: string; status?: number; data?: unknown };
    enhancedError.code = code;
    enhancedError.status = error.response?.status;
    enhancedError.data = data;

    return Promise.reject(enhancedError);
  }
);
