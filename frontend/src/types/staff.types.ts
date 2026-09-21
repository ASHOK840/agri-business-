export type StaffStatus = 'ACTIVE' | 'INACTIVE';

export interface Staff {
  id: string;
  staffCode: string;
  name: string;
  phone: string | null;
  status: StaffStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StaffFormData {
  staffCode: string;
  name: string;
  phone: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StaffListResponse {
  data: Staff[];
  pagination: PaginationInfo;
}
