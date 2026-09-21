import apiClient from './apiClient';
import type {
  TransportRecord,
  TransportRecordFormData,
  TransportRecordListResponse,
  TransportDirection,
  TransportStatus,
} from '../types/transportRecord.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export interface TransportListParams {
  page?: number;
  limit?: number;
  search?: string;
  direction?: TransportDirection;
  purchaseId?: string;
  farmerId?: string;
  buyerId?: string;
  cropId?: string;
  status?: TransportStatus;
  dateFrom?: string;
  dateTo?: string;
}

export const listTransportRecords = async (
  params: TransportListParams = {}
): Promise<TransportRecordListResponse> => {
  const response = await apiClient.get<TransportRecordListResponse>('/transport-records', {
    params,
  });
  return response.data;
};

export const getTransportCostSummary = async (params: {
  purchaseId?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<{ recordCount: number; totalTransportCost: number }> => {
  const response = await apiClient.get<ApiEnvelope<{ recordCount: number; totalTransportCost: number }>>(
    '/transport-records/cost-summary',
    { params }
  );
  return response.data.data;
};

export const getTransportRecord = async (id: string): Promise<TransportRecord> => {
  const response = await apiClient.get<ApiEnvelope<TransportRecord>>(`/transport-records/${id}`);
  return response.data.data;
};

// The TRANSPORTATION role's entire "My Trips" list — server-side filtered
// to this user's own assigned, active trips.
export const listMyTransportRecords = async (): Promise<TransportRecord[]> => {
  const response = await apiClient.get<ApiEnvelope<TransportRecord[]>>(
    '/transport-records/my-trips'
  );
  return response.data.data;
};

export const createTransportRecord = async (
  data: Partial<TransportRecordFormData>
): Promise<TransportRecord> => {
  const response = await apiClient.post<ApiEnvelope<TransportRecord>>('/transport-records', data);
  return response.data.data;
};

export const updateTransportRecord = async (
  id: string,
  data: Partial<TransportRecordFormData>
): Promise<TransportRecord> => {
  const response = await apiClient.put<ApiEnvelope<TransportRecord>>(
    `/transport-records/${id}`,
    data
  );
  return response.data.data;
};

export const updateTransportStatus = async (
  id: string,
  status: TransportStatus
): Promise<TransportRecord> => {
  const response = await apiClient.patch<ApiEnvelope<TransportRecord>>(
    `/transport-records/${id}/status`,
    { status }
  );
  return response.data.data;
};
