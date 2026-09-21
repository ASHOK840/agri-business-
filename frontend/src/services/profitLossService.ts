import apiClient from './apiClient';
import type { SaleProfitLoss } from '../types/profitLoss.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export const getSaleProfitLoss = async (saleId: string): Promise<SaleProfitLoss> => {
  const response = await apiClient.get<ApiEnvelope<SaleProfitLoss>>(`/profit-loss/${saleId}`);
  return response.data.data;
};
