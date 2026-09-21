import apiClient from './apiClient';
import type {
  CropPrice,
  CropPriceFormData,
  CropPriceListResponse,
} from '../types/cropPrice.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export interface CropPriceListParams {
  page?: number;
  limit?: number;
  cropId?: string;
  buyerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const listCropPrices = async (
  params: CropPriceListParams = {}
): Promise<CropPriceListResponse> => {
  const response = await apiClient.get<CropPriceListResponse>('/crop-prices', { params });
  return response.data;
};

export const getLatestCropPrices = async (params: {
  cropId?: string;
  buyerId?: string;
}): Promise<CropPrice[]> => {
  const response = await apiClient.get<ApiEnvelope<CropPrice[]>>('/crop-prices/latest', {
    params,
  });
  return response.data.data;
};

export const getCropPrice = async (id: string): Promise<CropPrice> => {
  const response = await apiClient.get<ApiEnvelope<CropPrice>>(`/crop-prices/${id}`);
  return response.data.data;
};

// There is no update function here — by design. Recording a correction
// means calling createCropPrice() again with a new effectiveDate.
export const createCropPrice = async (
  data: Partial<CropPriceFormData>
): Promise<CropPrice> => {
  const response = await apiClient.post<ApiEnvelope<CropPrice>>('/crop-prices', data);
  return response.data.data;
};
