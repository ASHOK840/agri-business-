import prisma from '../config/prismaClient';
import {
  CreateFarmerInput,
  UpdateFarmerInput,
  UpdateFarmerStatusInput,
  ListFarmersQuery,
} from '../validators/farmer.validator';
import { AuditContext, recordAuditLog } from './audit.service';

export class DuplicateFarmerCodeError extends Error {
  constructor() {
    super('A farmer with this farmer code already exists.');
    this.name = 'DuplicateFarmerCodeError';
  }
}

export class PossibleDuplicateFarmerError extends Error {
  existingFarmer: { id: string; farmerCode: string; name: string; phone: string | null };

  constructor(existingFarmer: {
    id: string;
    farmerCode: string;
    name: string;
    phone: string | null;
  }) {
    super('A farmer with this name and phone number already exists.');
    this.name = 'PossibleDuplicateFarmerError';
    this.existingFarmer = existingFarmer;
  }
}

export class FarmerNotFoundError extends Error {
  constructor() {
    super('Farmer not found.');
    this.name = 'FarmerNotFoundError';
  }
}

// Generates the next sequential farmer code (FARM-0001, FARM-0002, ...)
// when the caller doesn't supply one. Looks at the highest existing
// numeric suffix among codes matching the FARM-#### pattern, so it keeps
// working correctly even if farmers are deactivated (never deleted).
const generateNextFarmerCode = async (): Promise<string> => {
  const lastFarmer = await prisma.farmer.findFirst({
    where: { farmerCode: { startsWith: 'FARM-' } },
    orderBy: { farmerCode: 'desc' },
  });

  let nextNumber = 1;
  if (lastFarmer) {
    const match = lastFarmer.farmerCode.match(/^FARM-(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `FARM-${String(nextNumber).padStart(4, '0')}`;
};

export const listFarmers = async (query: ListFarmersQuery) => {
  const { page, limit, search, status } = query;

  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { farmerCode: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [farmers, total] = await Promise.all([
    prisma.farmer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.farmer.count({ where }),
  ]);

  return {
    data: farmers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getFarmerById = async (id: string) => {
  const farmer = await prisma.farmer.findUnique({ where: { id } });
  if (!farmer) {
    throw new FarmerNotFoundError();
  }
  return farmer;
};

export const createFarmer = async (input: CreateFarmerInput, audit: AuditContext) => {
  const farmerCode = input.farmerCode || (await generateNextFarmerCode());

  // Explicit uniqueness pre-check gives a clean, expected error message
  // instead of a raw database constraint violation bubbling up.
  const existingByCode = await prisma.farmer.findUnique({ where: { farmerCode } });
  if (existingByCode) {
    throw new DuplicateFarmerCodeError();
  }

  // Soft duplicate detection: same name + phone is very likely the same
  // person being entered twice (e.g. by two different staff members).
  // This does not block creation outright — it asks for confirmation.
  if (input.phone && !input.force) {
    const possibleDuplicate = await prisma.farmer.findFirst({
      where: {
        phone: input.phone,
        name: { equals: input.name, mode: 'insensitive' },
      },
    });

    if (possibleDuplicate) {
      throw new PossibleDuplicateFarmerError({
        id: possibleDuplicate.id,
        farmerCode: possibleDuplicate.farmerCode,
        name: possibleDuplicate.name,
        phone: possibleDuplicate.phone,
      });
    }
  }

  const farmer = await prisma.farmer.create({
    data: {
      farmerCode,
      name: input.name,
      phone: input.phone || null,
      address: input.address || null,
      village: input.village || null,
    },
  });

  await recordAuditLog({
    context: audit,
    action: 'FARMER_CREATED',
    entityType: 'Farmer',
    entityId: farmer.id,
    newValue: farmer,
  });

  return farmer;
};

export const updateFarmer = async (id: string, input: UpdateFarmerInput, audit: AuditContext) => {
  const existing = await getFarmerById(id); // throws FarmerNotFoundError if missing

  if (input.farmerCode) {
    const existingByCode = await prisma.farmer.findUnique({
      where: { farmerCode: input.farmerCode },
    });
    if (existingByCode && existingByCode.id !== id) {
      throw new DuplicateFarmerCodeError();
    }
  }

  const updated = await prisma.farmer.update({
    where: { id },
    data: {
      ...(input.farmerCode ? { farmerCode: input.farmerCode } : {}),
      name: input.name,
      phone: input.phone || null,
      address: input.address || null,
      village: input.village || null,
    },
  });

  await recordAuditLog({
    context: audit,
    action: 'FARMER_UPDATED',
    entityType: 'Farmer',
    entityId: id,
    oldValue: existing,
    newValue: updated,
  });

  return updated;
};

export const updateFarmerStatus = async (
  id: string,
  input: UpdateFarmerStatusInput,
  audit: AuditContext
) => {
  const existing = await getFarmerById(id); // throws FarmerNotFoundError if missing

  const updated = await prisma.farmer.update({
    where: { id },
    data: { status: input.status },
  });

  await recordAuditLog({
    context: audit,
    action: 'FARMER_STATUS_CHANGED',
    entityType: 'Farmer',
    entityId: id,
    oldValue: { status: existing.status },
    newValue: { status: updated.status },
  });

  return updated;
};
