export type BuyerStatus = 'ACTIVE' | 'INACTIVE';

export interface Buyer {
  id: string;
  buyerCode: string;
  companyName: string;
  contactPerson: string | null;
  phone: string | null;
  address: string | null;
  status: BuyerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BuyerFormData {
  buyerCode: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  address: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BuyerListResponse {
  data: Buyer[];
  pagination: PaginationInfo;
}
