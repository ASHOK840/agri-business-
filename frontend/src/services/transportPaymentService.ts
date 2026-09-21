import apiClient from './apiClient';
import type {
  TransportPayment,
  TransportPaymentFormData,
  TransportPaymentListResponse,
  TransportRecordPaymentSummary,
  PaymentMethod,
} from '../types/transportPayment.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export const listTransportPayments = async (params: {
  search?: string;
  transportRecordId?: string;
  transporterId?: string;
  paymentMethod?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}): Promise<TransportPaymentListResponse> => {
  const response = await apiClient.get<TransportPaymentListResponse>('/transport-payments', {
    params,
  });
  return response.data;
};

export const getTransportRecordPaymentSummary = async (
  transportRecordId: string
): Promise<TransportRecordPaymentSummary> => {
  const response = await apiClient.get<ApiEnvelope<TransportRecordPaymentSummary>>(
    `/transport-payments/summary/${transportRecordId}`
  );
  return response.data.data;
};

// There is no update function here — by design. A payment is immutable
// once recorded; a correction is a new payment row, never an edit.
export const createTransportPayment = async (
  data: Partial<TransportPaymentFormData>
): Promise<TransportPayment> => {
  const response = await apiClient.post<ApiEnvelope<TransportPayment>>('/transport-payments', data);
  return response.data.data;
};
