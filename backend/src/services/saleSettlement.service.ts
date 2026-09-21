import prisma from '../config/prismaClient';
import {
  CreateSaleSettlementInput,
  ListSaleSettlementsQuery,
} from '../validators/saleSettlement.validator';
import { createSaleRejectionReturn } from './inventory.service';
import { AuditContext, recordAuditLog } from './audit.service';

export class SaleNotFoundError extends Error {
  constructor() {
    super('Sale not found.');
    this.name = 'SaleNotFoundError';
  }
}

export class SaleSettlementNotFoundError extends Error {
  constructor() {
    super('Sale settlement not found.');
    this.name = 'SaleSettlementNotFoundError';
  }
}

export class SaleNotDispatchedError extends Error {
  constructor(currentStatus: string) {
    super(
      `Cannot record a delivery settlement — this sale is ${currentStatus}, not DISPATCHED yet.`
    );
    this.name = 'SaleNotDispatchedError';
  }
}

export class SettlementAlreadyExistsError extends Error {
  constructor() {
    super('A delivery settlement has already been recorded for this sale.');
    this.name = 'SettlementAlreadyExistsError';
  }
}

export class SettlementRequiresOwnerError extends Error {
  constructor() {
    super(
      'Only the owner can authorize a price-adjusted or rejected settlement — this changes revenue for the sale.'
    );
    this.name = 'SettlementRequiresOwnerError';
  }
}

export class QuantityAffectedExceedsDispatchError extends Error {
  constructor(dispatchWeightKg: number, quantityAffectedKg: number) {
    super(
      `Quantity affected (${quantityAffectedKg}kg) cannot exceed the dispatched weight (${dispatchWeightKg}kg).`
    );
    this.name = 'QuantityAffectedExceedsDispatchError';
  }
}

const withRelations = {
  sale: {
    select: {
      id: true,
      saleNumber: true,
      status: true,
      buyer: { select: { id: true, buyerCode: true, companyName: true } },
      crop: { select: { id: true, cropCode: true, name: true } },
    },
  },
  recordedByUser: { select: { id: true, name: true } },
} as const;

