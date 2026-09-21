import apiClient from './apiClient';
import type { ReportType, ReportResult, ReportFilterParams } from '../types/report.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export const getReport = async (
  reportType: ReportType,
  filters: ReportFilterParams
): Promise<ReportResult> => {
  const response = await apiClient.get<ApiEnvelope<ReportResult>>(`/reports/${reportType}`, {
    params: filters,
  });
  return response.data.data;
};

// Downloads the CSV via the authenticated apiClient (a plain <a href>
// can't carry the Authorization header) and saves it through a
// temporary object URL.
export const downloadReportCsv = async (
  reportType: ReportType,
  filters: ReportFilterParams
): Promise<void> => {
  const response = await apiClient.get(`/reports/${reportType}`, {
    params: { ...filters, format: 'csv' },
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${reportType}-report-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
