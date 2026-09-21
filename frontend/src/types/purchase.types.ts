export type PurchaseStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COLLECTED'
  | 'AT_WAREHOUSE'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Purchase {
  id: string;
  purchaseNumber: string;
  farmerId: string;
  cropId: string;
  quality: string | null;
  purchaseRatePerKg: string; // Decimal serializes as string over JSON
  estimatedQuantityKg: string | null;
  actualQuantityKg: string | null;
  numberOfBags: number | null;
  bagWeightKg: string;
  totalGrossAmount: string;
  advanceAmount: string;
  remainingPayable: string;
  purchaseDate: string;
  status: PurchaseStatus;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  farmer: { id: string; farmerCode: string; name: string };
  crop: { id: string; cropCode: string; name: string };
  createdByUser: { id: string; name: string };
}

// Fields for creating a purchase — matches createPurchaseSchema.
export interface CreatePurchaseFormData {
  farmerId: string;
  cropId: string;
  quality: string;
  purchaseRatePerKg: string;
  estimatedQuantityKg: string;
  bagWeightKg: string;
  purchaseDate: string;
  advanceAmount: string;
  notes: string;
}

// Fields for updating a purchase — deliberately excludes farmerId,
// cropId, and purchaseRatePerKg, matching updatePurchaseSchema.
export interface UpdatePurchaseFormData {
  quality: string;
  estimatedQuantityKg: string;
  actualQuantityKg: string;
  numberOfBags: string;
  bagWeightKg: string;
  advanceAmount: string;
  purchaseDate: string;
  notes: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PurchaseListResponse {
  data: Purchase[];
  pagination: PaginationInfo;
}
