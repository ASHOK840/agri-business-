import prisma from '../config/prismaClient';
import {
  CreateStaffInput,
  UpdateStaffInput,
  UpdateStaffStatusInput,
  ListStaffQuery,
} from '../validators/staff.validator';

export class DuplicateStaffCodeError extends Error {
  constructor() {
    super('A staff member with this staff code already exists.');
    this.name = 'DuplicateStaffCodeError';
  }
}

export class StaffNotFoundError extends Error {
  constructor() {
    super('Staff member not found.');
    this.name = 'StaffNotFoundError';
  }
}

// Generates the next sequential staff code (STF-001, STF-002, ...) when
// the caller doesn't supply one, matching the format already used by the
// initial seed data (STF-001 through STF-005).
const generateNextStaffCode = async (): Promise<string> => {
  const lastStaff = await prisma.staff.findFirst({
    where: { staffCode: { startsWith: 'STF-' } },
    orderBy: { staffCode: 'desc' },
  });

  let nextNumber = 1;
  if (lastStaff) {
    const match = lastStaff.staffCode.match(/^STF-(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `STF-${String(nextNumber).padStart(3, '0')}`;
};

export const listStaff = async (query: ListStaffQuery) => {
  const { page, limit, search, status } = query;

  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { staffCode: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [staff, total] = await Promise.all([
    prisma.staff.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.staff.count({ where }),
  ]);

  return {
    data: staff,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getStaffById = async (id: string) => {
  const staffMember = await prisma.staff.findUnique({ where: { id } });
  if (!staffMember) {
    throw new StaffNotFoundError();
  }
  return staffMember;
};

export const createStaff = async (input: CreateStaffInput) => {
  const staffCode = input.staffCode || (await generateNextStaffCode());

  const existing = await prisma.staff.findUnique({ where: { staffCode } });
  if (existing) {
    throw new DuplicateStaffCodeError();
  }

  return prisma.staff.create({
    data: {
      staffCode,
      name: input.name,
      phone: input.phone || null,
    },
  });
};

export const updateStaff = async (id: string, input: UpdateStaffInput) => {
  const existing = await getStaffById(id); // throws StaffNotFoundError if missing

  if (input.staffCode) {
    const existingByCode = await prisma.staff.findUnique({
      where: { staffCode: input.staffCode },
    });
    if (existingByCode && existingByCode.id !== id) {
      throw new DuplicateStaffCodeError();
    }
  }

  return prisma.staff.update({
    where: { id },
    data: {
      staffCode: input.staffCode || existing.staffCode,
      name: input.name,
      phone: input.phone || null,
    },
  });
};

export const updateStaffStatus = async (id: string, input: UpdateStaffStatusInput) => {
  await getStaffById(id); // throws StaffNotFoundError if missing

  return prisma.staff.update({
    where: { id },
    data: { status: input.status },
  });
};
