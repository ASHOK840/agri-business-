export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'OTHER';
export type TransportPaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';

export interface TransportPayment {
  id: string;
  paymentNumber: string;
  transportRecordId: string;
  transporterId: string;
  amount: string; // Decimal serializes as string over JSON
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionReferenceNumber: string | null;
  notes: string | null;
  recordedBy: string;
  createdAt: string;
  transportRecord: {
    id: string;
    fromLocation: string;
    toLocation: string;
    transportDate: string;
    transporter: { id: string; transporterCode: string; name: string };
    crop: { id: string; cropCode: string; name: string };
  };
  transporter: { id: string; transporterCode: string; name: string };
  recordedByUser: { id: string; name: string };
}

export interface TransportPaymentFormData {
  transportRecordId: string;
  amount: string;
  paymentDate: string;
  paymentMethod: PaymentMethod | '';
  transactionReferenceNumber: string;
  notes: string;
}

export interface TransportRecordPaymentSummary {
  transportRecordId: string;
  fromLocation: string;
  toLocation: string;
  transportDate: string;
  transporter: { id: string; transporterCode: string; name: string };
  crop: { id: string; cropCode: string; name: string };
  transportCost: number;
  totalPaid: number;
  outstandingAmount: number;
  paymentStatus: TransportPaymentStatus;
  payments: TransportPayment[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TransportPaymentListResponse {
  data: TransportPayment[];
  pagination: PaginationInfo;
}
