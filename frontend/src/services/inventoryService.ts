import apiClient from './apiClient';
import type {
  CropStock,
  InventoryMovement,
  MovementListResponse,
  MovementType,
  DispatchFormData,
  AdjustmentFormData,
} from '../types/inventory.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export const getCurrentStock = async (params: {
  warehouseId?: string;
  cropId?: string;
}): Promise<CropStock[]> => {
  const response = await apiClient.get<ApiEnvelope<CropStock[]>>('/inventory/stock', { params });
  return response.data.data;
};

export const listMovements = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  warehouseId?: string;
  cropId?: string;
  movementType?: MovementType;
  referenceType?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<MovementListResponse> => {
  const response = await apiClient.get<MovementListResponse>('/inventory/movements', { params });
  return response.data;
};

export const getMovement = async (id: string): Promise<InventoryMovement> => {
  const response = await apiClient.get<ApiEnvelope<InventoryMovement>>(
    `/inventory/movements/${id}`
  );
  return response.data.data;
};

// Records crop dispatched for sale. Backend blocks this if it would
// exceed currently available stock.
export const createDispatch = async (
  data: Partial<DispatchFormData>
): Promise<InventoryMovement> => {
  const response = await apiClient.post<ApiEnvelope<InventoryMovement>>(
    '/inventory/dispatch',
    data
  );
  return response.data.data;
};

// ADMIN-only authorized correction. Can bypass the availability check
// (quantityKg may be negative here, e.g. for spoilage).
export const createAdjustment = async (
  data: Partial<AdjustmentFormData>
): Promise<InventoryMovement> => {
  const response = await apiClient.post<ApiEnvelope<InventoryMovement>>(
    '/inventory/adjustments',
    data
  );
  return response.data.data;
};
