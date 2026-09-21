export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'OTHER';
export type StaffPaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';

export interface StaffPayment {
  id: string;
  paymentNumber: string;
  assignmentId: string;
  staffId: string;
  amount: string; // Decimal serializes as string over JSON
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionReferenceNumber: string | null;
  notes: string | null;
  recordedBy: string;
  createdAt: string;
  assignment: {
    id: string;
    assignedDate: string;
    bagsHandled: number | null;
    labourRatePerBag: string;
    totalLabourAmount: string;
    purchase: { id: string; purchaseNumber: string };
    staff: { id: string; staffCode: string; name: string };
  };
  staff: { id: string; staffCode: string; name: string };
  recordedByUser: { id: string; name: string };
  // The parent assignment's CURRENT status/balance as of now — not "as
  // of this payment" — same figure StaffPaymentSection would show if you
  // opened the assignment.
  assignmentPaymentStatus: StaffPaymentStatus;
  assignmentOutstandingAmount: number;
}

export interface StaffPaymentFormData {
  assignmentId: string;
  amount: string;
  paymentDate: string;
  paymentMethod: PaymentMethod | '';
  transactionReferenceNumber: string;
  notes: string;
}

export interface AssignmentPaymentSummary {
  assignmentId: string;
  assignedDate: string;
  bagsHandled: number | null;
  labourRatePerBag: number;
  purchase: { id: string; purchaseNumber: string };
  staff: { id: string; staffCode: string; name: string };
  totalLabourAmount: number;
  totalPaid: number;
  outstandingAmount: number;
  paymentStatus: StaffPaymentStatus;
  payments: StaffPayment[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StaffPaymentListResponse {
  data: StaffPayment[];
  pagination: PaginationInfo;
}
