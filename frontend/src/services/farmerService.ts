import apiClient from './apiClient';
import type {
  Farmer,
  FarmerFormData,
  FarmerListResponse,
  FarmerStatus,
} from '../types/farmer.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export interface FarmerListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: FarmerStatus;
}

export const listFarmers = async (params: FarmerListParams = {}): Promise<FarmerListResponse> => {
  const response = await apiClient.get<FarmerListResponse>('/farmers', { params });
  return response.data;
};

export const getFarmer = async (id: string): Promise<Farmer> => {
  const response = await apiClient.get<ApiEnvelope<Farmer>>(`/farmers/${id}`);
  return response.data.data;
};

export const createFarmer = async (
  data: Partial<FarmerFormData> & { force?: boolean }
): Promise<Farmer> => {
  const response = await apiClient.post<ApiEnvelope<Farmer>>('/farmers', data);
  return response.data.data;
};

export const updateFarmer = async (
  id: string,
  data: Partial<FarmerFormData>
): Promise<Farmer> => {
  const response = await apiClient.put<ApiEnvelope<Farmer>>(`/farmers/${id}`, data);
  return response.data.data;
};

export const updateFarmerStatus = async (id: string, status: FarmerStatus): Promise<Farmer> => {
  const response = await apiClient.patch<ApiEnvelope<Farmer>>(`/farmers/${id}/status`, {
    status,
  });
  return response.data.data;
};
