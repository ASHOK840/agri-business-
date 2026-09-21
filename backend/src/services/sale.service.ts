import prisma from '../config/prismaClient';
import { CreateSaleInput, ListSalesQuery, UpdateSaleStatusInput } from '../validators/sale.validator';
import { createSaleStockOut, reverseSaleStockOut } from './inventory.service';
import { AuditContext, recordAuditLog } from './audit.service';
import {
  assertNoRecentDuplicate,
  DUPLICATE_SUBMISSION_WINDOW_MS,
} from '../utils/duplicateGuard';

export class BuyerNotFoundError extends Error {
  constructor() {
    super('Buyer not found.');
    this.name = 'BuyerNotFoundError';
  }
}

export class CropNotFoundError extends Error {
  constructor() {
    super('Crop not found.');
    this.name = 'CropNotFoundError';
  }
}

export class WarehouseNotFoundError extends Error {
  constructor() {
    super('No warehouse configured. Please add a warehouse first.');
    this.name = 'WarehouseNotFoundError';
  }
}

export class SaleNotFoundError extends Error {
  constructor() {
    super('Sale not found.');
    this.name = 'SaleNotFoundError';
  }
}

export class InsufficientStockError extends Error {
  constructor(available: number, requested: number) {
    super(`Cannot sell ${requested}kg — only ${available}kg currently available in stock.`);
    this.name = 'InsufficientStockError';
  }
}

export class TerminalStatusError extends Error {
  constructor(currentStatus: string) {
    super(`This sale is already ${currentStatus} and cannot be changed further.`);
    this.name = 'TerminalStatusError';
  }
}

export class RequiresSettlementError extends Error {
  constructor() {
    super(
      'A sale can only be marked DELIVERED by recording its buyer delivery settlement (final weight and revenue), not by a direct status change.'
    );
    this.name = 'RequiresSettlementError';
  }
}

const TERMINAL_STATUSES = ['DELIVERED', 'CANCELLED'];

const withRelations = {
  buyer: { select: { id: true, buyerCode: true, companyName: true } },
  crop: { select: { id: true, cropCode: true, name: true } },
  warehouse: { select: { id: true, name: true, location: true } },
  createdByUser: { select: { id: true, name: true } },
} as const;

const computeStock = (movements: { movementType: string; quantityKg: unknown }[]) => {
  let stockKg = 0;
  for (const movement of movements) {
    const qty = Number(movement.quantityKg);
    if (movement.movementType === 'IN') stockKg += qty;
    else if (movement.movementType === 'OUT') stockKg -= qty;
    else stockKg += qty;
  }
  return Math.round(stockKg * 1000) / 1000;
};

const resolveWarehouseId = async (warehouseId?: string): Promise<string> => {
  if (warehouseId) return warehouseId;

  const warehouse = await prisma.warehouse.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!warehouse) throw new WarehouseNotFoundError();
  return warehouse.id;
};

const generateNextSaleNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `SAL-${year}-`;

  const lastSale = await prisma.sale.findFirst({
    where: { saleNumber: { startsWith: prefix } },
    orderBy: { saleNumber: 'desc' },
  });

  let nextNumber = 1;
  if (lastSale) {
    const match = lastSale.saleNumber.match(/-(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

export const listSales = async (query: ListSalesQuery) => {
  const { page, limit, search, buyerId, cropId, warehouseId, status, dateFrom, dateTo } = query;

  const where: Record<string, unknown> = {};
  if (buyerId) where.buyerId = buyerId;
  if (cropId) where.cropId = cropId;
  if (warehouseId) where.warehouseId = warehouseId;
  if (status) where.status = status;
  if (search) where.saleNumber = { contains: search, mode: 'insensitive' };

  if (dateFrom || dateTo) {
    where.saleDate = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    };
  }

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: withRelations,
      orderBy: { saleDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.sale.count({ where }),
  ]);

  return {
    data: sales,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getSaleById = async (id: string) => {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: withRelations,
  });

  if (!sale) throw new SaleNotFoundError();
  return sale;
};

export const createSale = async (input: CreateSaleInput, createdBy: string, audit: AuditContext) => {
  const buyer = await prisma.buyer.findUnique({ where: { id: input.buyerId } });
  if (!buyer) throw new BuyerNotFoundError();

  const crop = await prisma.crop.findUnique({ where: { id: input.cropId } });
  if (!crop) throw new CropNotFoundError();

  const warehouseId = await resolveWarehouseId(input.warehouseId);

  const currentStock = await prisma.inventoryTransaction.findMany({
    where: { warehouseId, cropId: input.cropId },
  });

  const available = computeStock(currentStock);
  if (input.dispatchWeightKg > available) {
    throw new InsufficientStockError(available, input.dispatchWeightKg);
  }

  await assertNoRecentDuplicate(
    'sale',
    () =>
      prisma.sale.findFirst({
        where: {
          buyerId: input.buyerId,
          cropId: input.cropId,
          dispatchWeightKg: input.dispatchWeightKg,
          sellingRatePerKg: input.sellingRatePerKg,
          createdBy,
          createdAt: { gte: new Date(Date.now() - DUPLICATE_SUBMISSION_WINDOW_MS) },
        },
      }),
    input.force
  );

  const saleNumber = await generateNextSaleNumber();
  const expectedRevenue = Math.round(input.dispatchWeightKg * input.sellingRatePerKg * 100) / 100;

  const sale = await prisma.sale.create({
    data: {
      saleNumber,
      buyerId: input.buyerId,
      cropId: input.cropId,
      quality: input.quality || null,
      numberOfBags: input.numberOfBags ?? null,
      dispatchWeightKg: input.dispatchWeightKg,
      sellingRatePerKg: input.sellingRatePerKg,
      expectedRevenue,
      saleDate: input.saleDate,
      warehouseId,
      status: input.status ?? 'PENDING',
      notes: input.notes || null,
      createdBy,
    },
    include: withRelations,
  });

  await recordAuditLog({
    context: audit,
    action: 'SALE_CREATED',
    entityType: 'Sale',
    entityId: sale.id,
    newValue: sale,
  });

  return sale;
};

export const updateSaleStatus = async (id: string, input: UpdateSaleStatusInput, updatedBy: string) => {
  const existing = await prisma.sale.findUnique({ where: { id } });
  if (!existing) throw new SaleNotFoundError();

  if (TERMINAL_STATUSES.includes(existing.status)) {
    throw new TerminalStatusError(existing.status);
  }

  // DELIVERED must carry the buyer's final weight and settlement amount
  // — see saleSettlement.service.ts. Reaching it any other way would
  // finalize the sale without ever recording that data.
  if (input.status === 'DELIVERED') {
    throw new RequiresSettlementError();
  }

  // The availability re-check, the status flip, and the stock movement
  // it triggers all commit as one transaction — otherwise two sales
  // dispatched at nearly the same moment could both read the same
  // "available" figure before either write lands, jointly overselling.
  // (Same pattern as BuyerPayment's outstanding-balance guard.)
  const updated = await prisma.$transaction(async (tx) => {
    // The truck actually leaving the warehouse (DISPATCHED) is the real
    // stock-out event, mirroring how Purchase only records its IN
    // movement on AT_WAREHOUSE. Re-check availability here — stock may
    // have moved since this sale was created.
    if (input.status === 'DISPATCHED') {
      const movements = await tx.inventoryTransaction.findMany({
        where: { warehouseId: existing.warehouseId, cropId: existing.cropId },
      });
      const available = computeStock(movements);
      const requested = Number(existing.dispatchWeightKg);
      if (requested > available) {
        throw new InsufficientStockError(available, requested);
      }
    }

    const result = await tx.sale.update({
      where: { id },
      data: { status: input.status },
      include: withRelations,
    });

    if (input.status === 'DISPATCHED') {
      await createSaleStockOut(
        {
          id: result.id,
          saleNumber: result.saleNumber,
          warehouseId: result.warehouseId,
          cropId: result.cropId,
          dispatchWeightKg: result.dispatchWeightKg,
          numberOfBags: result.numberOfBags,
          createdBy: updatedBy,
        },
        tx
      );
    } else if (input.status === 'CANCELLED') {
      // If the goods had already been dispatched before cancellation,
      // the stock they took out must come back — see reverseSaleStockOut.
      await reverseSaleStockOut(
        {
          id: result.id,
          saleNumber: result.saleNumber,
          warehouseId: result.warehouseId,
          cropId: result.cropId,
          dispatchWeightKg: result.dispatchWeightKg,
          numberOfBags: result.numberOfBags,
          createdBy: updatedBy,
        },
        tx
      );
    }

    return result;
  });

  return updated;
};
