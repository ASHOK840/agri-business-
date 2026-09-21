import prisma from '../config/prismaClient';
import {
  CreateBuyerInput,
  UpdateBuyerInput,
  UpdateBuyerStatusInput,
  ListBuyersQuery,
} from '../validators/buyer.validator';
import { AuditContext, recordAuditLog } from './audit.service';

export class DuplicateBuyerCodeError extends Error {
  constructor() {
    super('A buyer with this buyer code already exists.');
    this.name = 'DuplicateBuyerCodeError';
  }
}

export class BuyerNotFoundError extends Error {
  constructor() {
    super('Buyer not found.');
    this.name = 'BuyerNotFoundError';
  }
}

// Generates the next sequential buyer code (BYR-0001, BYR-0002, ...) when
// the caller doesn't supply one, matching the pattern used for farmers.
const generateNextBuyerCode = async (): Promise<string> => {
  const lastBuyer = await prisma.buyer.findFirst({
    where: { buyerCode: { startsWith: 'BYR-' } },
    orderBy: { buyerCode: 'desc' },
  });

  let nextNumber = 1;
  if (lastBuyer) {
    const match = lastBuyer.buyerCode.match(/^BYR-(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `BYR-${String(nextNumber).padStart(4, '0')}`;
};

export const listBuyers = async (query: ListBuyersQuery) => {
  const { page, limit, search, status } = query;

  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: 'insensitive' } },
      { contactPerson: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { buyerCode: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [buyers, total] = await Promise.all([
    prisma.buyer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.buyer.count({ where }),
  ]);

  return {
    data: buyers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getBuyerById = async (id: string) => {
  const buyer = await prisma.buyer.findUnique({ where: { id } });
  if (!buyer) {
    throw new BuyerNotFoundError();
  }
  return buyer;
};

export const createBuyer = async (input: CreateBuyerInput, audit: AuditContext) => {
  const buyerCode = input.buyerCode || (await generateNextBuyerCode());

  const existing = await prisma.buyer.findUnique({ where: { buyerCode } });
  if (existing) {
    throw new DuplicateBuyerCodeError();
  }

  const buyer = await prisma.buyer.create({
    data: {
      buyerCode,
      companyName: input.companyName,
      contactPerson: input.contactPerson || null,
      phone: input.phone || null,
      address: input.address || null,
    },
  });

  await recordAuditLog({
    context: audit,
    action: 'BUYER_CREATED',
    entityType: 'Buyer',
    entityId: buyer.id,
    newValue: buyer,
  });

  return buyer;
};

export const updateBuyer = async (id: string, input: UpdateBuyerInput, audit: AuditContext) => {
  const existing = await getBuyerById(id); // throws BuyerNotFoundError if missing

  if (input.buyerCode) {
    const existingByCode = await prisma.buyer.findUnique({
      where: { buyerCode: input.buyerCode },
    });
    if (existingByCode && existingByCode.id !== id) {
      throw new DuplicateBuyerCodeError();
    }
  }

  const updated = await prisma.buyer.update({
    where: { id },
    data: {
      buyerCode: input.buyerCode || existing.buyerCode,
      companyName: input.companyName,
      contactPerson: input.contactPerson || null,
      phone: input.phone || null,
      address: input.address || null,
    },
  });

  await recordAuditLog({
    context: audit,
    action: 'BUYER_UPDATED',
    entityType: 'Buyer',
    entityId: id,
    oldValue: existing,
    newValue: updated,
  });

  return updated;
};

export const updateBuyerStatus = async (
  id: string,
  input: UpdateBuyerStatusInput,
  audit: AuditContext
) => {
  const existing = await getBuyerById(id); // throws BuyerNotFoundError if missing

  const updated = await prisma.buyer.update({
    where: { id },
    data: { status: input.status },
  });

  await recordAuditLog({
    context: audit,
    action: 'BUYER_STATUS_CHANGED',
    entityType: 'Buyer',
    entityId: id,
    oldValue: { status: existing.status },
    newValue: { status: updated.status },
  });

  return updated;
};
