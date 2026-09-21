import apiClient from './apiClient';
import type { Sale, SaleListResponse, SaleStatus, CreateSaleFormData } from '../types/sale.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export interface SaleListParams {
  page?: number;
  limit?: number;
  search?: string;
  buyerId?: string;
  cropId?: string;
  warehouseId?: string;
  status?: SaleStatus;
  dateFrom?: string;
  dateTo?: string;
}

export const listSales = async (params: SaleListParams = {}): Promise<SaleListResponse> => {
  const response = await apiClient.get<SaleListResponse>('/sales', { params });
  return response.data;
};

export const getSale = async (id: string): Promise<Sale> => {
  const response = await apiClient.get<ApiEnvelope<Sale>>(`/sales/${id}`);
  return response.data.data;
};

export const createSale = async (data: Partial<CreateSaleFormData>): Promise<Sale> => {
  const response = await apiClient.post<ApiEnvelope<Sale>>('/sales', data);
  return response.data.data;
};

export const updateSaleStatus = async (id: string, status: SaleStatus): Promise<Sale> => {
  const response = await apiClient.patch<ApiEnvelope<Sale>>(`/sales/${id}/status`, { status });
  return response.data.data;
};
