import apiClient from './apiClient';
import type { Dashboard } from '../types/dashboard.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export const getDashboard = async (): Promise<Dashboard> => {
  const response = await apiClient.get<ApiEnvelope<Dashboard>>('/dashboard');
  return response.data.data;
};
