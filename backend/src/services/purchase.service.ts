import prisma from '../config/prismaClient';
import {
  CreatePurchaseInput,
  UpdatePurchaseInput,
  UpdatePurchaseStatusInput,
  ListPurchasesQuery,
} from '../validators/purchase.validator';
import { createPurchaseStockIn } from './inventory.service';
import { AuditContext, recordAuditLog } from './audit.service';
import {
  assertNoRecentDuplicate,
  DUPLICATE_SUBMISSION_WINDOW_MS,
} from '../utils/duplicateGuard';

export class FarmerNotFoundError extends Error {
  constructor() {
    super('Farmer not found.');
    this.name = 'FarmerNotFoundError';
  }
}

export class CropNotFoundError extends Error {
  constructor() {
    super('Crop not found.');
    this.name = 'CropNotFoundError';
  }
}

export class PurchaseNotFoundError extends Error {
  constructor() {
    super('Purchase not found.');
    this.name = 'PurchaseNotFoundError';
  }
}

export class TerminalStatusError extends Error {
  constructor(currentStatus: string) {
    super(
      `This purchase is already ${currentStatus} and cannot be changed further. COMPLETED and CANCELLED are final states.`
    );
    this.name = 'TerminalStatusError';
  }
}

export class NotWeighedError extends Error {
  constructor() {
    super(
      'This purchase has not been weighed yet. Record a weighing (actual quantity) before marking it At Warehouse or Completed.'
    );
    this.name = 'NotWeighedError';
  }
}

const TERMINAL_STATUSES = ['COMPLETED', 'CANCELLED'];

const withRelations = {
  farmer: { select: { id: true, farmerCode: true, name: true } },
  crop: { select: { id: true, cropCode: true, name: true } },
  createdByUser: { select: { id: true, name: true } },
} as const;

