import apiClient from './apiClient';
import type { MasterStatus, Transporter, Driver, Vehicle } from '../types/transportMaster.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}
interface ListResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: MasterStatus;
}

export interface TransporterFormData {
  transporterCode: string;
  name: string;
  phone: string;
}
export interface DriverFormData {
  driverCode: string;
  name: string;
  phone: string;
}
export interface VehicleFormData {
  vehicleNumber: string;
  vehicleType: string;
}

// One factory used for all three simple master-data resources — their
// REST shape (list/get/create/update/status) is identical.
const createMasterApi = <T, TForm extends Record<string, any>>(basePath: string) => ({
  list: async (params: ListParams = {}): Promise<ListResponse<T>> => {
    const response = await apiClient.get<ListResponse<T>>(basePath, { params });
    return response.data;
  },
  get: async (id: string): Promise<T> => {
    const response = await apiClient.get<ApiEnvelope<T>>(`${basePath}/${id}`);
    return response.data.data;
  },
  create: async (data: Partial<TForm>): Promise<T> => {
    const response = await apiClient.post<ApiEnvelope<T>>(basePath, data);
    return response.data.data;
  },
  update: async (id: string, data: Partial<TForm>): Promise<T> => {
    const response = await apiClient.put<ApiEnvelope<T>>(`${basePath}/${id}`, data);
    return response.data.data;
  },
  updateStatus: async (id: string, status: MasterStatus): Promise<T> => {
    const response = await apiClient.patch<ApiEnvelope<T>>(`${basePath}/${id}/status`, { status });
    return response.data.data;
  },
});

export const transporterApi = createMasterApi<Transporter, TransporterFormData>('/transporters');
export const driverApi = createMasterApi<Driver, DriverFormData>('/drivers');
export const vehicleApi = createMasterApi<Vehicle, VehicleFormData>('/vehicles');
