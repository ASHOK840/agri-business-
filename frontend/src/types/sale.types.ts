export type SaleStatus = 'PENDING' | 'CONFIRMED' | 'LOADED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';

export interface Sale {
  id: string;
  saleNumber: string;
  buyerId: string;
  cropId: string;
  quality: string | null;
  numberOfBags: number | null;
  dispatchWeightKg: string;
  sellingRatePerKg: string;
  expectedRevenue: string;
  saleDate: string;
  warehouseId: string;
  status: SaleStatus;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  buyer: { id: string; buyerCode: string; companyName: string };
  crop: { id: string; cropCode: string; name: string };
  warehouse: { id: string; name: string; location: string | null };
  createdByUser: { id: string; name: string };
}

export interface CreateSaleFormData {
  buyerId: string;
  cropId: string;
  warehouseId: string;
  quality: string;
  numberOfBags: string;
  dispatchWeightKg: string;
  sellingRatePerKg: string;
  saleDate: string;
  status: SaleStatus;
  notes: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SaleListResponse {
  data: Sale[];
  pagination: PaginationInfo;
}
