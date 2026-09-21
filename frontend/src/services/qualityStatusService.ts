import apiClient from './apiClient';
import type {
  QualityStatus,
  QualityStatusFormData,
  QualityStatusListResponse,
  MasterStatus,
} from '../types/qualityStatus.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export const listQualityStatuses = async (params: {
  page?: number;
  limit?: number;
  status?: MasterStatus;
} = {}): Promise<QualityStatusListResponse> => {
  const response = await apiClient.get<QualityStatusListResponse>('/quality-statuses', { params });
  return response.data;
};

export const getQualityStatus = async (id: string): Promise<QualityStatus> => {
  const response = await apiClient.get<ApiEnvelope<QualityStatus>>(`/quality-statuses/${id}`);
  return response.data.data;
};

export const createQualityStatus = async (
  data: Partial<QualityStatusFormData>
): Promise<QualityStatus> => {
  const response = await apiClient.post<ApiEnvelope<QualityStatus>>('/quality-statuses', data);
  return response.data.data;
};

export const updateQualityStatus = async (
  id: string,
  data: Partial<QualityStatusFormData>
): Promise<QualityStatus> => {
  const response = await apiClient.put<ApiEnvelope<QualityStatus>>(
    `/quality-statuses/${id}`,
    data
  );
  return response.data.data;
};

export const updateQualityStatusStatus = async (
  id: string,
  status: MasterStatus
): Promise<QualityStatus> => {
  const response = await apiClient.patch<ApiEnvelope<QualityStatus>>(
    `/quality-statuses/${id}/status`,
    { status }
  );
  return response.data.data;
};
