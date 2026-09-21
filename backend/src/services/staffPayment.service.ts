import prisma from '../config/prismaClient';
import { CreateStaffPaymentInput, ListStaffPaymentsQuery } from '../validators/staffPayment.validator';
import { AuditContext, recordAuditLog } from './audit.service';
import { DuplicateSubmissionError, DUPLICATE_SUBMISSION_WINDOW_MS } from '../utils/duplicateGuard';

export class AssignmentNotFoundError extends Error {
  constructor() {
    super('Staff assignment not found.');
    this.name = 'AssignmentNotFoundError';
  }
}

export class StaffPaymentNotFoundError extends Error {
  constructor() {
    super('Payment not found.');
    this.name = 'StaffPaymentNotFoundError';
  }
}

export class PaymentExceedsOutstandingError extends Error {
  constructor(outstanding: number, attempted: number) {
    super(
      outstanding <= 0
        ? 'This assignment is already fully paid — no outstanding balance remains.'
        : `Payment of ₹${attempted} exceeds the outstanding balance of ₹${outstanding}.`
    );
    this.name = 'PaymentExceedsOutstandingError';
  }
}

const withRelations = {
  assignment: {
    select: {
      id: true,
      assignedDate: true,
      bagsHandled: true,
      labourRatePerBag: true,
      totalLabourAmount: true,
      purchase: { select: { id: true, purchaseNumber: true } },
      staff: { select: { id: true, staffCode: true, name: true } },
    },
  },
  staff: { select: { id: true, staffCode: true, name: true } },
  recordedByUser: { select: { id: true, name: true } },
} as const;

const generateNextPaymentNumber = async (
  db: Pick<typeof prisma, 'staffPayment'> = prisma
): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `SPAY-${year}-`;

  const lastPayment = await db.staffPayment.findFirst({
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

export type StaffPaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';

// Shared by getAssignmentPaymentSummary and the list/get endpoints below
// so "is this assignment fully paid, and if not, what's left" is
// computed exactly the same way everywhere — never stored, same "never
// store what can be computed" rule Inventory uses for stock. Unlike the
// Sale side, totalLabourAmount is known immediately once bags/rate are
// set, so paymentStatus is never null.
export const computeAssignmentFinancials = (assignment: {
  totalLabourAmount: unknown;
  payments: { amount: unknown }[];
}) => {
  const totalLabourAmount = Number(assignment.totalLabourAmount);
  const totalPaid =
    Math.round(assignment.payments.reduce((sum, p) => sum + Number(p.amount), 0) * 100) / 100;
  const outstandingAmount = Math.round((totalLabourAmount - totalPaid) * 100) / 100;

  let paymentStatus: StaffPaymentStatus;
  if (totalPaid <= 0) paymentStatus = 'PENDING';
  else if (outstandingAmount > 0) paymentStatus = 'PARTIAL';
  else paymentStatus = 'PAID';

  return { totalLabourAmount, totalPaid, outstandingAmount, paymentStatus };
};

// Attaches each payment's parent-assignment payment status/outstanding
// balance — "is this assignment fully settled, and if not, how much is
// left" — so a list of individual payment transactions can also answer
// that question without a separate trip to the assignment's own summary
// for every row.
const attachAssignmentPaymentStatus = async <T extends { assignmentId: string }>(
  payments: T[]
): Promise<(T & { assignmentPaymentStatus: StaffPaymentStatus; assignmentOutstandingAmount: number })[]> => {
  const assignmentIds = [...new Set(payments.map((p) => p.assignmentId))];
  const assignments = assignmentIds.length
    ? await prisma.staffAssignment.findMany({
        where: { id: { in: assignmentIds } },
        select: {
          id: true,
          totalLabourAmount: true,
          payments: { select: { amount: true } },
        },
      })
    : [];

  const financialsByAssignmentId = new Map(
    assignments.map((assignment) => [assignment.id, computeAssignmentFinancials(assignment)])
  );

  return payments.map((payment) => {
    const financials = financialsByAssignmentId.get(payment.assignmentId);
    return {
      ...payment,
      assignmentPaymentStatus: financials?.paymentStatus ?? 'PENDING',
      assignmentOutstandingAmount: financials?.outstandingAmount ?? 0,
    };
  });
};

// No terminal-status gate here — a COMPLETED assignment is exactly when
// you'd pay the staff member.
export const getAssignmentPaymentSummary = async (assignmentId: string) => {
  const assignment = await prisma.staffAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      payments: {
        include: { recordedByUser: { select: { id: true, name: true } } },
        orderBy: { paymentDate: 'desc' },
      },
      purchase: { select: { id: true, purchaseNumber: true } },
      staff: { select: { id: true, staffCode: true, name: true } },
    },
  });
  if (!assignment) throw new AssignmentNotFoundError();

  return {
    assignmentId: assignment.id,
    assignedDate: assignment.assignedDate,
    bagsHandled: assignment.bagsHandled,
    labourRatePerBag: Number(assignment.labourRatePerBag),
    purchase: assignment.purchase,
    staff: assignment.staff,
    ...computeAssignmentFinancials(assignment),
    payments: assignment.payments,
  };
};

