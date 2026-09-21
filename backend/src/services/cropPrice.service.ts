import prisma from '../config/prismaClient';
import {
  CreateCropPriceInput,
  ListCropPricesQuery,
  LatestCropPriceQuery,
} from '../validators/cropPrice.validator';
import { AuditContext, recordAuditLog } from './audit.service';

export class CropNotFoundError extends Error {
  constructor() {
    super('Crop not found.');
    this.name = 'CropNotFoundError';
  }
}

export class BuyerNotFoundError extends Error {
  constructor() {
    super('Buyer not found.');
    this.name = 'BuyerNotFoundError';
  }
}

export class CropPriceNotFoundError extends Error {
  constructor() {
    super('Crop price record not found.');
    this.name = 'CropPriceNotFoundError';
  }
}

// Shared "include" shape so every response consistently shows the crop
// name, buyer name, and who recorded the price — not just raw IDs.
const withRelations = {
  crop: { select: { id: true, cropCode: true, name: true } },
  buyer: { select: { id: true, buyerCode: true, companyName: true } },
  createdByUser: { select: { id: true, name: true } },
} as const;

export const listCropPrices = async (query: ListCropPricesQuery) => {
  const { page, limit, cropId, buyerId, dateFrom, dateTo } = query;

  const where: Record<string, unknown> = {};

  if (cropId) where.cropId = cropId;
  if (buyerId) where.buyerId = buyerId;

  if (dateFrom || dateTo) {
    where.effectiveDate = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    };
  }

  const [prices, total] = await Promise.all([
    prisma.cropPrice.findMany({
      where,
      include: withRelations,
      // Most recent first — this IS the price history view.
      orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.cropPrice.count({ where }),
  ]);

  return {
    data: prices,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

// Returns the single most recent price per crop (optionally scoped to one
// crop and/or one buyer). This is what "Show latest price" means in
// practice — not a stored "current price" column, but a query over the
// full immutable history.
export const getLatestCropPrices = async (query: LatestCropPriceQuery) => {
  const where: Record<string, unknown> = {};
  if (query.cropId) where.cropId = query.cropId;
  if (query.buyerId) where.buyerId = query.buyerId;

  const allMatching = await prisma.cropPrice.findMany({
    where,
    include: withRelations,
    orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }],
  });

  // Reduce to the latest entry per crop (a crop can have many price rows;
  // we only want the newest one per crop for this "latest" view).
  const latestByCrop = new Map<string, (typeof allMatching)[number]>();
  for (const price of allMatching) {
    if (!latestByCrop.has(price.cropId)) {
      latestByCrop.set(price.cropId, price);
    }
  }

  return Array.from(latestByCrop.values());
};

export const getCropPriceById = async (id: string) => {
  const price = await prisma.cropPrice.findUnique({
    where: { id },
    include: withRelations,
  });
  if (!price) {
    throw new CropPriceNotFoundError();
  }
  return price;
};

export const createCropPrice = async (
  input: CreateCropPriceInput,
  createdBy: string,
  audit: AuditContext
) => {
  const crop = await prisma.crop.findUnique({ where: { id: input.cropId } });
  if (!crop) {
    throw new CropNotFoundError();
  }

  if (input.buyerId) {
    const buyer = await prisma.buyer.findUnique({ where: { id: input.buyerId } });
    if (!buyer) {
      throw new BuyerNotFoundError();
    }
  }

  // The most recent prior quote for this same crop (+ buyer, if given) —
  // purely so the audit entry can show what the price changed FROM, not
  // used for any business logic.
  const previousPrice = await prisma.cropPrice.findFirst({
    where: { cropId: input.cropId, buyerId: input.buyerId || null },
    orderBy: { effectiveDate: 'desc' },
  });

  // No update path exists anywhere in this service — creating a new row
  // is the ONLY way a price is ever recorded. This function is the
  // entire "write" surface for crop prices.
  const cropPrice = await prisma.cropPrice.create({
    data: {
      cropId: input.cropId,
      buyerId: input.buyerId || null,
      quality: input.quality || null,
      pricePerKg: input.pricePerKg,
      effectiveDate: input.effectiveDate,
      sourceType: input.sourceType,
      notes: input.notes || null,
      createdBy,
    },
    include: withRelations,
  });

  await recordAuditLog({
    context: audit,
    action: 'PRICE_CHANGED',
    entityType: 'CropPrice',
    entityId: cropPrice.id,
    oldValue: previousPrice ? { pricePerKg: previousPrice.pricePerKg, effectiveDate: previousPrice.effectiveDate } : null,
    newValue: cropPrice,
  });

  return cropPrice;
};
