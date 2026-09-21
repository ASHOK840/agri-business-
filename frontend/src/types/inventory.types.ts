export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface CropStock {
  cropId: string;
  cropCode: string;
  cropName: string;
  currentStockKg: number;
  currentStockBags: number;
  totalInKg: number;
  totalOutKg: number;
  totalAdjustmentKg: number;
  lowStockThresholdKg: number | null;
  isLowStock: boolean;
}

export interface InventoryMovement {
  id: string;
  warehouseId: string;
  cropId: string;
  quantityKg: string; // Decimal serializes as string over JSON
  numberOfBags: number | null;
  movementType: MovementType;
  referenceType: string;
  referenceId: string | null;
  purchaseId: string | null;
  movementDate: string;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  warehouse: { id: string; name: string } | null;
  crop: { id: string; cropCode: string; name: string };
  purchase: { id: string; purchaseNumber: string } | null;
  createdByUser: { id: string; name: string };
}

export interface DispatchFormData {
  cropId: string;
  quantityKg: string;
  numberOfBags: string;
  movementDate: string;
  notes: string;
}

export interface AdjustmentFormData {
  cropId: string;
  quantityKg: string;
  numberOfBags: string;
  movementDate: string;
  notes: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MovementListResponse {
  data: InventoryMovement[];
  pagination: PaginationInfo;
}
