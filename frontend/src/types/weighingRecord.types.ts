export interface WeighingRecord {
  id: string;
  purchaseId: string;
  numberOfBags: number;
  standardBagWeightKg: string; // Decimal serializes as string over JSON
  expectedWeightKg: string;
  actualWeightKg: string;
  weightDifferenceKg: string;
  weighingDate: string;
  notes: string | null;
  recordedBy: string;
  createdAt: string;
  purchase: { id: string; purchaseNumber: string; farmerId: string; cropId: string };
  recordedByUser: { id: string; name: string };
}

export interface WeighingRecordFormData {
  purchaseId: string;
  numberOfBags: string;
  standardBagWeightKg: string;
  actualWeightKg: string;
  weighingDate: string;
  notes: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface WeighingRecordListResponse {
  data: WeighingRecord[];
  pagination: PaginationInfo;
}
