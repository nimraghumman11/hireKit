import api from './api';
import type { AuthUser } from '@/store/authStore';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const authService = {
  login: (payload: LoginPayload): Promise<AuthResponse> =>
    api.post('/auth/login', payload),

  register: (payload: RegisterPayload): Promise<AuthResponse> =>
    api.post('/auth/register', payload),
};
