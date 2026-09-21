// Deliberately narrow — mirrors exactly what the /staff-entries API
// returns, which never includes purchase rate or accounting figures.
export interface StaffEntry {
  id: string;
  purchaseNumber: string;
  farmerName: string;
  village: string | null;
  cropName: string;
  quantityKg: number | null;
  numberOfBags: number | null;
  status: string;
  purchaseDate: string;
}

export interface CreateStaffEntryInput {
  farmerId?: string;
  farmerName?: string;
  village?: string;
  phone?: string;
  cropId: string;
  quantityKg: string;
  numberOfBags: string;
}
