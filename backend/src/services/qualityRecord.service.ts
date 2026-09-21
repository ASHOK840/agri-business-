import prisma from '../config/prismaClient';
import {
  CreateQualityRecordInput,
  UpdateQualityRecordInput,
  ListQualityRecordsQuery,
} from '../validators/qualityRecord.validator';

export class PurchaseNotFoundError extends Error {
  constructor() {
    super('Purchase not found.');
    this.name = 'PurchaseNotFoundError';
  }
}
export class BuyerNotFoundError extends Error {
  constructor() {
    super('Buyer not found.');
    this.name = 'BuyerNotFoundError';
  }
}
export class QualityStatusNotFoundError extends Error {
  constructor() {
    super('Quality status not found.');
    this.name = 'QualityStatusNotFoundError';
  }
}
export class RejectionReasonRequiredError extends Error {
  constructor() {
    super('A rejection reason is required when the quality status represents a rejection.');
    this.name = 'RejectionReasonRequiredError';
  }
}
export class QualityRecordNotFoundError extends Error {
  constructor() {
    super('Quality record not found.');
    this.name = 'QualityRecordNotFoundError';
  }
}

const withRelations = {
  purchase: { select: { id: true, purchaseNumber: true, cropId: true } },
  buyer: { select: { id: true, buyerCode: true, companyName: true } },
  qualityStatus: true,
  assessedByUser: { select: { id: true, name: true } },
} as const;

// Looks up the QualityStatus row and checks its isRejection flag —
// NEVER a hard-coded string comparison against 'REJECTED'. This is
// what makes the "configurable quality system" requirement actually
// work end to end: even a status the owner adds later is correctly
// treated as a rejection if they flag it that way.
const validateQualityStatusReference = async (
  qualityStatusId: string,
  rejectionReason?: string
) => {
  const qualityStatus = await prisma.qualityStatus.findUnique({ where: { id: qualityStatusId } });
  if (!qualityStatus) throw new QualityStatusNotFoundError();

  if (qualityStatus.isRejection && !rejectionReason) {
    throw new RejectionReasonRequiredError();
  }

  return qualityStatus;
};

export const listQualityRecords = async (query: ListQualityRecordsQuery) => {
  const { page, limit, purchaseId, buyerId, qualityStatusId, dateFrom, dateTo } = query;

  const where: Record<string, unknown> = {};
  if (purchaseId) where.purchaseId = purchaseId;
  if (buyerId) where.buyerId = buyerId;
  if (qualityStatusId) where.qualityStatusId = qualityStatusId;
  if (dateFrom || dateTo) {
    where.assessmentDate = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    };
  }

  const [data, total] = await Promise.all([
    prisma.qualityRecord.findMany({
      where,
      include: withRelations,
      orderBy: [{ assessmentDate: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.qualityRecord.count({ where }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

export const getQualityRecordById = async (id: string) => {
  const record = await prisma.qualityRecord.findUnique({ where: { id }, include: withRelations });
  if (!record) throw new QualityRecordNotFoundError();
  return record;
};

// Creating a quality record is ALWAYS a deliberate human decision by an
// authorized user (route-level OWNER restriction) — there is no logic
// here that inspects moisturePercentage or anything else and picks a
// qualityStatusId automatically. The caller must always supply one.
export const createQualityRecord = async (
  input: CreateQualityRecordInput,
  assessedBy: string
) => {
  const purchase = await prisma.purchase.findUnique({ where: { id: input.purchaseId } });
  if (!purchase) throw new PurchaseNotFoundError();

  if (input.buyerId) {
    const buyer = await prisma.buyer.findUnique({ where: { id: input.buyerId } });
    if (!buyer) throw new BuyerNotFoundError();
  }

  await validateQualityStatusReference(input.qualityStatusId, input.rejectionReason);

  return prisma.qualityRecord.create({
    data: {
      purchaseId: input.purchaseId,
      buyerId: input.buyerId || null,
      qualityStatusId: input.qualityStatusId,
      grade: input.grade || null,
      remarks: input.remarks || null,
      moisturePercentage: input.moisturePercentage ?? null,
      buyerRemarks: input.buyerRemarks || null,
      priceAdjustment: input.priceAdjustment ?? null,
      rejectionReason: input.rejectionReason || null,
      assessedBy,
      assessmentDate: input.assessmentDate,
    },
    include: withRelations,
  });
};

// Updating is allowed (unlike CropPrice/WeighingRecord) because buyer
// feedback often arrives after the initial farmer-side assessment —
// e.g. buyerRemarks/priceAdjustment get filled in later. Still
// OWNER-only at the route level, and still re-validates the rejection
// rule against whatever qualityStatusId ends up being used.
export const updateQualityRecord = async (id: string, input: UpdateQualityRecordInput) => {
  const existing = await prisma.qualityRecord.findUnique({ where: { id } });
  if (!existing) throw new QualityRecordNotFoundError();

  if (input.buyerId) {
    const buyer = await prisma.buyer.findUnique({ where: { id: input.buyerId } });
    if (!buyer) throw new BuyerNotFoundError();
  }

  await validateQualityStatusReference(input.qualityStatusId, input.rejectionReason);

  return prisma.qualityRecord.update({
    where: { id },
    data: {
      buyerId: input.buyerId || null,
      qualityStatusId: input.qualityStatusId,
      grade: input.grade || null,
      remarks: input.remarks || null,
      moisturePercentage: input.moisturePercentage ?? null,
      buyerRemarks: input.buyerRemarks || null,
      priceAdjustment: input.priceAdjustment ?? null,
      rejectionReason: input.rejectionReason || null,
      assessmentDate: input.assessmentDate,
    },
    include: withRelations,
  });
};
