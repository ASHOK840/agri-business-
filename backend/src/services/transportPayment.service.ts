import prisma from '../config/prismaClient';
import {
  CreateTransportPaymentInput,
  ListTransportPaymentsQuery,
} from '../validators/transportPayment.validator';
import { AuditContext, recordAuditLog } from './audit.service';
import {
  DuplicateSubmissionError,
  DUPLICATE_SUBMISSION_WINDOW_MS,
} from '../utils/duplicateGuard';

export class TransportRecordNotFoundError extends Error {
  constructor() {
    super('Transport record not found.');
    this.name = 'TransportRecordNotFoundError';
  }
}

export class TransportPaymentNotFoundError extends Error {
  constructor() {
    super('Payment not found.');
    this.name = 'TransportPaymentNotFoundError';
  }
}

export class PaymentExceedsOutstandingError extends Error {
  constructor(outstanding: number, attempted: number) {
    super(
      outstanding <= 0
        ? 'This transport record is already fully paid — no outstanding balance remains.'
        : `Payment of ₹${attempted} exceeds the outstanding balance of ₹${outstanding}.`
    );
    this.name = 'PaymentExceedsOutstandingError';
  }
}

const withRelations = {
  transportRecord: {
    select: {
      id: true,
      fromLocation: true,
      toLocation: true,
      transportDate: true,
      transporter: { select: { id: true, transporterCode: true, name: true } },
      crop: { select: { id: true, cropCode: true, name: true } },
    },
  },
  transporter: { select: { id: true, transporterCode: true, name: true } },
  recordedByUser: { select: { id: true, name: true } },
} as const;

const generateNextPaymentNumber = async (
  db: Pick<typeof prisma, 'transportPayment'> = prisma
): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `TPAY-${year}-`;

  const lastPayment = await db.transportPayment.findFirst({
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

// The core calculation this module exists for: outstanding is ALWAYS
// derived live from transportRecord.transportCost minus the sum of
// payments recorded so far — never stored, same "never store what can
// be computed" rule Inventory uses for stock. Unlike the Sale side,
// transportCost is known immediately at creation, so paymentStatus is
// never null.
export const getTransportRecordPaymentSummary = async (transportRecordId: string) => {
  const record = await prisma.transportRecord.findUnique({
    where: { id: transportRecordId },
    include: {
      payments: {
        include: { recordedByUser: { select: { id: true, name: true } } },
        orderBy: { paymentDate: 'desc' },
      },
      transporter: { select: { id: true, transporterCode: true, name: true } },
      crop: { select: { id: true, cropCode: true, name: true } },
    },
  });
  if (!record) throw new TransportRecordNotFoundError();

  const transportCost = Number(record.transportCost);
  const totalPaid =
    Math.round(record.payments.reduce((sum, p) => sum + Number(p.amount), 0) * 100) / 100;
  const outstandingAmount = Math.round((transportCost - totalPaid) * 100) / 100;

  let paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID';
  if (totalPaid <= 0) paymentStatus = 'PENDING';
  else if (outstandingAmount > 0) paymentStatus = 'PARTIAL';
  else paymentStatus = 'PAID';

  return {
    transportRecordId: record.id,
    fromLocation: record.fromLocation,
    toLocation: record.toLocation,
    transportDate: record.transportDate,
    transporter: record.transporter,
    crop: record.crop,
    transportCost,
    totalPaid,
    outstandingAmount,
    paymentStatus,
    payments: record.payments,
  };
};

export const listTransportPayments = async (query: ListTransportPaymentsQuery) => {
  const { page, limit, search, transportRecordId, transporterId, paymentMethod, dateFrom, dateTo } =
    query;

  const where: Record<string, unknown> = {};
  if (transportRecordId) where.transportRecordId = transportRecordId;
  if (transporterId) where.transporterId = transporterId;
  if (paymentMethod) where.paymentMethod = paymentMethod;
  if (search) {
    where.OR = [
      { paymentNumber: { contains: search, mode: 'insensitive' } },
      { transactionReferenceNumber: { contains: search, mode: 'insensitive' } },
      { transporter: { name: { contains: search, mode: 'insensitive' } } },
      { transportRecord: { fromLocation: { contains: search, mode: 'insensitive' } } },
      { transportRecord: { toLocation: { contains: search, mode: 'insensitive' } } },
    ];
  }
  if (dateFrom || dateTo) {
    where.paymentDate = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    };
  }

  const [data, total] = await Promise.all([
    prisma.transportPayment.findMany({
      where,
      include: withRelations,
      orderBy: { paymentDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transportPayment.count({ where }),
  ]);

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

export const getTransportPaymentById = async (id: string) => {
  const payment = await prisma.transportPayment.findUnique({
    where: { id },
    include: withRelations,
  });
  if (!payment) throw new TransportPaymentNotFoundError();
  return payment;
};

export const createTransportPayment = async (
  input: CreateTransportPaymentInput,
  recordedBy: string,
  audit: AuditContext
) => {
  // The outstanding check and the payment insert happen inside one
  // transaction so two payments submitted at nearly the same moment
  // can't both pass the check against the same stale outstanding figure
  // and jointly overpay a transport record.
  const payment = await prisma.$transaction(async (tx) => {
    const record = await tx.transportRecord.findUnique({
      where: { id: input.transportRecordId },
      include: { payments: true },
    });
    if (!record) throw new TransportRecordNotFoundError();

    const transportCost = Number(record.transportCost);
    const totalPaidSoFar = record.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const outstanding = Math.round((transportCost - totalPaidSoFar) * 100) / 100;

    if (input.amount > outstanding) {
      throw new PaymentExceedsOutstandingError(outstanding, input.amount);
    }

    if (!input.force) {
      const recentDuplicate = await tx.transportPayment.findFirst({
        where: {
          transportRecordId: input.transportRecordId,
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

    return tx.transportPayment.create({
      data: {
        paymentNumber,
        transportRecordId: record.id,
        transporterId: record.transporterId,
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
    action: 'TRANSPORT_PAYMENT_CREATED',
    entityType: 'TransportPayment',
    entityId: payment.id,
    newValue: payment,
  });

  return payment;
};
