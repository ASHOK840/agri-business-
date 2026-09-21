import apiClient from './apiClient';
import type {
  QualityRecord,
  QualityRecordFormData,
  QualityRecordListResponse,
} from '../types/qualityRecord.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export const listQualityRecords = async (params: {
  page?: number;
  limit?: number;
  purchaseId?: string;
  buyerId?: string;
  qualityStatusId?: string;
} = {}): Promise<QualityRecordListResponse> => {
  const response = await apiClient.get<QualityRecordListResponse>('/quality-records', { params });
  return response.data;
};

export const getQualityRecord = async (id: string): Promise<QualityRecord> => {
  const response = await apiClient.get<ApiEnvelope<QualityRecord>>(`/quality-records/${id}`);
  return response.data.data;
};

// OWNER only — "quality decisions must be recorded by authorized users."
export const createQualityRecord = async (
  data: Partial<QualityRecordFormData>
): Promise<QualityRecord> => {
  const response = await apiClient.post<ApiEnvelope<QualityRecord>>('/quality-records', data);
  return response.data.data;
};

export const updateQualityRecord = async (
  id: string,
  data: Partial<QualityRecordFormData>
): Promise<QualityRecord> => {
  const response = await apiClient.put<ApiEnvelope<QualityRecord>>(
    `/quality-records/${id}`,
    data
  );
  return response.data.data;
};
