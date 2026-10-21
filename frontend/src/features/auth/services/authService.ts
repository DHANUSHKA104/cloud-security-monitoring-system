import { apiClient } from '@/services/api/apiClient';
import { API_ENDPOINTS } from '@/constants/api.constants';
import {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  MfaVerifyRequest,
  ChangePasswordRequest,
} from '../types/auth.types';
import { User } from '@/types/models.types';

export const authService = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, data),

  signup: (data: SignupRequest) =>
    apiClient.post<void>(API_ENDPOINTS.AUTH.SIGNUP, data),

  verifyMfa: (data: MfaVerifyRequest) =>
    apiClient.post<{ accessToken: string; expiresIn: number; user: User }>(
      API_ENDPOINTS.AUTH.MFA_VERIFY,
      data
    ),

  refresh: () =>
    apiClient.post<{ accessToken: string; expiresIn: number }>(
      API_ENDPOINTS.AUTH.REFRESH
    ),

  logout: () => apiClient.post<void>(API_ENDPOINTS.AUTH.LOGOUT),

  me: () => apiClient.get<User>(API_ENDPOINTS.AUTH.ME),

  enableMfa: () =>
    apiClient.post<{ secret: string; qrCodeUri?: string }>(
      API_ENDPOINTS.AUTH.MFA_ENABLE
    ),

  disableMfa: () => apiClient.post<void>(API_ENDPOINTS.AUTH.MFA_DISABLE),

  changePassword: (data: ChangePasswordRequest) =>
    apiClient.post<void>(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data),
};