export const listSaleSettlements = async (query: ListSaleSettlementsQuery) => {
  const { page, limit, saleId } = query;

  const where: Record<string, unknown> = {};
  if (saleId) where.saleId = saleId;

  const [data, total] = await Promise.all([
    prisma.saleSettlement.findMany({
      where,
      include: withRelations,
      orderBy: { receivedDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.saleSettlement.count({ where }),
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

export const getSaleSettlementById = async (id: string) => {
  const settlement = await prisma.saleSettlement.findUnique({
    where: { id },
    include: withRelations,
  });
  if (!settlement) throw new SaleSettlementNotFoundError();
  return settlement;
};

export const getSaleSettlementBySaleId = async (saleId: string) => {
  const settlement = await prisma.saleSettlement.findUnique({
    where: { saleId },
    include: withRelations,
  });
  if (!settlement) throw new SaleSettlementNotFoundError();
  return settlement;
};

export const createSaleSettlement = async (
  input: CreateSaleSettlementInput,
  recordedBy: string,
  actorRole: 'ADMIN' | 'STAFF' | 'TRANSPORTATION',
  audit: AuditContext
) => {
  // A price adjustment or rejection changes what the business actually
  // gets paid (or loses) — the same "financially significant decision"
  // bar as QualityRecord.priceAdjustment, so it requires the owner.
  // Plain acceptance stays open to any authenticated user, same as
  // Module 17 already shipped.
  if (
    (input.settlementStatus === 'PRICE_ADJUSTED' || input.settlementStatus === 'REJECTED') &&
    actorRole !== 'ADMIN'
  ) {
    throw new SettlementRequiresOwnerError();
  }

  const sale = await prisma.sale.findUnique({ where: { id: input.saleId } });
  if (!sale) throw new SaleNotFoundError();

  // The buyer can only report a final weight once the truck has actually
  // reached them — i.e. the sale has been DISPATCHED. A sale still
  // PENDING/CONFIRMED/LOADED hasn't left yet; DELIVERED/CANCELLED means
  // this step is already done or moot.
  if (sale.status !== 'DISPATCHED') {
    throw new SaleNotDispatchedError(sale.status);
  }

  const existing = await prisma.saleSettlement.findUnique({ where: { saleId: input.saleId } });
  if (existing) throw new SettlementAlreadyExistsError();

  // Snapshot the sale's frozen figures — this NEVER writes back to the
  // Sale row itself (see the schema.prisma comment on SaleSettlement).
  // The original agreed rate is preserved here untouched even when a
  // PRICE_ADJUSTED rate is also recorded below.
  const dispatchWeightKg = Number(sale.dispatchWeightKg);
  const sellingRatePerKg = Number(sale.sellingRatePerKg);

  if (
    input.quantityAffectedKg !== undefined &&
    input.quantityAffectedKg > dispatchWeightKg
  ) {
    throw new QuantityAffectedExceedsDispatchError(dispatchWeightKg, input.quantityAffectedKg);
  }

  const weightDifferenceKg =
    Math.round((input.buyerFinalWeightKg - dispatchWeightKg) * 1000) / 1000;
  const differencePercentage =
    Math.round((weightDifferenceKg / dispatchWeightKg) * 100 * 100) / 100;

  // The effective rate used for settlement: the buyer's negotiated rate
  // when PRICE_ADJUSTED, otherwise exactly the original agreed rate —
  // see "Do not automatically modify the original sale rate."
  const effectiveRatePerKg =
    input.settlementStatus === 'PRICE_ADJUSTED' && input.adjustedSellingRatePerKg !== undefined
      ? input.adjustedSellingRatePerKg
      : sellingRatePerKg;

  const adjustmentAmount = input.adjustmentAmount ?? 0;
  const finalSettlementAmount =
    Math.round((input.buyerFinalWeightKg * effectiveRatePerKg + adjustmentAmount) * 100) / 100;

  // Both writes happen atomically: recording the settlement is the ONLY
  // way a sale reaches DELIVERED (mirrors how DISPATCHED is the only
  // trigger for the inventory OUT movement — see sale.service.ts's
  // RequiresSettlementError), and the returned settlement should reflect
  // that new status, not the pre-update DISPATCHED snapshot.
  const settlement = await prisma.$transaction(async (tx) => {
    const created = await tx.saleSettlement.create({
      data: {
        saleId: input.saleId,
        dispatchWeightKg,
        sellingRatePerKg,
        buyerFinalWeightKg: input.buyerFinalWeightKg,
        weightDifferenceKg,
        differencePercentage,
        settlementStatus: input.settlementStatus,
        adjustedSellingRatePerKg:
          input.settlementStatus === 'PRICE_ADJUSTED' ? input.adjustedSellingRatePerKg : null,
        priceAdjustmentReason:
          input.settlementStatus === 'PRICE_ADJUSTED' ? input.priceAdjustmentReason || null : null,
        rejectionReason: input.settlementStatus === 'REJECTED' ? input.rejectionReason || null : null,
        quantityAffectedKg:
          input.settlementStatus === 'REJECTED' ? input.quantityAffectedKg : null,
        rejectionAction: input.settlementStatus === 'REJECTED' ? input.rejectionAction : null,
        rejectionActionNotes:
          input.settlementStatus === 'REJECTED' ? input.rejectionActionNotes || null : null,
        adjustmentAmount,
        adjustmentReason: input.adjustmentReason || null,
        finalSettlementAmount,
        receivedDate: input.receivedDate,
        buyerRemarks: input.buyerRemarks || null,
        recordedBy,
      },
    });

    await tx.sale.update({
      where: { id: input.saleId },
      data: { status: 'DELIVERED' },
    });

    return tx.saleSettlement.findUniqueOrThrow({
      where: { id: created.id },
      include: withRelations,
    });
  });

  // Rejected goods that physically came back to the warehouse must be
  // reflected in stock — see inventory.service.ts's createSaleRejectionReturn.
  // Deliberately outside the transaction above (same pattern as
  // createSaleStockOut in sale.service.ts): if this fails, the settlement
  // itself is still recorded rather than lost.
  if (
    settlement.settlementStatus === 'REJECTED' &&
    settlement.rejectionAction === 'RETURN_TO_WAREHOUSE' &&
    settlement.quantityAffectedKg !== null
  ) {
    await createSaleRejectionReturn({
      id: settlement.id,
      saleNumber: settlement.sale.saleNumber,
      warehouseId: sale.warehouseId,
      cropId: sale.cropId,
      quantityAffectedKg: settlement.quantityAffectedKg,
      createdBy: recordedBy,
    });
  }

  await recordAuditLog({
    context: audit,
    action: 'SALE_SETTLED',
    entityType: 'SaleSettlement',
    entityId: settlement.id,
    newValue: settlement,
  });

  return settlement;
};
