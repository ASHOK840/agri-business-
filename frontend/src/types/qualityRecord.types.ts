export interface QualityRecord {
  id: string;
  purchaseId: string;
  buyerId: string | null;
  qualityStatusId: string;
  grade: string | null;
  remarks: string | null;
  moisturePercentage: string | null;
  buyerRemarks: string | null;
  priceAdjustment: string | null;
  rejectionReason: string | null;
  assessedBy: string;
  assessmentDate: string;
  createdAt: string;
  updatedAt: string;
  purchase: { id: string; purchaseNumber: string; cropId: string };
  buyer: { id: string; buyerCode: string; companyName: string } | null;
  qualityStatus: { id: string; code: string; name: string; isRejection: boolean };
  assessedByUser: { id: string; name: string };
}

export interface QualityRecordFormData {
  purchaseId: string;
  buyerId: string;
  qualityStatusId: string;
  grade: string;
  remarks: string;
  moisturePercentage: string;
  buyerRemarks: string;
  priceAdjustment: string;
  rejectionReason: string;
  assessmentDate: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface QualityRecordListResponse {
  data: QualityRecord[];
  pagination: PaginationInfo;
}
