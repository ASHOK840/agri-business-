import prisma from '../config/prismaClient';
import {
  CreateBuyerPaymentInput,
  ListBuyerPaymentsQuery,
} from '../validators/buyerPayment.validator';
import { AuditContext, recordAuditLog } from './audit.service';
import {
  DuplicateSubmissionError,
  DUPLICATE_SUBMISSION_WINDOW_MS,
} from '../utils/duplicateGuard';

export class SaleNotFoundError extends Error {
  constructor() {
    super('Sale not found.');
    this.name = 'SaleNotFoundError';
  }
}

export class BuyerPaymentNotFoundError extends Error {
  constructor() {
    super('Payment not found.');
    this.name = 'BuyerPaymentNotFoundError';
  }
}

export class SettlementRequiredError extends Error {
  constructor() {
    super(
      "Cannot record a payment until this sale's delivery settlement has been recorded — the final sale amount isn't known yet."
    );
    this.name = 'SettlementRequiredError';
  }
}

export class PaymentExceedsOutstandingError extends Error {
  constructor(outstanding: number, attempted: number) {
    super(
      outstanding <= 0
        ? 'This sale is already fully paid — no outstanding balance remains.'
        : `Payment of ₹${attempted} exceeds the outstanding balance of ₹${outstanding}.`
    );
    this.name = 'PaymentExceedsOutstandingError';
  }
}

const withRelations = {
  sale: {
    select: {
      id: true,
      saleNumber: true,
      buyer: { select: { id: true, buyerCode: true, companyName: true } },
      crop: { select: { id: true, cropCode: true, name: true } },
    },
  },
  buyer: { select: { id: true, buyerCode: true, companyName: true } },
  recordedByUser: { select: { id: true, name: true } },
} as const;

const generateNextPaymentNumber = async (
  db: Pick<typeof prisma, 'buyerPayment'> = prisma
): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `PAY-${year}-`;

  const lastPayment = await db.buyerPayment.findFirst({
    where: { paymentNumber: { startsWith: prefix } },
    orderBy: { paymentNumber: 'desc' },
  });

  let nextNumber = 1;
  if (lastPayment) {
    const match = lastPayment.paymentNumber.match(/-(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

export type SalePaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';

// Shared by getSalePaymentSummary and the list/get endpoints below so
// "is this sale fully paid, and if not, what's left" is computed exactly
// the same way everywhere — never stored, same "never store what can be
// computed" rule Inventory uses for stock. Returns null fields when no
// settlement has been recorded yet (the final amount isn't known).
const computeSaleFinancials = (sale: {
  settlement: { finalSettlementAmount: unknown } | null;
  payments: { amount: unknown }[];
}) => {
  const finalSaleAmount = sale.settlement ? Number(sale.settlement.finalSettlementAmount) : null;
  const totalPaid =
    Math.round(sale.payments.reduce((sum, p) => sum + Number(p.amount), 0) * 100) / 100;
  const outstandingAmount =
    finalSaleAmount === null ? null : Math.round((finalSaleAmount - totalPaid) * 100) / 100;

  let paymentStatus: SalePaymentStatus | null = null;
  if (finalSaleAmount !== null) {
    if (totalPaid <= 0) paymentStatus = 'PENDING';
    else if (outstandingAmount !== null && outstandingAmount > 0) paymentStatus = 'PARTIAL';
    else paymentStatus = 'PAID';
  }

  return { finalSaleAmount, totalPaid, outstandingAmount, paymentStatus };
};

export const getSalePaymentSummary = async (saleId: string) => {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      settlement: true,
      payments: {
        include: { recordedByUser: { select: { id: true, name: true } } },
        orderBy: { paymentDate: 'desc' },
      },
    },
  });
  if (!sale) throw new SaleNotFoundError();

  return {
    saleId: sale.id,
    saleNumber: sale.saleNumber,
    ...computeSaleFinancials(sale),
    payments: sale.payments,
  };
};

