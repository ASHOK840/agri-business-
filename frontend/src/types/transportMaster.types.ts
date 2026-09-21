export type MasterStatus = 'ACTIVE' | 'INACTIVE';

export interface Transporter {
  id: string;
  transporterCode: string;
  name: string;
  phone: string | null;
  status: MasterStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  driverCode: string;
  name: string;
  phone: string | null;
  status: MasterStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string | null;
  status: MasterStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TransporterListResponse {
  data: Transporter[];
  pagination: PaginationInfo;
}
export interface DriverListResponse {
  data: Driver[];
  pagination: PaginationInfo;
}
export interface VehicleListResponse {
  data: Vehicle[];
  pagination: PaginationInfo;
}
