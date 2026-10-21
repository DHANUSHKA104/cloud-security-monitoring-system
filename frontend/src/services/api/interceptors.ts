import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { rawAxiosInstance } from '@/lib/axios';
import { tokenManager } from '@/features/auth/utils/tokenManager';
import { ApiError } from '@/types/api.types';
import { API_ENDPOINTS } from '@/constants/api.constants';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

export function setupInterceptors() {
  // Request interceptor: Attach Bearer token
  rawAxiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = tokenManager.get();
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor: Refresh token on 401
  rawAxiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Normalize error shape
      const responseData = error.response?.data as Partial<ApiError> | undefined;
      const normalizedError: ApiError = {
        timestamp: responseData?.timestamp || new Date().toISOString(),
        status: error.response?.status || 500,
        error: responseData?.error || error.name || 'Internal Error',
        code: responseData?.code || 'INTERNAL_ERROR',
        message: responseData?.message || error.message || 'An unexpected error occurred',
        path: responseData?.path || originalRequest?.url || '',
        details: responseData?.details || [],
      };

      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !originalRequest.url?.includes(API_ENDPOINTS.AUTH.LOGIN) &&
        !originalRequest.url?.includes(API_ENDPOINTS.AUTH.REFRESH)
      ) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => rawAxiosInstance(originalRequest))
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Attempt silent refresh via HttpOnly cookie
          const refreshRes = await axios.post(
            `${rawAxiosInstance.defaults.baseURL}${API_ENDPOINTS.AUTH.REFRESH}`,
            {},
            { withCredentials: true }
          );

          const { accessToken, expiresIn } = refreshRes.data;
          tokenManager.set(accessToken, expiresIn);
          processQueue(null);
          return rawAxiosInstance(originalRequest);
        } catch (refreshErr) {
          processQueue(refreshErr as Error);
          tokenManager.clear();
          return Promise.reject(normalizedError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(normalizedError);
    }
  );
}