// Attaches each payment's parent-sale payment status/outstanding balance
// — "is Sale X fully settled, and if not, how much is left" — so a list
// of individual payment transactions can also answer that question
// without a separate trip to the sale's own summary for every row.
const attachSalePaymentStatus = async <T extends { saleId: string }>(
  payments: T[]
): Promise<(T & { salePaymentStatus: SalePaymentStatus | null; saleOutstandingAmount: number | null })[]> => {
  const saleIds = [...new Set(payments.map((p) => p.saleId))];
  const sales = saleIds.length
    ? await prisma.sale.findMany({
        where: { id: { in: saleIds } },
        select: {
          id: true,
          settlement: { select: { finalSettlementAmount: true } },
          payments: { select: { amount: true } },
        },
      })
    : [];

  const financialsBySaleId = new Map(
    sales.map((sale) => [sale.id, computeSaleFinancials(sale)])
  );

  return payments.map((payment) => {
    const financials = financialsBySaleId.get(payment.saleId);
    return {
      ...payment,
      salePaymentStatus: financials?.paymentStatus ?? null,
      saleOutstandingAmount: financials?.outstandingAmount ?? null,
    };
  });
};

export const listBuyerPayments = async (query: ListBuyerPaymentsQuery) => {
  const { page, limit, search, saleId, buyerId, cropId, paymentMethod, dateFrom, dateTo } = query;

  const where: Record<string, unknown> = {};
  if (saleId) where.saleId = saleId;
  if (buyerId) where.buyerId = buyerId;
  if (cropId) where.sale = { cropId };
  if (paymentMethod) where.paymentMethod = paymentMethod;
  if (search) {
    where.OR = [
      { paymentNumber: { contains: search, mode: 'insensitive' } },
      { transactionReferenceNumber: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (dateFrom || dateTo) {
    where.paymentDate = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    };
  }

  const [rawData, total] = await Promise.all([
    prisma.buyerPayment.findMany({
      where,
      include: withRelations,
      orderBy: { paymentDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.buyerPayment.count({ where }),
  ]);

  const data = await attachSalePaymentStatus(rawData);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getBuyerPaymentById = async (id: string) => {
  const payment = await prisma.buyerPayment.findUnique({
    where: { id },
    include: withRelations,
  });
  if (!payment) throw new BuyerPaymentNotFoundError();
  const [withStatus] = await attachSalePaymentStatus([payment]);
  return withStatus;
};

export const createBuyerPayment = async (
  input: CreateBuyerPaymentInput,
  recordedBy: string,
  audit: AuditContext
) => {
  // The outstanding check and the payment insert happen inside one
  // transaction so two payments submitted at nearly the same moment
  // can't both pass the check against the same stale outstanding figure
  // and jointly overpay a sale.
  const payment = await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
      where: { id: input.saleId },
      include: { settlement: true, payments: true },
    });
    if (!sale) throw new SaleNotFoundError();

    // "Buyer pays money to the business after final settlement" — the
    // final sale amount isn't known until SaleSettlement exists.
    if (!sale.settlement) throw new SettlementRequiredError();

    const finalSaleAmount = Number(sale.settlement.finalSettlementAmount);
    const totalPaidSoFar = sale.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const outstanding = Math.round((finalSaleAmount - totalPaidSoFar) * 100) / 100;

    if (input.amount > outstanding) {
      throw new PaymentExceedsOutstandingError(outstanding, input.amount);
    }

    if (!input.force) {
      const recentDuplicate = await tx.buyerPayment.findFirst({
        where: {
          saleId: input.saleId,
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          recordedBy,
          createdAt: { gte: new Date(Date.now() - DUPLICATE_SUBMISSION_WINDOW_MS) },
        },
      });
      if (recentDuplicate) {
        throw new DuplicateSubmissionError('payment');
      }
    }

    const paymentNumber = await generateNextPaymentNumber(tx);

    return tx.buyerPayment.create({
      data: {
        paymentNumber,
        saleId: sale.id,
        buyerId: sale.buyerId,
        amount: input.amount,
        paymentDate: input.paymentDate,
        paymentMethod: input.paymentMethod,
        transactionReferenceNumber: input.transactionReferenceNumber || null,
        notes: input.notes || null,
        recordedBy,
      },
      include: withRelations,
    });
  });

  await recordAuditLog({
    context: audit,
    action: 'PAYMENT_CREATED',
    entityType: 'BuyerPayment',
    entityId: payment.id,
    newValue: payment,
  });

  const [withStatus] = await attachSalePaymentStatus([payment]);
  return withStatus;
};
