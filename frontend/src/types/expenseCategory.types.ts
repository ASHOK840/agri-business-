export type MasterStatus = 'ACTIVE' | 'INACTIVE';

export interface ExpenseCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  displayOrder: number;
  status: MasterStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategoryFormData {
  code: string;
  name: string;
  description: string;
  displayOrder: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ExpenseCategoryListResponse {
  data: ExpenseCategory[];
  pagination: PaginationInfo;
}
