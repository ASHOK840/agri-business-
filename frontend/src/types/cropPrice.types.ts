export type CropPriceSourceType = 'MARKET' | 'BUYER_QUOTE' | 'MANUAL';

export interface CropPrice {
  id: string;
  cropId: string;
  buyerId: string | null;
  quality: string | null;
  pricePerKg: string; // Prisma Decimal serializes as a string over JSON
  effectiveDate: string;
  sourceType: CropPriceSourceType;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  crop: { id: string; cropCode: string; name: string };
  buyer: { id: string; buyerCode: string; companyName: string } | null;
  createdByUser: { id: string; name: string };
}

export interface CropPriceFormData {
  cropId: string;
  buyerId: string;
  quality: string;
  pricePerKg: string;
  effectiveDate: string;
  sourceType: CropPriceSourceType;
  notes: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CropPriceListResponse {
  data: CropPrice[];
  pagination: PaginationInfo;
}
