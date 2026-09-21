import prisma from '../config/prismaClient';
import {
  CreateExpenseCategoryInput,
  UpdateExpenseCategoryInput,
  ListExpenseCategoriesQuery,
} from '../validators/expenseCategory.validator';

export class DuplicateExpenseCategoryCodeError extends Error {
  constructor() {
    super('An expense category with this code already exists.');
    this.name = 'DuplicateExpenseCategoryCodeError';
  }
}

export class ExpenseCategoryNotFoundError extends Error {
  constructor() {
    super('Expense category not found.');
    this.name = 'ExpenseCategoryNotFoundError';
  }
}

export const listExpenseCategories = async (query: ListExpenseCategoriesQuery) => {
  const { page, limit, status } = query;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.expenseCategory.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.expenseCategory.count({ where }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

export const getExpenseCategoryById = async (id: string) => {
  const record = await prisma.expenseCategory.findUnique({ where: { id } });
  if (!record) throw new ExpenseCategoryNotFoundError();
  return record;
};

export const createExpenseCategory = async (input: CreateExpenseCategoryInput) => {
  const existing = await prisma.expenseCategory.findUnique({ where: { code: input.code } });
  if (existing) throw new DuplicateExpenseCategoryCodeError();

  return prisma.expenseCategory.create({
    data: {
      code: input.code,
      name: input.name,
      description: input.description || null,
      displayOrder: input.displayOrder,
    },
  });
};

export const updateExpenseCategory = async (id: string, input: UpdateExpenseCategoryInput) => {
  await getExpenseCategoryById(id);

  const byCode = await prisma.expenseCategory.findUnique({ where: { code: input.code } });
  if (byCode && byCode.id !== id) throw new DuplicateExpenseCategoryCodeError();

  return prisma.expenseCategory.update({
    where: { id },
    data: {
      code: input.code,
      name: input.name,
      description: input.description || null,
      displayOrder: input.displayOrder,
    },
  });
};

export const updateExpenseCategoryStatus = async (id: string, status: 'ACTIVE' | 'INACTIVE') => {
  await getExpenseCategoryById(id);
  return prisma.expenseCategory.update({ where: { id }, data: { status } });
};
