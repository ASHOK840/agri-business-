export type SaleSettlementStatus = 'ACCEPTED' | 'PRICE_ADJUSTED' | 'REJECTED';
export type RejectionAction = 'RETURN_TO_WAREHOUSE' | 'RESELL' | 'DISPOSED_OTHER';

export interface SaleSettlement {
  id: string;
  saleId: string;
  dispatchWeightKg: string; // Decimal serializes as string over JSON
  sellingRatePerKg: string;
  buyerFinalWeightKg: string;
  weightDifferenceKg: string;
  differencePercentage: string;
  settlementStatus: SaleSettlementStatus;
  adjustedSellingRatePerKg: string | null;
  priceAdjustmentReason: string | null;
  rejectionReason: string | null;
  quantityAffectedKg: string | null;
  rejectionAction: RejectionAction | null;
  rejectionActionNotes: string | null;
  adjustmentAmount: string;
  adjustmentReason: string | null;
  finalSettlementAmount: string;
  receivedDate: string;
  buyerRemarks: string | null;
  recordedBy: string;
  createdAt: string;
  sale: {
    id: string;
    saleNumber: string;
    status: string;
    buyer: { id: string; buyerCode: string; companyName: string };
    crop: { id: string; cropCode: string; name: string };
  };
  recordedByUser: { id: string; name: string };
}

export interface SaleSettlementFormData {
  saleId: string;
  settlementStatus: SaleSettlementStatus;
  buyerFinalWeightKg: string;
  receivedDate: string;
  buyerRemarks: string;
  adjustedSellingRatePerKg: string;
  priceAdjustmentReason: string;
  rejectionReason: string;
  quantityAffectedKg: string;
  rejectionAction: RejectionAction | '';
  rejectionActionNotes: string;
  adjustmentAmount: string;
  adjustmentReason: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SaleSettlementListResponse {
  data: SaleSettlement[];
  pagination: PaginationInfo;
}
