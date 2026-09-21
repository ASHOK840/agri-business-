import apiClient from './apiClient';
import type { AuditLogListResponse } from '../types/auditLog.types';

export interface AuditLogListParams {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const listAuditLogs = async (
  params: AuditLogListParams = {}
): Promise<AuditLogListResponse> => {
  const response = await apiClient.get<AuditLogListResponse>('/audit-logs', { params });
  return response.data;
};
