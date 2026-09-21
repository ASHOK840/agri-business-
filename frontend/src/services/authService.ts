import apiClient from './apiClient';
import type { LoginResponse, AuthUser } from '../types/auth.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export const loginRequest = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await apiClient.post<ApiEnvelope<LoginResponse>>('/auth/login', {
    email,
    password,
  });
  return response.data.data;
};

export const fetchCurrentUser = async (): Promise<AuthUser> => {
  const response = await apiClient.get<ApiEnvelope<AuthUser>>('/auth/me');
  return response.data.data;
};
