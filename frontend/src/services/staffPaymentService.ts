import apiClient from './apiClient';
import type {
  StaffPayment,
  StaffPaymentFormData,
  StaffPaymentListResponse,
  AssignmentPaymentSummary,
  PaymentMethod,
} from '../types/staffPayment.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export const listStaffPayments = async (params: {
  search?: string;
  assignmentId?: string;
  staffId?: string;
  paymentMethod?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}): Promise<StaffPaymentListResponse> => {
  const response = await apiClient.get<StaffPaymentListResponse>('/staff-payments', { params });
  return response.data;
};

export const getAssignmentPaymentSummary = async (
  assignmentId: string
): Promise<AssignmentPaymentSummary> => {
  const response = await apiClient.get<ApiEnvelope<AssignmentPaymentSummary>>(
    `/staff-payments/summary/${assignmentId}`
  );
  return response.data.data;
};

// There is no update function here — by design. A payment is immutable
// once recorded; a correction is a new payment row, never an edit.
export const createStaffPayment = async (
  data: Partial<StaffPaymentFormData>
): Promise<StaffPayment> => {
  const response = await apiClient.post<ApiEnvelope<StaffPayment>>('/staff-payments', data);
  return response.data.data;
};
