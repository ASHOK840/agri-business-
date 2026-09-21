export type CropStatus = 'ACTIVE' | 'INACTIVE';

export interface Crop {
  id: string;
  cropCode: string;
  name: string;
  defaultBagWeightKg: string; // Prisma Decimal serializes as a string over JSON
  lowStockThresholdKg: string | null;
  status: CropStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CropFormData {
  cropCode: string;
  name: string;
  defaultBagWeightKg: string;
  lowStockThresholdKg: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CropListResponse {
  data: Crop[];
  pagination: PaginationInfo;
}
