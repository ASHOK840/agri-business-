import apiClient from './apiClient';
import type {
  ExpenseCategory,
  ExpenseCategoryFormData,
  ExpenseCategoryListResponse,
  MasterStatus,
} from '../types/expenseCategory.types';

interface ApiEnvelope<T> {
  status: string;
  data: T;
}

export const listExpenseCategories = async (
  params: { page?: number; limit?: number; status?: MasterStatus } = {}
): Promise<ExpenseCategoryListResponse> => {
  const response = await apiClient.get<ExpenseCategoryListResponse>('/expense-categories', {
    params,
  });
  return response.data;
};

export const getExpenseCategory = async (id: string): Promise<ExpenseCategory> => {
  const response = await apiClient.get<ApiEnvelope<ExpenseCategory>>(
    `/expense-categories/${id}`
  );
  return response.data.data;
};

export const createExpenseCategory = async (
  data: Partial<ExpenseCategoryFormData>
): Promise<ExpenseCategory> => {
  const response = await apiClient.post<ApiEnvelope<ExpenseCategory>>(
    '/expense-categories',
    data
  );
  return response.data.data;
};

export const updateExpenseCategory = async (
  id: string,
  data: Partial<ExpenseCategoryFormData>
): Promise<ExpenseCategory> => {
  const response = await apiClient.put<ApiEnvelope<ExpenseCategory>>(
    `/expense-categories/${id}`,
    data
  );
  return response.data.data;
};

export const updateExpenseCategoryStatus = async (
  id: string,
  status: MasterStatus
): Promise<ExpenseCategory> => {
  const response = await apiClient.patch<ApiEnvelope<ExpenseCategory>>(
    `/expense-categories/${id}/status`,
    { status }
  );
  return response.data.data;
};
