import apiClient from './apiClient';
import type {
  SaleSettlement,
  SaleSettlementFormData,
  SaleSettlementListResponse,
} from '../types/saleSettlement.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export const listSaleSettlements = async (params: {
  saleId?: string;
  page?: number;
  limit?: number;
}): Promise<SaleSettlementListResponse> => {
  const response = await apiClient.get<SaleSettlementListResponse>('/sale-settlements', {
    params,
  });
  return response.data;
};

export const getSaleSettlementForSale = async (saleId: string): Promise<SaleSettlement | null> => {
  try {
    const response = await apiClient.get<ApiEnvelope<SaleSettlement>>(
      `/sale-settlements/by-sale/${saleId}`
    );
    return response.data.data;
  } catch (error: any) {
    if (error?.response?.status === 404) return null;
    throw error;
  }
};

// There is no update function here — by design. A settlement is
// immutable once recorded; a correction is a new adjustmentAmount /
// adjustmentReason at creation time, not an edit of a past record.
export const createSaleSettlement = async (
  data: Partial<SaleSettlementFormData>
): Promise<SaleSettlement> => {
  const response = await apiClient.post<ApiEnvelope<SaleSettlement>>('/sale-settlements', data);
  return response.data.data;
};
