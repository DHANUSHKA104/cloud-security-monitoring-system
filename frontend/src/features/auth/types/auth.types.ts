import { User } from '@/types/models.types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken?: string;
  expiresIn?: number;
  user?: User;
  mfaRequired?: boolean;
  mfaToken?: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface MfaVerifyRequest {
  mfaToken: string;
  code: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
