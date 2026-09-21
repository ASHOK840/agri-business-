import apiClient from './apiClient';
import type { Buyer, BuyerFormData, BuyerListResponse, BuyerStatus } from '../types/buyer.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export interface BuyerListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: BuyerStatus;
}

export const listBuyers = async (params: BuyerListParams = {}): Promise<BuyerListResponse> => {
  const response = await apiClient.get<BuyerListResponse>('/buyers', { params });
  return response.data;
};

export const getBuyer = async (id: string): Promise<Buyer> => {
  const response = await apiClient.get<ApiEnvelope<Buyer>>(`/buyers/${id}`);
  return response.data.data;
};

export const createBuyer = async (data: Partial<BuyerFormData>): Promise<Buyer> => {
  const response = await apiClient.post<ApiEnvelope<Buyer>>('/buyers', data);
  return response.data.data;
};

export const updateBuyer = async (id: string, data: Partial<BuyerFormData>): Promise<Buyer> => {
  const response = await apiClient.put<ApiEnvelope<Buyer>>(`/buyers/${id}`, data);
  return response.data.data;
};

export const updateBuyerStatus = async (id: string, status: BuyerStatus): Promise<Buyer> => {
  const response = await apiClient.patch<ApiEnvelope<Buyer>>(`/buyers/${id}/status`, { status });
  return response.data.data;
};