export const listStaffPayments = async (query: ListStaffPaymentsQuery) => {
  const { page, limit, search, assignmentId, staffId, paymentMethod, dateFrom, dateTo } = query;

  const where: Record<string, unknown> = {};
  if (assignmentId) where.assignmentId = assignmentId;
  if (staffId) where.staffId = staffId;
  if (paymentMethod) where.paymentMethod = paymentMethod;
  if (search) {
    where.OR = [
      { paymentNumber: { contains: search, mode: 'insensitive' } },
      { transactionReferenceNumber: { contains: search, mode: 'insensitive' } },
      { staff: { name: { contains: search, mode: 'insensitive' } } },
      { assignment: { purchase: { purchaseNumber: { contains: search, mode: 'insensitive' } } } },
    ];
  }
  if (dateFrom || dateTo) {
    where.paymentDate = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    };
  }

  const [rawData, total] = await Promise.all([
    prisma.staffPayment.findMany({
      where,
      include: withRelations,
      orderBy: { paymentDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.staffPayment.count({ where }),
  ]);

  const data = await attachAssignmentPaymentStatus(rawData);

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

export const getStaffPaymentById = async (id: string) => {
  const payment = await prisma.staffPayment.findUnique({
    where: { id },
    include: withRelations,
  });
  if (!payment) throw new StaffPaymentNotFoundError();
  const [withStatus] = await attachAssignmentPaymentStatus([payment]);
  return withStatus;
};

export const createStaffPayment = async (
  input: CreateStaffPaymentInput,
  recordedBy: string,
  audit: AuditContext
) => {
  // The outstanding check and the payment insert happen inside one
  // transaction so two payments submitted at nearly the same moment
  // can't both pass the check against the same stale outstanding figure
  // and jointly overpay an assignment.
  const payment = await prisma.$transaction(async (tx) => {
    const assignment = await tx.staffAssignment.findUnique({
      where: { id: input.assignmentId },
      include: { payments: true },
    });
    if (!assignment) throw new AssignmentNotFoundError();

    const totalLabourAmount = Number(assignment.totalLabourAmount);
    const totalPaidSoFar = assignment.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const outstanding = Math.round((totalLabourAmount - totalPaidSoFar) * 100) / 100;

    if (input.amount > outstanding) {
      throw new PaymentExceedsOutstandingError(outstanding, input.amount);
    }

    if (!input.force) {
      const recentDuplicate = await tx.staffPayment.findFirst({
        where: {
          assignmentId: input.assignmentId,
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

    return tx.staffPayment.create({
      data: {
        paymentNumber,
        assignmentId: assignment.id,
        staffId: assignment.staffId,
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
    action: 'STAFF_PAYMENT_CREATED',
    entityType: 'StaffPayment',
    entityId: payment.id,
    newValue: payment,
  });

  const [withStatus] = await attachAssignmentPaymentStatus([payment]);
  return withStatus;
};
