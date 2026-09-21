import apiClient from './apiClient';
import type { Staff, StaffFormData, StaffListResponse, StaffStatus } from '../types/staff.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export interface StaffListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: StaffStatus;
}

export const listStaff = async (params: StaffListParams = {}): Promise<StaffListResponse> => {
  const response = await apiClient.get<StaffListResponse>('/staff', { params });
  return response.data;
};

export const getStaff = async (id: string): Promise<Staff> => {
  const response = await apiClient.get<ApiEnvelope<Staff>>(`/staff/${id}`);
  return response.data.data;
};

export const createStaff = async (data: Partial<StaffFormData>): Promise<Staff> => {
  const response = await apiClient.post<ApiEnvelope<Staff>>('/staff', data);
  return response.data.data;
};

export const updateStaff = async (id: string, data: Partial<StaffFormData>): Promise<Staff> => {
  const response = await apiClient.put<ApiEnvelope<Staff>>(`/staff/${id}`, data);
  return response.data.data;
};

export const updateStaffStatus = async (id: string, status: StaffStatus): Promise<Staff> => {
  const response = await apiClient.patch<ApiEnvelope<Staff>>(`/staff/${id}/status`, { status });
  return response.data.data;
};
