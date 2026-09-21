import prisma from '../config/prismaClient';
import { ListMasterQuery } from '../validators/transportMaster.validator';

export class DuplicateVehicleNumberError extends Error {
  constructor() {
    super('A vehicle with this number already exists.');
    this.name = 'DuplicateVehicleNumberError';
  }
}

export class VehicleNotFoundError extends Error {
  constructor() {
    super('Vehicle not found.');
    this.name = 'VehicleNotFoundError';
  }
}

export const listVehicles = async (query: ListMasterQuery) => {
  const { page, limit, search, status } = query;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { vehicleNumber: { contains: search, mode: 'insensitive' } },
      { vehicleType: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.vehicle.count({ where }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

export const getVehicleById = async (id: string) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new VehicleNotFoundError();
  return vehicle;
};

export const createVehicle = async (input: { vehicleNumber: string; vehicleType?: string }) => {
  const existing = await prisma.vehicle.findUnique({ where: { vehicleNumber: input.vehicleNumber } });
  if (existing) throw new DuplicateVehicleNumberError();

  return prisma.vehicle.create({
    data: { vehicleNumber: input.vehicleNumber, vehicleType: input.vehicleType || null },
  });
};

export const updateVehicle = async (
  id: string,
  input: { vehicleNumber: string; vehicleType?: string }
) => {
  await getVehicleById(id);
  const byNumber = await prisma.vehicle.findUnique({ where: { vehicleNumber: input.vehicleNumber } });
  if (byNumber && byNumber.id !== id) throw new DuplicateVehicleNumberError();

  return prisma.vehicle.update({
    where: { id },
    data: { vehicleNumber: input.vehicleNumber, vehicleType: input.vehicleType || null },
  });
};

export const updateVehicleStatus = async (id: string, status: 'ACTIVE' | 'INACTIVE') => {
  await getVehicleById(id);
  return prisma.vehicle.update({ where: { id }, data: { status } });
};
