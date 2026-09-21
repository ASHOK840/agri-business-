import { Prisma } from '@prisma/client';
import prisma from '../config/prismaClient';
import {
  CreateDispatchInput,
  CreateAdjustmentInput,
  ListMovementsQuery,
  StockQuery,
} from '../validators/inventory.validator';
import { AuditContext, recordAuditLog } from './audit.service';

// Lets the stock-mutating helpers below run either standalone (the
// default, module-level `prisma` client) or inside a caller's own
// `prisma.$transaction(async (tx) => ...)` — so a status change and its
// automatic stock movement commit or roll back together, never leaving
// the two out of sync if one half fails.
type Db = typeof prisma | Prisma.TransactionClient;

export class WarehouseNotFoundError extends Error {
  constructor() {
    super('No warehouse configured. Please add a warehouse first.');
    this.name = 'WarehouseNotFoundError';
  }
}
export class CropNotFoundError extends Error {
  constructor() {
    super('Crop not found.');
    this.name = 'CropNotFoundError';
  }
}
export class InsufficientStockError extends Error {
  constructor(available: number, requested: number) {
    super(
      `Cannot dispatch ${requested}kg — only ${available}kg currently in stock. Use an authorized adjustment if this stock level is wrong.`
    );
    this.name = 'InsufficientStockError';
  }
}
export class MovementNotFoundError extends Error {
  constructor() {
    super('Inventory movement not found.');
    this.name = 'MovementNotFoundError';
  }
}

const withRelations = {
  warehouse: { select: { id: true, name: true } },
  crop: { select: { id: true, cropCode: true, name: true } },
  purchase: { select: { id: true, purchaseNumber: true } },
  createdByUser: { select: { id: true, name: true } },
} as const;

// Resolves the target warehouse: uses the given id, or falls back to
// the single main warehouse (the business currently has exactly one).
const resolveWarehouseId = async (warehouseId?: string, db: Db = prisma): Promise<string> => {
  if (warehouseId) return warehouseId;

  const mainWarehouse = await db.warehouse.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!mainWarehouse) throw new WarehouseNotFoundError();
  return mainWarehouse.id;
};

// THE core calculation this entire module exists for: current stock is
// ALWAYS derived from movements, never read from a stored field.
//   currentStock = SUM(IN) - SUM(OUT) + SUM(ADJUSTMENT)
const computeStockFromMovements = (
  movements: { movementType: string; quantityKg: unknown; numberOfBags: number | null }[]
) => {
  let stockKg = 0;
  let stockBags = 0;
  let totalInKg = 0;
  let totalOutKg = 0;
  let totalAdjustmentKg = 0;

  for (const m of movements) {
    const qty = Number(m.quantityKg);
    const bags = m.numberOfBags ?? 0;

    if (m.movementType === 'IN') {
      stockKg += qty;
      stockBags += bags;
      totalInKg += qty;
    } else if (m.movementType === 'OUT') {
      stockKg -= qty;
      stockBags -= bags;
      totalOutKg += qty;
    } else {
      // ADJUSTMENT — qty can be negative or positive
      stockKg += qty;
      stockBags += bags;
      totalAdjustmentKg += qty;
    }
  }

  return {
    currentStockKg: Math.round(stockKg * 1000) / 1000,
    currentStockBags: stockBags,
    totalInKg: Math.round(totalInKg * 1000) / 1000,
    totalOutKg: Math.round(totalOutKg * 1000) / 1000,
    totalAdjustmentKg: Math.round(totalAdjustmentKg * 1000) / 1000,
  };
};

// Current stock, grouped by crop (and warehouse, though there's
// currently only one). This is "Current Inventory" / "Crop-wise stock"
// from the frontend requirements — always computed live from movements.
export const getCurrentStock = async (query: StockQuery) => {
  const where: Record<string, unknown> = {};
  if (query.warehouseId) where.warehouseId = query.warehouseId;
  if (query.cropId) where.cropId = query.cropId;

  const [movements, crops] = await Promise.all([
    prisma.inventoryTransaction.findMany({ where }),
    prisma.crop.findMany({
      where: query.cropId ? { id: query.cropId } : { status: 'ACTIVE' },
      select: { id: true, cropCode: true, name: true, lowStockThresholdKg: true },
    }),
  ]);

  const byCrop = new Map<string, typeof movements>();
  for (const m of movements) {
    const list = byCrop.get(m.cropId) ?? [];
    list.push(m);
    byCrop.set(m.cropId, list);
  }

  return crops.map((crop: { id: string; cropCode: string; name: string; lowStockThresholdKg: unknown }) => {
    const cropMovements = byCrop.get(crop.id) ?? [];
    const stock = computeStockFromMovements(cropMovements);
    const threshold = crop.lowStockThresholdKg ? Number(crop.lowStockThresholdKg) : null;

    return {
      cropId: crop.id,
      cropCode: crop.cropCode,
      cropName: crop.name,
      ...stock,
      lowStockThresholdKg: threshold,
      isLowStock: threshold !== null && stock.currentStockKg < threshold,
    };
  });
};

