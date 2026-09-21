import prisma from '../config/prismaClient';
import {
  CreateExpenseInput,
  UpdateExpenseInput,
  CancelExpenseInput,
  ListExpensesQuery,
  ExpenseSummaryQuery,
} from '../validators/expense.validator';
import { AuditContext, recordAuditLog } from './audit.service';
import {
  assertNoRecentDuplicate,
  DUPLICATE_SUBMISSION_WINDOW_MS,
} from '../utils/duplicateGuard';

export class ExpenseCategoryNotFoundError extends Error {
  constructor() {
    super('Expense category not found.');
    this.name = 'ExpenseCategoryNotFoundError';
  }
}

export class PurchaseNotFoundError extends Error {
  constructor() {
    super('Purchase not found.');
    this.name = 'PurchaseNotFoundError';
  }
}

export class SaleNotFoundError extends Error {
  constructor() {
    super('Sale not found.');
    this.name = 'SaleNotFoundError';
  }
}

export class ExpenseNotFoundError extends Error {
  constructor() {
    super('Expense not found.');
    this.name = 'ExpenseNotFoundError';
  }
}

export class ExpenseAlreadyCancelledError extends Error {
  constructor() {
    super('This expense is already cancelled.');
    this.name = 'ExpenseAlreadyCancelledError';
  }
}

export class ConflictingRelatedRecordsError extends Error {
  constructor() {
    super('An expense can relate to a purchase or a sale, not both.');
    this.name = 'ConflictingRelatedRecordsError';
  }
}

const withRelations = {
  category: { select: { id: true, code: true, name: true } },
  purchase: { select: { id: true, purchaseNumber: true } },
  sale: { select: { id: true, saleNumber: true } },
  createdByUser: { select: { id: true, name: true } },
  cancelledByUser: { select: { id: true, name: true } },
} as const;

const generateNextExpenseNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `EXP-${year}-`;

  const last = await prisma.expense.findFirst({
    where: { expenseNumber: { startsWith: prefix } },
    orderBy: { expenseNumber: 'desc' },
  });

  let nextNumber = 1;
  if (last) {
    const match = last.expenseNumber.match(/-(\d+)$/);
    if (match) nextNumber = parseInt(match[1], 10) + 1;
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

const assertRelatedRecordsExist = async (purchaseId?: string | null, saleId?: string | null) => {
  if (purchaseId) {
    const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId } });
    if (!purchase) throw new PurchaseNotFoundError();
  }
  if (saleId) {
    const sale = await prisma.sale.findUnique({ where: { id: saleId } });
    if (!sale) throw new SaleNotFoundError();
  }
};

export const listExpenses = async (query: ListExpensesQuery) => {
  const { page, limit, search, categoryId, status, purchaseId, saleId, paymentMethod, dateFrom, dateTo } =
    query;

  const where: Record<string, unknown> = {};
  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status;
  if (purchaseId) where.purchaseId = purchaseId;
  if (saleId) where.saleId = saleId;
  if (paymentMethod) where.paymentMethod = paymentMethod;
  if (search) {
    where.OR = [
      { expenseNumber: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (dateFrom || dateTo) {
    where.expenseDate = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    };
  }

  const [data, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: withRelations,
      orderBy: { expenseDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

export const getExpenseById = async (id: string) => {
  const expense = await prisma.expense.findUnique({ where: { id }, include: withRelations });
  if (!expense) throw new ExpenseNotFoundError();
  return expense;
};

export const createExpense = async (
  input: CreateExpenseInput,
  createdBy: string,
  audit: AuditContext
) => {
  const category = await prisma.expenseCategory.findUnique({ where: { id: input.categoryId } });
  if (!category) throw new ExpenseCategoryNotFoundError();

  await assertRelatedRecordsExist(input.purchaseId, input.saleId);

  await assertNoRecentDuplicate(
    'expense',
    () =>
      prisma.expense.findFirst({
        where: {
          categoryId: input.categoryId,
          amount: input.amount,
          expenseDate: input.expenseDate,
          createdBy,
          createdAt: { gte: new Date(Date.now() - DUPLICATE_SUBMISSION_WINDOW_MS) },
        },
      }),
    input.force
  );

  const expenseNumber = await generateNextExpenseNumber();

  const expense = await prisma.expense.create({
    data: {
      expenseNumber,
      categoryId: input.categoryId,
      amount: input.amount,
      expenseDate: input.expenseDate,
      description: input.description || null,
      purchaseId: input.purchaseId || null,
      saleId: input.saleId || null,
      paymentMethod: input.paymentMethod,
      referenceNumber: input.referenceNumber || null,
      createdBy,
    },
    include: withRelations,
  });

  await recordAuditLog({
    context: audit,
    action: 'EXPENSE_CREATED',
    entityType: 'Expense',
    entityId: expense.id,
    newValue: expense,
  });

  return expense;
};

export const updateExpense = async (id: string, input: UpdateExpenseInput) => {
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) throw new ExpenseNotFoundError();
  if (existing.status === 'CANCELLED') throw new ExpenseAlreadyCancelledError();

  if (input.categoryId) {
    const category = await prisma.expenseCategory.findUnique({ where: { id: input.categoryId } });
    if (!category) throw new ExpenseCategoryNotFoundError();
  }

  const nextPurchaseId = input.purchaseId !== undefined ? input.purchaseId : existing.purchaseId;
  const nextSaleId = input.saleId !== undefined ? input.saleId : existing.saleId;
  if (nextPurchaseId && nextSaleId) {
    throw new ConflictingRelatedRecordsError();
  }
  await assertRelatedRecordsExist(
    input.purchaseId !== undefined ? input.purchaseId ?? undefined : undefined,
    input.saleId !== undefined ? input.saleId ?? undefined : undefined
  );

  return prisma.expense.update({
    where: { id },
    data: {
      categoryId: input.categoryId ?? undefined,
      amount: input.amount ?? undefined,
      expenseDate: input.expenseDate ?? undefined,
      description: input.description !== undefined ? input.description || null : undefined,
      purchaseId: input.purchaseId !== undefined ? input.purchaseId : undefined,
      saleId: input.saleId !== undefined ? input.saleId : undefined,
      paymentMethod: input.paymentMethod ?? undefined,
      referenceNumber:
        input.referenceNumber !== undefined ? input.referenceNumber || null : undefined,
    },
    include: withRelations,
  });
};

export const cancelExpense = async (
  id: string,
  input: CancelExpenseInput,
  cancelledBy: string
) => {
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) throw new ExpenseNotFoundError();
  if (existing.status === 'CANCELLED') throw new ExpenseAlreadyCancelledError();

  return prisma.expense.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledBy,
      cancellationReason: input.cancellationReason || null,
    },
    include: withRelations,
  });
};

