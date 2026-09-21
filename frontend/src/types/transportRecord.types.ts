export type TransportDirection = 'FARMER_TO_WAREHOUSE' | 'WAREHOUSE_TO_BUYER';
export type TransportStatus = 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

export interface TransportRecord {
  id: string;
  direction: TransportDirection;
  transporterId: string;
  driverId: string | null;
  vehicleId: string | null;
  purchaseId: string | null;
  buyerId: string | null;
  cropId: string;
  assignedUserId: string | null;
  fromLocation: string;
  toLocation: string;
  numberOfBags: number | null;
  weightKg: string | null;
  transportCost: string;
  transportDate: string;
  status: TransportStatus;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  transporter: { id: string; transporterCode: string; name: string };
  driver: { id: string; driverCode: string; name: string } | null;
  vehicle: { id: string; vehicleNumber: string } | null;
  purchase: { id: string; purchaseNumber: string } | null;
  buyer: { id: string; buyerCode: string; companyName: string } | null;
  crop: { id: string; cropCode: string; name: string };
  assignedUser: { id: string; name: string } | null;
}

export interface TransportRecordFormData {
  direction: TransportDirection;
  transporterId: string;
  driverId: string;
  vehicleId: string;
  purchaseId: string;
  buyerId: string;
  cropId: string;
  assignedUserId: string;
  fromLocation: string;
  toLocation: string;
  numberOfBags: string;
  weightKg: string;
  transportCost: string;
  transportDate: string;
  notes: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TransportRecordListResponse {
  data: TransportRecord[];
  pagination: PaginationInfo;
}
