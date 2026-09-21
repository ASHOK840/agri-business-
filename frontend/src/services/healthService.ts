import apiClient from './apiClient';

export interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
}

export const checkBackendHealth = async (): Promise<HealthResponse> => {
  const response = await apiClient.get<HealthResponse>('/health');
  return response.data;
};
