export type ExpenseStatus = 'ACTIVE' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'OTHER';

export interface Expense {
  id: string;
  expenseNumber: string;
  categoryId: string;
  amount: string; // Decimal serializes as string over JSON
  expenseDate: string;
  description: string | null;
  purchaseId: string | null;
  saleId: string | null;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  status: ExpenseStatus;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancellationReason: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  category: { id: string; code: string; name: string };
  purchase: { id: string; purchaseNumber: string } | null;
  sale: { id: string; saleNumber: string } | null;
  createdByUser: { id: string; name: string };
  cancelledByUser: { id: string; name: string } | null;
}

export interface ExpenseFormData {
  categoryId: string;
  amount: string;
  expenseDate: string;
  description: string;
  purchaseId: string;
  saleId: string;
  paymentMethod: PaymentMethod | '';
  referenceNumber: string;
}

export interface ExpenseCategorySummary {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  totalAmount: number;
  count: number;
}

export interface ExpenseSummary {
  dateFrom: string | null;
  dateTo: string | null;
  categories: ExpenseCategorySummary[];
  directExpensesTotal: number;
  linkedTransportCostsTotal: number;
  linkedLabourCostsTotal: number;
  grandTotal: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ExpenseListResponse {
  data: Expense[];
  pagination: PaginationInfo;
}
