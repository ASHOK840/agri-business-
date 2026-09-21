import prisma from '../config/prismaClient';
import {
  CreateQualityStatusInput,
  UpdateQualityStatusInput,
  ListQualityStatusesQuery,
} from '../validators/qualityStatus.validator';

export class DuplicateQualityCodeError extends Error {
  constructor() {
    super('A quality status with this code already exists.');
    this.name = 'DuplicateQualityCodeError';
  }
}

export class QualityStatusNotFoundError extends Error {
  constructor() {
    super('Quality status not found.');
    this.name = 'QualityStatusNotFoundError';
  }
}

export const listQualityStatuses = async (query: ListQualityStatusesQuery) => {
  const { page, limit, status } = query;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.qualityStatus.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.qualityStatus.count({ where }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

export const getQualityStatusById = async (id: string) => {
  const record = await prisma.qualityStatus.findUnique({ where: { id } });
  if (!record) throw new QualityStatusNotFoundError();
  return record;
};

export const createQualityStatus = async (input: CreateQualityStatusInput) => {
  const existing = await prisma.qualityStatus.findUnique({ where: { code: input.code } });
  if (existing) throw new DuplicateQualityCodeError();

  return prisma.qualityStatus.create({
    data: {
      code: input.code,
      name: input.name,
      description: input.description || null,
      isRejection: input.isRejection,
      displayOrder: input.displayOrder,
    },
  });
};

export const updateQualityStatus = async (id: string, input: UpdateQualityStatusInput) => {
  await getQualityStatusById(id);

  const byCode = await prisma.qualityStatus.findUnique({ where: { code: input.code } });
  if (byCode && byCode.id !== id) throw new DuplicateQualityCodeError();

  return prisma.qualityStatus.update({
    where: { id },
    data: {
      code: input.code,
      name: input.name,
      description: input.description || null,
      isRejection: input.isRejection,
      displayOrder: input.displayOrder,
    },
  });
};

export const updateQualityStatusStatus = async (id: string, status: 'ACTIVE' | 'INACTIVE') => {
  await getQualityStatusById(id);
  return prisma.qualityStatus.update({ where: { id }, data: { status } });
};
