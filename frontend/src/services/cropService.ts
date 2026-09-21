import apiClient from './apiClient';
import type { Crop, CropFormData, CropListResponse, CropStatus } from '../types/crop.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export interface CropListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CropStatus;
}

export const listCrops = async (params: CropListParams = {}): Promise<CropListResponse> => {
  const response = await apiClient.get<CropListResponse>('/crops', { params });
  return response.data;
};

export const getCrop = async (id: string): Promise<Crop> => {
  const response = await apiClient.get<ApiEnvelope<Crop>>(`/crops/${id}`);
  return response.data.data;
};

export const createCrop = async (data: CropFormData): Promise<Crop> => {
  const response = await apiClient.post<ApiEnvelope<Crop>>('/crops', data);
  return response.data.data;
};

export const updateCrop = async (id: string, data: CropFormData): Promise<Crop> => {
  const response = await apiClient.put<ApiEnvelope<Crop>>(`/crops/${id}`, data);
  return response.data.data;
};

export const updateCropStatus = async (id: string, status: CropStatus): Promise<Crop> => {
  const response = await apiClient.patch<ApiEnvelope<Crop>>(`/crops/${id}/status`, { status });
  return response.data.data;
};
