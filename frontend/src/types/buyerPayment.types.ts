export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'OTHER';
export type SalePaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';

export interface BuyerPayment {
  id: string;
  paymentNumber: string;
  saleId: string;
  buyerId: string;
  amount: string; // Decimal serializes as string over JSON
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionReferenceNumber: string | null;
  notes: string | null;
  recordedBy: string;
  createdAt: string;
  sale: {
    id: string;
    saleNumber: string;
    buyer: { id: string; buyerCode: string; companyName: string };
    crop: { id: string; cropCode: string; name: string };
  };
  buyer: { id: string; buyerCode: string; companyName: string };
  recordedByUser: { id: string; name: string };
  // The parent sale's CURRENT status/balance as of now — not "as of this
  // payment" — same figure SalePaymentSection would show if you opened
  // the sale. Null only if the sale has no settlement yet.
  salePaymentStatus: SalePaymentStatus | null;
  saleOutstandingAmount: number | null;
}

export interface BuyerPaymentFormData {
  saleId: string;
  amount: string;
  paymentDate: string;
  paymentMethod: PaymentMethod | '';
  transactionReferenceNumber: string;
  notes: string;
}

export interface SalePaymentSummary {
  saleId: string;
  saleNumber: string;
  finalSaleAmount: number | null;
  totalPaid: number;
  outstandingAmount: number | null;
  paymentStatus: SalePaymentStatus | null;
  payments: BuyerPayment[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BuyerPaymentListResponse {
  data: BuyerPayment[];
  pagination: PaginationInfo;
}
