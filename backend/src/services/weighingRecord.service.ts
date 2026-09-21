import prisma from '../config/prismaClient';
import {
  CreateWeighingRecordInput,
  ListWeighingRecordsQuery,
} from '../validators/weighingRecord.validator';

export class PurchaseNotFoundError extends Error {
  constructor() {
    super('Purchase not found.');
    this.name = 'PurchaseNotFoundError';
  }
}

export class WeighingRecordNotFoundError extends Error {
  constructor() {
    super('Weighing record not found.');
    this.name = 'WeighingRecordNotFoundError';
  }
}

const TERMINAL_STATUSES = ['COMPLETED', 'CANCELLED'];

const withRelations = {
  purchase: {
    select: { id: true, purchaseNumber: true, farmerId: true, cropId: true },
  },
  recordedByUser: { select: { id: true, name: true } },
} as const;

export const listWeighingRecords = async (query: ListWeighingRecordsQuery) => {
  const { page, limit, purchaseId } = query;

  const where: Record<string, unknown> = {};
  if (purchaseId) where.purchaseId = purchaseId;

  const [records, total] = await Promise.all([
    prisma.weighingRecord.findMany({
      where,
      include: withRelations,
      orderBy: [{ weighingDate: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.weighingRecord.count({ where }),
  ]);

  return {
    data: records,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getWeighingRecordById = async (id: string) => {
  const record = await prisma.weighingRecord.findUnique({
    where: { id },
    include: withRelations,
  });
  if (!record) {
    throw new WeighingRecordNotFoundError();
  }
  return record;
};

export const createWeighingRecord = async (
  input: CreateWeighingRecordInput,
  recordedBy: string
) => {
  const purchase = await prisma.purchase.findUnique({ where: { id: input.purchaseId } });
  if (!purchase) {
    throw new PurchaseNotFoundError();
  }

  // Defaults from the purchase's current bag weight if not overridden —
  // but recorded as this weighing event's own independent value.
  const standardBagWeightKg = input.standardBagWeightKg ?? Number(purchase.bagWeightKg);

  // The core calculation this whole module exists for.
  const expectedWeightKg = input.numberOfBags * standardBagWeightKg;
  const weightDifferenceKg = input.actualWeightKg - expectedWeightKg;

  const record = await prisma.weighingRecord.create({
    data: {
      purchaseId: input.purchaseId,
      numberOfBags: input.numberOfBags,
      standardBagWeightKg,
      expectedWeightKg,
      actualWeightKg: input.actualWeightKg,
      weightDifferenceKg,
      weighingDate: input.weighingDate,
      notes: input.notes || null,
      recordedBy,
    },
    include: withRelations,
  });

  // Sync the purchase's actual quantity/bag count to reflect what was
  // just weighed — but ONLY while the purchase is still active. A
  // COMPLETED or CANCELLED purchase is left untouched; the weighing
  // record is still saved for the historical note, it just doesn't
  // retroactively change a finished deal. The frozen purchaseRatePerKg
  // is never read or written here — only quantity-driven fields.
  if (!TERMINAL_STATUSES.includes(purchase.status)) {
    const totalGrossAmount =
      Math.round(input.actualWeightKg * Number(purchase.purchaseRatePerKg) * 100) / 100;
    const remainingPayable =
      Math.round((totalGrossAmount - Number(purchase.advanceAmount)) * 100) / 100;

    await prisma.purchase.update({
      where: { id: purchase.id },
      data: {
        actualQuantityKg: input.actualWeightKg,
        numberOfBags: input.numberOfBags,
        bagWeightKg: standardBagWeightKg,
        totalGrossAmount,
        remainingPayable,
      },
    });
  }

  return record;
};
