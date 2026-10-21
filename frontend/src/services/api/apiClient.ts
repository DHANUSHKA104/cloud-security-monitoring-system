import { AxiosRequestConfig } from 'axios';
import { rawAxiosInstance } from '@/lib/axios';

export const apiClient = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await rawAxiosInstance.get<T>(url, config);
    return response.data;
  },

  post: async <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> => {
    const response = await rawAxiosInstance.post<T>(url, data, config);
    return response.data;
  },

  put: async <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> => {
    const response = await rawAxiosInstance.put<T>(url, data, config);
    return response.data;
  },

  patch: async <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> => {
    const response = await rawAxiosInstance.patch<T>(url, data, config);
    return response.data;
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await rawAxiosInstance.delete<T>(url, config);
    return response.data;
  },
};