// Generates the next purchase number, scoped by year (PUR-2026-0001,
// PUR-2026-0002, ...), matching common purchase-order/invoice numbering
// conventions where the sequence resets each year.
const generateNextPurchaseNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `PUR-${year}-`;

  const lastPurchase = await prisma.purchase.findFirst({
    where: { purchaseNumber: { startsWith: prefix } },
    orderBy: { purchaseNumber: 'desc' },
  });

  let nextNumber = 1;
  if (lastPurchase) {
    const match = lastPurchase.purchaseNumber.match(/-(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

// The ONLY place total/remaining amounts are computed. Uses actual
// quantity once weighed; falls back to the estimate before that. Always
// uses the FROZEN purchaseRatePerKg — never a live CropPrice lookup.
const computeAmounts = (
  quantityKg: number | null,
  purchaseRatePerKg: number,
  advanceAmount: number
) => {
  const effectiveQuantity = quantityKg ?? 0;
  const totalGrossAmount = Math.round(effectiveQuantity * purchaseRatePerKg * 100) / 100;
  const remainingPayable = Math.round((totalGrossAmount - advanceAmount) * 100) / 100;
  return { totalGrossAmount, remainingPayable };
};

export const listPurchases = async (query: ListPurchasesQuery) => {
  const { page, limit, search, farmerId, cropId, status, dateFrom, dateTo } = query;

  const where: Record<string, unknown> = {};

  if (farmerId) where.farmerId = farmerId;
  if (cropId) where.cropId = cropId;
  if (status) where.status = status;
  if (search) where.purchaseNumber = { contains: search, mode: 'insensitive' };

  if (dateFrom || dateTo) {
    where.purchaseDate = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    };
  }

  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include: withRelations,
      orderBy: { purchaseDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.purchase.count({ where }),
  ]);

  return {
    data: purchases,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getPurchaseById = async (id: string) => {
  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: withRelations,
  });
  if (!purchase) {
    throw new PurchaseNotFoundError();
  }
  return purchase;
};

export const createPurchase = async (
  input: CreatePurchaseInput,
  createdBy: string,
  audit: AuditContext
) => {
  const farmer = await prisma.farmer.findUnique({ where: { id: input.farmerId } });
  if (!farmer) {
    throw new FarmerNotFoundError();
  }

  const crop = await prisma.crop.findUnique({ where: { id: input.cropId } });
  if (!crop) {
    throw new CropNotFoundError();
  }

  await assertNoRecentDuplicate(
    'purchase',
    () =>
      prisma.purchase.findFirst({
        where: {
          farmerId: input.farmerId,
          cropId: input.cropId,
          purchaseRatePerKg: input.purchaseRatePerKg,
          createdBy,
          createdAt: { gte: new Date(Date.now() - DUPLICATE_SUBMISSION_WINDOW_MS) },
        },
      }),
    input.force
  );

  const purchaseNumber = await generateNextPurchaseNumber();

  // Bag weight defaults from the crop's current configuration, then
  // becomes this purchase's own independent, frozen starting value.
  const bagWeightKg = input.bagWeightKg ?? Number(crop.defaultBagWeightKg);

  const advanceAmount = input.advanceAmount ?? 0;
  const { totalGrossAmount, remainingPayable } = computeAmounts(
    input.estimatedQuantityKg ?? null,
    input.purchaseRatePerKg,
    advanceAmount
  );

  const purchase = await prisma.purchase.create({
    data: {
      purchaseNumber,
      farmerId: input.farmerId,
      cropId: input.cropId,
      quality: input.quality || null,
      purchaseRatePerKg: input.purchaseRatePerKg,
      estimatedQuantityKg: input.estimatedQuantityKg ?? null,
      bagWeightKg,
      advanceAmount,
      totalGrossAmount,
      remainingPayable,
      purchaseDate: input.purchaseDate,
      notes: input.notes || null,
      createdBy,
    },
    include: withRelations,
  });

  await recordAuditLog({
    context: audit,
    action: 'PURCHASE_CREATED',
    entityType: 'Purchase',
    entityId: purchase.id,
    newValue: purchase,
  });

  return purchase;
};

export const updatePurchase = async (id: string, input: UpdatePurchaseInput) => {
  const existing = await prisma.purchase.findUnique({ where: { id } });
  if (!existing) {
    throw new PurchaseNotFoundError();
  }

  if (existing.status === 'CANCELLED') {
    throw new TerminalStatusError(existing.status);
  }

  // COMPLETED freezes the physical deal terms (quantity, bags, bag
  // weight, quality, date) — those describe a transaction that's
  // already done and shouldn't move retroactively. But the farmer
  // payment ledger (advanceAmount) is NOT part of that freeze: the
  // farmer is typically paid in installments continuing well after the
  // crop is received and the purchase is marked COMPLETED, exactly like
  // BuyerPayment keeps accepting payments after a Sale is DELIVERED.
  // Blocking advanceAmount here would make it impossible to ever record
  // a farmer's final payment once the purchase reaches this stage.
  if (existing.status === 'COMPLETED') {
    const changesPhysicalTerms =
      (input.estimatedQuantityKg !== undefined &&
        input.estimatedQuantityKg !==
          (existing.estimatedQuantityKg ? Number(existing.estimatedQuantityKg) : undefined)) ||
      (input.actualQuantityKg !== undefined &&
        input.actualQuantityKg !==
          (existing.actualQuantityKg ? Number(existing.actualQuantityKg) : undefined)) ||
      (input.numberOfBags !== undefined && input.numberOfBags !== existing.numberOfBags) ||
      (input.bagWeightKg !== undefined && input.bagWeightKg !== Number(existing.bagWeightKg)) ||
      (input.purchaseDate !== undefined &&
        input.purchaseDate.getTime() !== existing.purchaseDate.getTime()) ||
      (input.quality !== undefined && (input.quality || null) !== existing.quality);

    if (changesPhysicalTerms) {
      throw new TerminalStatusError(existing.status);
    }
  }

  // Recompute totals using whichever quantity is now available, but
  // ALWAYS against the original frozen rate — input never contains a
  // rate field at all, so there is no way to accidentally change it here.
  const nextActualQuantity =
    input.actualQuantityKg ?? (existing.actualQuantityKg ? Number(existing.actualQuantityKg) : null);
  const nextEstimatedQuantity =
    input.estimatedQuantityKg ??
    (existing.estimatedQuantityKg ? Number(existing.estimatedQuantityKg) : null);
  const nextAdvance = input.advanceAmount ?? Number(existing.advanceAmount);

  const quantityForCalculation = nextActualQuantity ?? nextEstimatedQuantity;
  const { totalGrossAmount, remainingPayable } = computeAmounts(
    quantityForCalculation,
    Number(existing.purchaseRatePerKg),
    nextAdvance
  );

  return prisma.purchase.update({
    where: { id },
    data: {
      quality: input.quality !== undefined ? input.quality || null : undefined,
      estimatedQuantityKg: nextEstimatedQuantity,
      actualQuantityKg: nextActualQuantity,
      numberOfBags: input.numberOfBags ?? existing.numberOfBags,
      bagWeightKg: input.bagWeightKg ?? existing.bagWeightKg,
      advanceAmount: nextAdvance,
      totalGrossAmount,
      remainingPayable,
      purchaseDate: input.purchaseDate ?? existing.purchaseDate,
      notes: input.notes !== undefined ? input.notes || null : undefined,
    },
    include: withRelations,
  });
};

export const updatePurchaseStatus = async (
  id: string,
  input: UpdatePurchaseStatusInput,
  audit: AuditContext
) => {
  const existing = await prisma.purchase.findUnique({ where: { id } });
  if (!existing) {
    throw new PurchaseNotFoundError();
  }

  if (TERMINAL_STATUSES.includes(existing.status)) {
    throw new TerminalStatusError(existing.status);
  }

  // AT_WAREHOUSE is the only place stock-in happens, and it happens off
  // actualQuantityKg when available (see createPurchaseStockIn) — so
  // require a real weighing before allowing either AT_WAREHOUSE or a
  // direct jump to COMPLETED. Without this, a purchase could reach a
  // terminal status having never added its crop to warehouse stock.
  if (
    (input.status === 'AT_WAREHOUSE' || input.status === 'COMPLETED') &&
    existing.actualQuantityKg === null
  ) {
    throw new NotWeighedError();
  }

  // The status flip and its automatic stock-in movement commit together
  // — without this, a crash between the two could leave a purchase
  // marked AT_WAREHOUSE with the crop never actually counted in stock.
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.purchase.update({
      where: { id },
      data: { status: input.status },
      include: withRelations,
    });

    // The ONLY place an inventory IN movement is ever created: automatic,
    // triggered by this exact status transition, never by a direct user
    // action. See inventory.service.ts for why this matters. No circular
    // dependency here — inventory.service.ts never imports this file.
    if (input.status === 'AT_WAREHOUSE') {
      await createPurchaseStockIn(
        {
          id: result.id,
          cropId: result.cropId,
          actualQuantityKg: result.actualQuantityKg,
          estimatedQuantityKg: result.estimatedQuantityKg,
          numberOfBags: result.numberOfBags,
          purchaseDate: result.purchaseDate,
          createdBy: result.createdBy,
        },
        tx
      );
    }

    return result;
  });

  // Cancellation is the one status change worth its own audit entry —
  // see Module 27: "important financial records should not be silently
  // deleted," and a cancelled purchase is the closest thing this app has
  // to deleting one.
  if (input.status === 'CANCELLED') {
    await recordAuditLog({
      context: audit,
      action: 'PURCHASE_CANCELLED',
      entityType: 'Purchase',
      entityId: id,
      oldValue: { status: existing.status },
      newValue: { status: 'CANCELLED' },
    });
  }

  return updated;
};
