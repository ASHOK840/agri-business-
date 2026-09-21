import apiClient from './apiClient';
import type {
  StaffAssignment,
  AssignmentListResponse,
  AssignmentStatus,
  CreateAssignmentFormData,
  UpdateAssignmentFormData,
  StaffWorkload,
} from '../types/staffAssignment.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export interface AssignmentListParams {
  page?: number;
  limit?: number;
  purchaseId?: string;
  staffId?: string;
  status?: AssignmentStatus;
}

export const listAssignments = async (
  params: AssignmentListParams = {}
): Promise<AssignmentListResponse> => {
  const response = await apiClient.get<AssignmentListResponse>('/staff-assignments', { params });
  return response.data;
};

export const getStaffWorkload = async (params: {
  staffId?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<StaffWorkload[]> => {
  const response = await apiClient.get<ApiEnvelope<StaffWorkload[]>>(
    '/staff-assignments/workload',
    { params }
  );
  return response.data.data;
};

export const getAssignment = async (id: string): Promise<StaffAssignment> => {
  const response = await apiClient.get<ApiEnvelope<StaffAssignment>>(
    `/staff-assignments/${id}`
  );
  return response.data.data;
};

export const createAssignment = async (
  data: Partial<CreateAssignmentFormData>
): Promise<StaffAssignment> => {
  const response = await apiClient.post<ApiEnvelope<StaffAssignment>>(
    '/staff-assignments',
    data
  );
  return response.data.data;
};

export const updateAssignment = async (
  id: string,
  data: Partial<UpdateAssignmentFormData>
): Promise<StaffAssignment> => {
  const response = await apiClient.put<ApiEnvelope<StaffAssignment>>(
    `/staff-assignments/${id}`,
    data
  );
  return response.data.data;
};

export const updateAssignmentStatus = async (
  id: string,
  status: AssignmentStatus
): Promise<StaffAssignment> => {
  const response = await apiClient.patch<ApiEnvelope<StaffAssignment>>(
    `/staff-assignments/${id}/status`,
    { status }
  );
  return response.data.data;
};
