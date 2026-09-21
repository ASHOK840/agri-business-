import apiClient from './apiClient';
import type { StaffEntry, CreateStaffEntryInput } from '../types/staffEntry.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export const createStaffEntry = async (data: CreateStaffEntryInput): Promise<StaffEntry> => {
  const response = await apiClient.post<ApiEnvelope<StaffEntry>>('/staff-entries', data);
  return response.data.data;
};

export const listMyStaffEntries = async (limit = 20): Promise<StaffEntry[]> => {
  const response = await apiClient.get<ApiEnvelope<StaffEntry[]>>('/staff-entries/mine', {
    params: { limit },
  });
  return response.data.data;
};