// The financial calculation this whole module exists for. Transportation
// and Labour costs are pulled LIVE from TransportRecord.transportCost and
// StaffAssignment.totalLabourAmount — never copied into the Expense
// table — so a cost recorded in either of those detailed modules is
// counted here exactly once, and a manually-entered Expense (any
// category, including ad-hoc Transportation/Labour not covered by those
// modules) simply adds to the total rather than duplicating it.
export const getExpenseSummary = async (query: ExpenseSummaryQuery) => {
  const { dateFrom, dateTo } = query;

  const expenseWhere: Record<string, unknown> = { status: 'ACTIVE' };
  if (dateFrom || dateTo) {
    expenseWhere.expenseDate = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    };
  }

  const transportWhere: Record<string, unknown> = { status: { not: 'CANCELLED' } };
  if (dateFrom || dateTo) {
    transportWhere.transportDate = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    };
  }

  const assignmentWhere: Record<string, unknown> = { status: { not: 'CANCELLED' } };
  if (dateFrom || dateTo) {
    assignmentWhere.assignedDate = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    };
  }

  const [expenses, categories, transportRecords, staffAssignments] = await Promise.all([
    prisma.expense.findMany({ where: expenseWhere, select: { amount: true, categoryId: true } }),
    prisma.expenseCategory.findMany({ orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }] }),
    prisma.transportRecord.findMany({ where: transportWhere, select: { transportCost: true } }),
    prisma.staffAssignment.findMany({
      where: assignmentWhere,
      select: { totalLabourAmount: true },
    }),
  ]);

  const byCategory = new Map<string, { totalAmount: number; count: number }>();
  for (const expense of expenses) {
    const entry = byCategory.get(expense.categoryId) ?? { totalAmount: 0, count: 0 };
    entry.totalAmount += Number(expense.amount);
    entry.count += 1;
    byCategory.set(expense.categoryId, entry);
  }

  const categorySummaries = categories
    .map((category) => {
      const entry = byCategory.get(category.id);
      return {
        categoryId: category.id,
        categoryCode: category.code,
        categoryName: category.name,
        totalAmount: Math.round((entry?.totalAmount ?? 0) * 100) / 100,
        count: entry?.count ?? 0,
      };
    })
    .filter((c) => c.count > 0);

  const directExpensesTotal =
    Math.round(expenses.reduce((sum, e) => sum + Number(e.amount), 0) * 100) / 100;
  const linkedTransportCostsTotal =
    Math.round(transportRecords.reduce((sum, t) => sum + Number(t.transportCost), 0) * 100) / 100;
  const linkedLabourCostsTotal =
    Math.round(staffAssignments.reduce((sum, a) => sum + Number(a.totalLabourAmount), 0) * 100) /
    100;

  const grandTotal =
    Math.round((directExpensesTotal + linkedTransportCostsTotal + linkedLabourCostsTotal) * 100) /
    100;

  return {
    dateFrom: dateFrom ?? null,
    dateTo: dateTo ?? null,
    categories: categorySummaries,
    directExpensesTotal,
    linkedTransportCostsTotal,
    linkedLabourCostsTotal,
    grandTotal,
  };
};
