import apiClient from './apiClient';
import type { ManagedUser, CreateUserInput } from '../types/user.types';
import type { UserRole } from '../types/auth.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export const listUsers = async (role?: UserRole): Promise<ManagedUser[]> => {
  const response = await apiClient.get<ApiEnvelope<ManagedUser[]>>('/users', {
    params: role ? { role } : undefined,
  });
  return response.data.data;
};

export const createUser = async (data: CreateUserInput): Promise<ManagedUser> => {
  const response = await apiClient.post<ApiEnvelope<ManagedUser>>('/users', data);
  return response.data.data;
};

export const updateUserStatus = async (id: string, isActive: boolean): Promise<ManagedUser> => {
  const response = await apiClient.patch<ApiEnvelope<ManagedUser>>(`/users/${id}/status`, {
    isActive,
  });
  return response.data.data;
};

export const resetUserPassword = async (id: string, password: string): Promise<ManagedUser> => {
  const response = await apiClient.patch<ApiEnvelope<ManagedUser>>(`/users/${id}/password`, {
    password,
  });
  return response.data.data;
};
