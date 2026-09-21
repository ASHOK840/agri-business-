import prisma from '../config/prismaClient';
import {
  CreateStaffAssignmentInput,
  UpdateStaffAssignmentInput,
  UpdateStaffAssignmentStatusInput,
  ListStaffAssignmentsQuery,
  StaffWorkloadQuery,
} from '../validators/staffAssignment.validator';
import { computeAssignmentFinancials } from './staffPayment.service';

export class PurchaseNotFoundError extends Error {
  constructor() {
    super('Purchase not found.');
    this.name = 'PurchaseNotFoundError';
  }
}

export class StaffNotFoundError extends Error {
  constructor() {
    super('Staff member not found.');
    this.name = 'StaffNotFoundError';
  }
}

export class AssignmentNotFoundError extends Error {
  constructor() {
    super('Staff assignment not found.');
    this.name = 'AssignmentNotFoundError';
  }
}

export class TerminalStatusError extends Error {
  constructor(currentStatus: string) {
    super(
      `This assignment is already ${currentStatus} and cannot be changed further. COMPLETED and CANCELLED are final states.`
    );
    this.name = 'TerminalStatusError';
  }
}

const TERMINAL_STATUSES = ['COMPLETED', 'CANCELLED'];

const withRelations = {
  purchase: { select: { id: true, purchaseNumber: true } },
  staff: { select: { id: true, staffCode: true, name: true } },
  payments: { select: { amount: true } },
} as const;

// Attaches each assignment's live payment status/outstanding balance —
// reuses the exact same calculation StaffPaymentSection shows, so the
// list and the detail page never disagree.
const attachPaymentStatus = <T extends { totalLabourAmount: unknown; payments: { amount: unknown }[] }>(
  assignment: T
) => ({ ...assignment, ...computeAssignmentFinancials(assignment) });

// The ONLY place labour amounts are computed. Never accepted as direct
// client input, anywhere.
const computeLabourAmount = (bagsHandled: number | null, labourRatePerBag: number) => {
  const bags = bagsHandled ?? 0;
  return Math.round(bags * labourRatePerBag * 100) / 100;
};

export const listAssignments = async (query: ListStaffAssignmentsQuery) => {
  const { page, limit, purchaseId, staffId, status } = query;

  const where: Record<string, unknown> = {};
  if (purchaseId) where.purchaseId = purchaseId;
  if (staffId) where.staffId = staffId;
  if (status) where.status = status;

  const [assignments, total] = await Promise.all([
    prisma.staffAssignment.findMany({
      where,
      include: withRelations,
      orderBy: { assignedDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.staffAssignment.count({ where }),
  ]);

  return {
    data: assignments.map(attachPaymentStatus),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getAssignmentById = async (id: string) => {
  const assignment = await prisma.staffAssignment.findUnique({
    where: { id },
    include: withRelations,
  });
  if (!assignment) {
    throw new AssignmentNotFoundError();
  }
  return attachPaymentStatus(assignment);
};

export const createAssignment = async (input: CreateStaffAssignmentInput) => {
  const purchase = await prisma.purchase.findUnique({ where: { id: input.purchaseId } });
  if (!purchase) {
    throw new PurchaseNotFoundError();
  }

  const staff = await prisma.staff.findUnique({ where: { id: input.staffId } });
  if (!staff) {
    throw new StaffNotFoundError();
  }

  const totalLabourAmount = computeLabourAmount(
    input.bagsHandled ?? null,
    input.labourRatePerBag
  );

  const assignment = await prisma.staffAssignment.create({
    data: {
      purchaseId: input.purchaseId,
      staffId: input.staffId,
      assignedDate: input.assignedDate,
      bagsHandled: input.bagsHandled ?? null,
      labourRatePerBag: input.labourRatePerBag,
      totalLabourAmount,
    },
    include: withRelations,
  });
  return attachPaymentStatus(assignment);
};

export const updateAssignment = async (id: string, input: UpdateStaffAssignmentInput) => {
  const existing = await prisma.staffAssignment.findUnique({ where: { id } });
  if (!existing) {
    throw new AssignmentNotFoundError();
  }

  if (TERMINAL_STATUSES.includes(existing.status)) {
    throw new TerminalStatusError(existing.status);
  }

  const nextBagsHandled =
    input.bagsHandled ?? (existing.bagsHandled !== null ? existing.bagsHandled : null);
  const nextRate = input.labourRatePerBag ?? Number(existing.labourRatePerBag);
  const totalLabourAmount = computeLabourAmount(nextBagsHandled, nextRate);

  const assignment = await prisma.staffAssignment.update({
    where: { id },
    data: {
      assignedDate: input.assignedDate ?? existing.assignedDate,
      bagsHandled: nextBagsHandled,
      labourRatePerBag: nextRate,
      totalLabourAmount,
    },
    include: withRelations,
  });
  return attachPaymentStatus(assignment);
};

export const updateAssignmentStatus = async (
  id: string,
  input: UpdateStaffAssignmentStatusInput
) => {
  const existing = await prisma.staffAssignment.findUnique({ where: { id } });
  if (!existing) {
    throw new AssignmentNotFoundError();
  }

  if (TERMINAL_STATUSES.includes(existing.status)) {
    throw new TerminalStatusError(existing.status);
  }

  const assignment = await prisma.staffAssignment.update({
    where: { id },
    data: { status: input.status },
    include: withRelations,
  });
  return attachPaymentStatus(assignment);
};

// Per-staff workload aggregation — the "staff-wise labour reports"
// preparation. Groups all (non-cancelled, by default just all matching)
// assignments by staff member and sums bags handled / labour amount.
export const getStaffWorkload = async (query: StaffWorkloadQuery) => {
  const where: Record<string, unknown> = {};
  if (query.staffId) where.staffId = query.staffId;
  if (query.dateFrom || query.dateTo) {
    where.assignedDate = {
      ...(query.dateFrom ? { gte: query.dateFrom } : {}),
      ...(query.dateTo ? { lte: query.dateTo } : {}),
    };
  }

  const assignments = await prisma.staffAssignment.findMany({
    where,
    include: { staff: { select: { id: true, staffCode: true, name: true } } },
  });

  const byStaff = new Map<
    string,
    {
      staffId: string;
      staffCode: string;
      staffName: string;
      assignmentCount: number;
      totalBagsHandled: number;
      totalLabourAmount: number;
    }
  >();

  for (const a of assignments) {
    const key = a.staffId;
    const existing = byStaff.get(key) ?? {
      staffId: a.staff.id,
      staffCode: a.staff.staffCode,
      staffName: a.staff.name,
      assignmentCount: 0,
      totalBagsHandled: 0,
      totalLabourAmount: 0,
    };
    existing.assignmentCount += 1;
    existing.totalBagsHandled += a.bagsHandled ?? 0;
    existing.totalLabourAmount += Number(a.totalLabourAmount);
    byStaff.set(key, existing);
  }

  return Array.from(byStaff.values()).sort((a, b) => b.totalLabourAmount - a.totalLabourAmount);
};
