export type MasterStatus = 'ACTIVE' | 'INACTIVE';

export interface QualityStatus {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isRejection: boolean;
  displayOrder: number;
  status: MasterStatus;
  createdAt: string;
  updatedAt: string;
}

export interface QualityStatusFormData {
  code: string;
  name: string;
  description: string;
  isRejection: boolean;
  displayOrder: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface QualityStatusListResponse {
  data: QualityStatus[];
  pagination: PaginationInfo;
}
