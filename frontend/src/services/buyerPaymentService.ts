import apiClient from './apiClient';
import type {
  BuyerPayment,
  BuyerPaymentFormData,
  BuyerPaymentListResponse,
  SalePaymentSummary,
  PaymentMethod,
} from '../types/buyerPayment.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export const listBuyerPayments = async (params: {
  search?: string;
  saleId?: string;
  buyerId?: string;
  cropId?: string;
  paymentMethod?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}): Promise<BuyerPaymentListResponse> => {
  const response = await apiClient.get<BuyerPaymentListResponse>('/buyer-payments', { params });
  return response.data;
};

export const getSalePaymentSummary = async (saleId: string): Promise<SalePaymentSummary> => {
  const response = await apiClient.get<ApiEnvelope<SalePaymentSummary>>(
    `/buyer-payments/summary/${saleId}`
  );
  return response.data.data;
};

// There is no update function here — by design. A payment is immutable
// once recorded; a correction is a new payment row, never an edit.
export const createBuyerPayment = async (
  data: Partial<BuyerPaymentFormData>
): Promise<BuyerPayment> => {
  const response = await apiClient.post<ApiEnvelope<BuyerPayment>>('/buyer-payments', data);
  return response.data.data;
};
