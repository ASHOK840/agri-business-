import apiClient from './apiClient';
import type {
  WeighingRecord,
  WeighingRecordFormData,
  WeighingRecordListResponse,
} from '../types/weighingRecord.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export const listWeighingRecords = async (params: {
  purchaseId?: string;
  page?: number;
  limit?: number;
}): Promise<WeighingRecordListResponse> => {
  const response = await apiClient.get<WeighingRecordListResponse>('/weighing-records', {
    params,
  });
  return response.data;
};

// There is no update function here — by design. A re-weigh or
// correction means calling createWeighingRecord() again with a new
// weighingDate, never editing a past record.
export const createWeighingRecord = async (
  data: Partial<WeighingRecordFormData>
): Promise<WeighingRecord> => {
  const response = await apiClient.post<ApiEnvelope<WeighingRecord>>('/weighing-records', data);
  return response.data.data;
};
