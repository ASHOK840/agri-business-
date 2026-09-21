import prisma from '../config/prismaClient';
import {
  CreateCropInput,
  UpdateCropInput,
  UpdateCropStatusInput,
  ListCropsQuery,
} from '../validators/crop.validator';
import { JwtPayload } from '../utils/jwt.util';

export class DuplicateCropCodeError extends Error {
  constructor() {
    super('A crop with this crop code already exists.');
    this.name = 'DuplicateCropCodeError';
  }
}

export class CropNotFoundError extends Error {
  constructor() {
    super('Crop not found.');
    this.name = 'CropNotFoundError';
  }
}

export const listCrops = async (query: ListCropsQuery, role: JwtPayload['role']) => {
  const { page, limit, search } = query;

  const where: Record<string, unknown> = {};

  // Staff can only ever see active crops, regardless of what status
  // filter they might try to pass — this is enforced here, not just
  // hidden in the UI, so it can't be bypassed via a direct API call.
  if (role === 'STAFF') {
    where.status = 'ACTIVE';
  } else if (query.status) {
    where.status = query.status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { cropCode: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [crops, total] = await Promise.all([
    prisma.crop.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.crop.count({ where }),
  ]);

  return {
    data: crops,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getCropById = async (id: string, role: JwtPayload['role']) => {
  const crop = await prisma.crop.findUnique({ where: { id } });

  // Staff requesting an inactive crop directly by ID get the same
  // "not found" response as a genuinely missing crop, so the endpoint
  // doesn't leak the existence of deactivated crops to restricted users.
  if (!crop || (role === 'STAFF' && crop.status !== 'ACTIVE')) {
    throw new CropNotFoundError();
  }

  return crop;
};

export const createCrop = async (input: CreateCropInput) => {
  const existing = await prisma.crop.findUnique({ where: { cropCode: input.cropCode } });
  if (existing) {
    throw new DuplicateCropCodeError();
  }

  return prisma.crop.create({
    data: {
      cropCode: input.cropCode,
      name: input.name,
      defaultBagWeightKg: input.defaultBagWeightKg,
      lowStockThresholdKg: input.lowStockThresholdKg ?? null,
    },
  });
};

export const updateCrop = async (id: string, input: UpdateCropInput) => {
  const existing = await prisma.crop.findUnique({ where: { id } });
  if (!existing) {
    throw new CropNotFoundError();
  }

  const existingByCode = await prisma.crop.findUnique({ where: { cropCode: input.cropCode } });
  if (existingByCode && existingByCode.id !== id) {
    throw new DuplicateCropCodeError();
  }

  return prisma.crop.update({
    where: { id },
    data: {
      cropCode: input.cropCode,
      name: input.name,
      defaultBagWeightKg: input.defaultBagWeightKg,
      lowStockThresholdKg: input.lowStockThresholdKg ?? null,
    },
  });
};

export const updateCropStatus = async (id: string, input: UpdateCropStatusInput) => {
  const existing = await prisma.crop.findUnique({ where: { id } });
  if (!existing) {
    throw new CropNotFoundError();
  }

  return prisma.crop.update({
    where: { id },
    data: { status: input.status },
  });
};