export const listMovements = async (query: ListMovementsQuery) => {
  const { page, limit, search, warehouseId, cropId, movementType, referenceType, dateFrom, dateTo } = query;

  const where: Record<string, unknown> = {};
  if (warehouseId) where.warehouseId = warehouseId;
  if (cropId) where.cropId = cropId;
  if (movementType) where.movementType = movementType;
  if (referenceType) where.referenceType = referenceType;
  if (search) where.notes = { contains: search, mode: 'insensitive' };
  if (dateFrom || dateTo) {
    where.movementDate = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    };
  }

  const [data, total] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      where,
      include: withRelations,
      orderBy: [{ movementDate: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.inventoryTransaction.count({ where }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

export const getMovementById = async (id: string) => {
  const movement = await prisma.inventoryTransaction.findUnique({
    where: { id },
    include: withRelations,
  });
  if (!movement) throw new MovementNotFoundError();
  return movement;
};

// Dispatch = manual OUT movement ("crop dispatched for sale"). Blocked
// if it would push stock negative — this is the "prevent selling more
// stock than is available" requirement, enforced here, not just
// suggested in the UI.
export const createDispatch = async (input: CreateDispatchInput, createdBy: string) => {
  const warehouseId = await resolveWarehouseId(input.warehouseId);

  const crop = await prisma.crop.findUnique({ where: { id: input.cropId } });
  if (!crop) throw new CropNotFoundError();

  const existingMovements = await prisma.inventoryTransaction.findMany({
    where: { warehouseId, cropId: input.cropId },
  });
  const { currentStockKg } = computeStockFromMovements(existingMovements);

  if (input.quantityKg > currentStockKg) {
    throw new InsufficientStockError(currentStockKg, input.quantityKg);
  }

  return prisma.inventoryTransaction.create({
    data: {
      warehouseId,
      cropId: input.cropId,
      quantityKg: input.quantityKg,
      numberOfBags: input.numberOfBags ?? null,
      movementType: 'OUT',
      referenceType: 'DISPATCH',
      referenceId: null,
      movementDate: input.movementDate,
      notes: input.notes || null,
      createdBy,
    },
    include: withRelations,
  });
};

// Adjustment — OWNER-only authorized correction. Deliberately bypasses
// the availability check (that's the point: it's for fixing a stock
// level that's wrong, including making it lower for spoilage or higher
// for an undercount).
export const createAdjustment = async (
  input: CreateAdjustmentInput,
  createdBy: string,
  audit: AuditContext
) => {
  const warehouseId = await resolveWarehouseId(input.warehouseId);

  const crop = await prisma.crop.findUnique({ where: { id: input.cropId } });
  if (!crop) throw new CropNotFoundError();

  const adjustment = await prisma.inventoryTransaction.create({
    data: {
      warehouseId,
      cropId: input.cropId,
      quantityKg: input.quantityKg,
      numberOfBags: input.numberOfBags ?? null,
      movementType: 'ADJUSTMENT',
      referenceType: 'ADJUSTMENT',
      referenceId: null,
      movementDate: input.movementDate,
      notes: input.notes,
      createdBy,
    },
    include: withRelations,
  });

  await recordAuditLog({
    context: audit,
    action: 'INVENTORY_ADJUSTED',
    entityType: 'InventoryTransaction',
    entityId: adjustment.id,
    newValue: adjustment,
  });

  return adjustment;
};

// Called automatically by the Purchase service when a purchase's status
// transitions to AT_WAREHOUSE. NOT exposed via any direct API route —
// this is the only way an IN movement is ever created. Idempotent: if
// an IN row already exists for this purchase (e.g. status bounced back
// and forth), it does nothing rather than double-counting stock.
export const createPurchaseStockIn = async (
  purchase: {
    id: string;
    cropId: string;
    actualQuantityKg: unknown;
    estimatedQuantityKg: unknown;
    numberOfBags: number | null;
    purchaseDate: Date;
    createdBy: string;
  },
  db: Db = prisma
) => {
  const existing = await db.inventoryTransaction.findFirst({
    where: { referenceType: 'PURCHASE', referenceId: purchase.id, movementType: 'IN' },
  });
  if (existing) return existing; // already recorded — don't double stock-in

  const quantityKg = purchase.actualQuantityKg
    ? Number(purchase.actualQuantityKg)
    : purchase.estimatedQuantityKg
      ? Number(purchase.estimatedQuantityKg)
      : 0;

  if (quantityKg <= 0) return null; // nothing meaningful to record yet

  const warehouseId = await resolveWarehouseId(undefined, db);

  return db.inventoryTransaction.create({
    data: {
      warehouseId,
      cropId: purchase.cropId,
      quantityKg,
      numberOfBags: purchase.numberOfBags,
      movementType: 'IN',
      referenceType: 'PURCHASE',
      referenceId: purchase.id,
      purchaseId: purchase.id,
      movementDate: purchase.purchaseDate,
      notes: 'Automatically recorded when purchase arrived at warehouse.',
      createdBy: purchase.createdBy,
    },
  });
};

// Called automatically by the Sale service when a sale's status
// transitions to DISPATCHED. NOT exposed via any direct API route — the
// only way a SALE-referenced OUT movement is ever created. Idempotent:
// if an OUT row already exists for this sale, does nothing rather than
// double-deducting stock (mirrors createPurchaseStockIn above).
export const createSaleStockOut = async (
  sale: {
    id: string;
    saleNumber: string;
    warehouseId: string;
    cropId: string;
    dispatchWeightKg: unknown;
    numberOfBags: number | null;
    createdBy: string;
  },
  db: Db = prisma
) => {
  const existing = await db.inventoryTransaction.findFirst({
    where: { referenceType: 'SALE', referenceId: sale.id, movementType: 'OUT' },
  });
  if (existing) return existing; // already recorded — don't double-deduct stock

  return db.inventoryTransaction.create({
    data: {
      warehouseId: sale.warehouseId,
      cropId: sale.cropId,
      quantityKg: Number(sale.dispatchWeightKg),
      numberOfBags: sale.numberOfBags,
      movementType: 'OUT',
      referenceType: 'SALE',
      referenceId: sale.id,
      movementDate: new Date(),
      notes: `Automatically recorded when sale ${sale.saleNumber} was dispatched.`,
      createdBy: sale.createdBy,
    },
  });
};

// Reverses a previously recorded SALE stock-out when a dispatched sale is
// later cancelled — the goods never left, so the warehouse stock must
// come back. Idempotent for the same reason as above: if no OUT movement
// was ever recorded for this sale (it was cancelled before dispatch),
// there is nothing to reverse.
export const reverseSaleStockOut = async (
  sale: {
    id: string;
    saleNumber: string;
    warehouseId: string;
    cropId: string;
    dispatchWeightKg: unknown;
    numberOfBags: number | null;
    createdBy: string;
  },
  db: Db = prisma
) => {
  const dispatched = await db.inventoryTransaction.findFirst({
    where: { referenceType: 'SALE', referenceId: sale.id, movementType: 'OUT' },
  });
  if (!dispatched) return null; // never left the warehouse — nothing to reverse

  const alreadyReversed = await db.inventoryTransaction.findFirst({
    where: { referenceType: 'SALE_CANCELLED', referenceId: sale.id, movementType: 'IN' },
  });
  if (alreadyReversed) return alreadyReversed;

  return db.inventoryTransaction.create({
    data: {
      warehouseId: sale.warehouseId,
      cropId: sale.cropId,
      quantityKg: Number(sale.dispatchWeightKg),
      numberOfBags: sale.numberOfBags,
      movementType: 'IN',
      referenceType: 'SALE_CANCELLED',
      referenceId: sale.id,
      movementDate: new Date(),
      notes: `Stock restored — sale ${sale.saleNumber} was cancelled after dispatch.`,
      createdBy: sale.createdBy,
    },
  });
};

// Called automatically by the SaleSettlement service when a buyer
// rejects a delivery and the recorded action is RETURN_TO_WAREHOUSE —
// the goods physically came back, so stock must reflect that. Idempotent
// (keyed on the settlement, not the sale, since a rejection is recorded
// once per settlement): a second call for the same settlement does
// nothing rather than double-crediting stock.
export const createSaleRejectionReturn = async (
  settlement: {
    id: string;
    saleNumber: string;
    warehouseId: string;
    cropId: string;
    quantityAffectedKg: unknown;
    createdBy: string;
  },
  db: Db = prisma
) => {
  const existing = await db.inventoryTransaction.findFirst({
    where: { referenceType: 'SALE_REJECTED_RETURN', referenceId: settlement.id, movementType: 'IN' },
  });
  if (existing) return existing;

  return db.inventoryTransaction.create({
    data: {
      warehouseId: settlement.warehouseId,
      cropId: settlement.cropId,
      quantityKg: Number(settlement.quantityAffectedKg),
      numberOfBags: null,
      movementType: 'IN',
      referenceType: 'SALE_REJECTED_RETURN',
      referenceId: settlement.id,
      movementDate: new Date(),
      notes: `Stock restored — buyer rejected sale ${settlement.saleNumber} and goods were returned to warehouse.`,
      createdBy: settlement.createdBy,
    },
  });
};
