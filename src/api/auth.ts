import api from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  createdAt: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<ApiEnvelope<AuthResponse>>('/auth/login', data),

  register: (data: RegisterRequest) =>
    api.post<ApiEnvelope<AuthResponse>>('/auth/register', data),

  getProfile: () =>
    api.get<ApiEnvelope<UserProfile>>('/users/me'),

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};