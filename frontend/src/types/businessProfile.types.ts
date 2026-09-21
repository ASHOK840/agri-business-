export interface BusinessProfile {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string | null;
  address: string | null;
  pan: string | null;
  gstin: string | null;
  email: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessProfileFormData {
  businessName: string;
  ownerName: string;
  phone: string;
  address: string;
  pan: string;
  gstin: string;
  email: string;
}
