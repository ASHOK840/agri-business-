import apiClient from './apiClient';
import type {
  Expense,
  ExpenseFormData,
  ExpenseListResponse,
  ExpenseSummary,
  ExpenseStatus,
  PaymentMethod,
} from '../types/expense.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export interface ExpenseListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: ExpenseStatus;
  purchaseId?: string;
  saleId?: string;
  paymentMethod?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
}

export const listExpenses = async (params: ExpenseListParams = {}): Promise<ExpenseListResponse> => {
  const response = await apiClient.get<ExpenseListResponse>('/expenses', { params });
  return response.data;
};

export const getExpense = async (id: string): Promise<Expense> => {
  const response = await apiClient.get<ApiEnvelope<Expense>>(`/expenses/${id}`);
  return response.data.data;
};

export const getExpenseSummary = async (
  params: { dateFrom?: string; dateTo?: string } = {}
): Promise<ExpenseSummary> => {
  const response = await apiClient.get<ApiEnvelope<ExpenseSummary>>('/expenses/summary', {
    params,
  });
  return response.data.data;
};

export const createExpense = async (data: Partial<ExpenseFormData>): Promise<Expense> => {
  const response = await apiClient.post<ApiEnvelope<Expense>>('/expenses', data);
  return response.data.data;
};

export const updateExpense = async (
  id: string,
  data: Partial<ExpenseFormData>
): Promise<Expense> => {
  const response = await apiClient.put<ApiEnvelope<Expense>>(`/expenses/${id}`, data);
  return response.data.data;
};

export const cancelExpense = async (id: string, cancellationReason: string): Promise<Expense> => {
  const response = await apiClient.patch<ApiEnvelope<Expense>>(`/expenses/${id}/cancel`, {
    cancellationReason,
  });
  return response.data.data;
};
