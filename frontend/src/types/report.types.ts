export type ReportType =
  | 'farmer'
  | 'crop-purchase'
  | 'crop-sales'
  | 'inventory'
  | 'buyer'
  | 'farmer-payment'
  | 'buyer-payment'
  | 'transport-expense'
  | 'labour'
  | 'expense'
  | 'profit-loss'
  | 'weight-loss'
  | 'quality-rejection';

export interface ReportColumn {
  key: string;
  label: string;
}

export interface ReportPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ReportResult {
  columns: ReportColumn[];
  rows: Record<string, string | number | null>[];
  summary?: Record<string, string | number | null>;
  pagination: ReportPagination;
}

export interface ReportFilterParams {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  farmerId?: string;
  cropId?: string;
  buyerId?: string;
  staffId?: string;
  status?: string;
}
