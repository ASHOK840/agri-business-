import apiClient from './apiClient';
import type {
  Purchase,
  PurchaseListResponse,
  PurchaseStatus,
  CreatePurchaseFormData,
  UpdatePurchaseFormData,
} from '../types/purchase.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export interface PurchaseListParams {
  page?: number;
  limit?: number;
  search?: string;
  farmerId?: string;
  cropId?: string;
  status?: PurchaseStatus;
  dateFrom?: string;
  dateTo?: string;
}

export const listPurchases = async (
  params: PurchaseListParams = {}
): Promise<PurchaseListResponse> => {
  const response = await apiClient.get<PurchaseListResponse>('/purchases', { params });
  return response.data;
};

export const getPurchase = async (id: string): Promise<Purchase> => {
  const response = await apiClient.get<ApiEnvelope<Purchase>>(`/purchases/${id}`);
  return response.data.data;
};

export const createPurchase = async (
  data: Partial<CreatePurchaseFormData>
): Promise<Purchase> => {
  const response = await apiClient.post<ApiEnvelope<Purchase>>('/purchases', data);
  return response.data.data;
};

// Note: this can never send farmerId, cropId, or purchaseRatePerKg —
// UpdatePurchaseFormData doesn't have those fields, by design.
export const updatePurchase = async (
  id: string,
  data: Partial<UpdatePurchaseFormData>
): Promise<Purchase> => {
  const response = await apiClient.put<ApiEnvelope<Purchase>>(`/purchases/${id}`, data);
  return response.data.data;
};

export const updatePurchaseStatus = async (
  id: string,
  status: PurchaseStatus
): Promise<Purchase> => {
  const response = await apiClient.patch<ApiEnvelope<Purchase>>(`/purchases/${id}/status`, {
    status,
  });
  return response.data.data;
};
