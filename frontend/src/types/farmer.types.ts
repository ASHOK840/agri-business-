export type FarmerStatus = 'ACTIVE' | 'INACTIVE';

export interface Farmer {
  id: string;
  farmerCode: string;
  name: string;
  phone: string | null;
  address: string | null;
  village: string | null;
  status: FarmerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FarmerFormData {
  farmerCode: string;
  name: string;
  phone: string;
  address: string;
  village: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FarmerListResponse {
  data: Farmer[];
  pagination: PaginationInfo;
}

export interface PossibleDuplicateFarmer {
  id: string;
  farmerCode: string;
  name: string;
  phone: string | null;
}
