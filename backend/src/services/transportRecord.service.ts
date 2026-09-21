import prisma from '../config/prismaClient';
import {
  CreateTransportRecordInput,
  UpdateTransportRecordInput,
  UpdateTransportStatusInput,
  ListTransportQuery,
} from '../validators/transportRecord.validator';

export class TransporterNotFoundError extends Error {
  constructor() {
    super('Transporter not found.');
    this.name = 'TransporterNotFoundError';
  }
}
export class DriverNotFoundError extends Error {
  constructor() {
    super('Driver not found.');
    this.name = 'DriverNotFoundError';
  }
}
export class VehicleNotFoundError extends Error {
  constructor() {
    super('Vehicle not found.');
    this.name = 'VehicleNotFoundError';
  }
}
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
export class CropNotFoundError extends Error {
  constructor() {
    super('Crop not found.');
    this.name = 'CropNotFoundError';
  }
}
export class TransportRecordNotFoundError extends Error {
  constructor() {
    super('Transport record not found.');
    this.name = 'TransportRecordNotFoundError';
  }
}
export class TerminalStatusError extends Error {
  constructor(currentStatus: string) {
    super(
      `This transport record is already ${currentStatus} and cannot be changed further. DELIVERED and CANCELLED are final states.`
    );
    this.name = 'TerminalStatusError';
  }
}
export class InvalidAssignedUserError extends Error {
  constructor() {
    super('The selected user is not a Transportation login.');
    this.name = 'InvalidAssignedUserError';
  }
}
// Thrown when a TRANSPORTATION user tries to view/act on a trip that
// isn't assigned to them — including by guessing another trip's ID in
// the URL. Server-side, not just a hidden menu item.
export class ForbiddenTransportRecordError extends Error {
  constructor() {
    super('This trip is not assigned to you.');
    this.name = 'ForbiddenTransportRecordError';
  }
}
export class InvalidTransportTransitionError extends Error {
  constructor() {
    super(
      'You can only start a trip (Pending → In Transit) or mark it delivered (In Transit → Delivered).'
    );
    this.name = 'InvalidTransportTransitionError';
  }
}

const TERMINAL_STATUSES = ['DELIVERED', 'CANCELLED'];

const withRelations = {
  transporter: { select: { id: true, transporterCode: true, name: true } },
  driver: { select: { id: true, driverCode: true, name: true } },
  vehicle: { select: { id: true, vehicleNumber: true } },
  purchase: { select: { id: true, purchaseNumber: true } },
  buyer: { select: { id: true, buyerCode: true, companyName: true } },
  crop: { select: { id: true, cropCode: true, name: true } },
  assignedUser: { select: { id: true, name: true } },
} as const;

const assertValidAssignedUser = async (assignedUserId: string) => {
  const user = await prisma.user.findUnique({ where: { id: assignedUserId } });
  if (!user || user.role !== 'TRANSPORTATION') {
    throw new InvalidAssignedUserError();
  }
};

export const listTransportRecords = async (query: ListTransportQuery) => {
  const { page, limit, search, direction, purchaseId, farmerId, buyerId, cropId, status, dateFrom, dateTo } =
    query;

  const where: Record<string, unknown> = {};
  if (direction) where.direction = direction;
  if (purchaseId) where.purchaseId = purchaseId;
  if (farmerId) where.purchase = { farmerId };
  if (buyerId) where.buyerId = buyerId;
  if (cropId) where.cropId = cropId;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { fromLocation: { contains: search, mode: 'insensitive' } },
      { toLocation: { contains: search, mode: 'insensitive' } },
      { transporter: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }
  if (dateFrom || dateTo) {
    where.transportDate = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    };
  }

  const [data, total] = await Promise.all([
    prisma.transportRecord.findMany({
      where,
      include: withRelations,
      orderBy: { transportDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transportRecord.count({ where }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

export const getTransportRecordById = async (id: string) => {
  const record = await prisma.transportRecord.findUnique({ where: { id }, include: withRelations });
  if (!record) throw new TransportRecordNotFoundError();
  return record;
};

export const createTransportRecord = async (
  input: CreateTransportRecordInput,
  createdBy: string
) => {
  const transporter = await prisma.transporter.findUnique({ where: { id: input.transporterId } });
  if (!transporter) throw new TransporterNotFoundError();

  if (input.driverId) {
    const driver = await prisma.driver.findUnique({ where: { id: input.driverId } });
    if (!driver) throw new DriverNotFoundError();
  }
  if (input.vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
    if (!vehicle) throw new VehicleNotFoundError();
  }
  if (input.purchaseId) {
    const purchase = await prisma.purchase.findUnique({ where: { id: input.purchaseId } });
    if (!purchase) throw new PurchaseNotFoundError();
  }
  if (input.buyerId) {
    const buyer = await prisma.buyer.findUnique({ where: { id: input.buyerId } });
    if (!buyer) throw new BuyerNotFoundError();
  }
  const crop = await prisma.crop.findUnique({ where: { id: input.cropId } });
  if (!crop) throw new CropNotFoundError();

  if (input.assignedUserId) {
    await assertValidAssignedUser(input.assignedUserId);
  }

  // NOTE: transportCost is stored here and ONLY here. It is never
  // written into Purchase.totalGrossAmount, purchaseRatePerKg, or any
  // other Purchase field — this is the "keep it as a separate expense"
  // requirement enforced structurally, not just by convention.
  return prisma.transportRecord.create({
    data: {
      direction: input.direction,
      transporterId: input.transporterId,
      driverId: input.driverId || null,
      vehicleId: input.vehicleId || null,
      purchaseId: input.purchaseId || null,
      buyerId: input.buyerId || null,
      cropId: input.cropId,
      assignedUserId: input.assignedUserId || null,
      fromLocation: input.fromLocation,
      toLocation: input.toLocation,
      numberOfBags: input.numberOfBags ?? null,
      weightKg: input.weightKg ?? null,
      transportCost: input.transportCost,
      transportDate: input.transportDate,
      notes: input.notes || null,
      createdBy,
    },
    include: withRelations,
  });
};

export const updateTransportRecord = async (id: string, input: UpdateTransportRecordInput) => {
  const existing = await prisma.transportRecord.findUnique({ where: { id } });
  if (!existing) throw new TransportRecordNotFoundError();
  if (TERMINAL_STATUSES.includes(existing.status)) {
    throw new TerminalStatusError(existing.status);
  }

  if (input.driverId) {
    const driver = await prisma.driver.findUnique({ where: { id: input.driverId } });
    if (!driver) throw new DriverNotFoundError();
  }
  if (input.vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
    if (!vehicle) throw new VehicleNotFoundError();
  }
  if (input.assignedUserId) {
    await assertValidAssignedUser(input.assignedUserId);
  }

  return prisma.transportRecord.update({
    where: { id },
    data: {
      driverId: input.driverId !== undefined ? input.driverId || null : undefined,
      vehicleId: input.vehicleId !== undefined ? input.vehicleId || null : undefined,
      assignedUserId: input.assignedUserId !== undefined ? input.assignedUserId || null : undefined,
      fromLocation: input.fromLocation ?? existing.fromLocation,
      toLocation: input.toLocation ?? existing.toLocation,
      numberOfBags: input.numberOfBags ?? existing.numberOfBags,
      weightKg: input.weightKg ?? existing.weightKg,
      transportCost: input.transportCost ?? existing.transportCost,
      transportDate: input.transportDate ?? existing.transportDate,
      notes: input.notes !== undefined ? input.notes || null : undefined,
    },
    include: withRelations,
  });
};

// `actor` is only passed for the TRANSPORTATION-scoped route — Admin's
// own status route calls this without it and keeps its existing
// unrestricted behavior (any transition, any record).
export const updateTransportStatus = async (
  id: string,
  input: UpdateTransportStatusInput,
  actor?: { userId: string; role: 'TRANSPORTATION' }
) => {
  const existing = await prisma.transportRecord.findUnique({ where: { id } });
  if (!existing) throw new TransportRecordNotFoundError();

  // Ownership check comes before anything else that reveals the record's
  // state — a Transportation user must never learn even the status of a
  // trip that isn't theirs by guessing/changing the ID in the URL.
  if (actor?.role === 'TRANSPORTATION' && existing.assignedUserId !== actor.userId) {
    throw new ForbiddenTransportRecordError();
  }

  if (TERMINAL_STATUSES.includes(existing.status)) {
    throw new TerminalStatusError(existing.status);
  }

  if (actor?.role === 'TRANSPORTATION') {
    const allowedTransition =
      (existing.status === 'PENDING' && input.status === 'IN_TRANSIT') ||
      (existing.status === 'IN_TRANSIT' && input.status === 'DELIVERED');

    if (!allowedTransition) {
      throw new InvalidTransportTransitionError();
    }
  }

  return prisma.transportRecord.update({
    where: { id },
    data: { status: input.status },
    include: withRelations,
  });
};

// The entire "My Trips" surface for the TRANSPORTATION role — only ever
// this user's own active (not yet delivered/cancelled) assigned trips,
// filtered server-side by assignedUserId, never a generic list endpoint.
export const listMyAssignedTransportRecords = async (userId: string) => {
  return prisma.transportRecord.findMany({
    where: { assignedUserId: userId, status: { in: ['PENDING', 'IN_TRANSIT'] } },
    include: withRelations,
    orderBy: { transportDate: 'asc' },
  });
};

// Prepares for future profit calculation: sums transport cost, grouped
// by purchase, so a future Profit/Loss module can pull "total transport
// expense for this purchase" as a single number alongside labour costs.
export const getTransportCostSummary = async (query: {
  purchaseId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) => {
  const where: Record<string, unknown> = {};
  if (query.purchaseId) where.purchaseId = query.purchaseId;
  if (query.dateFrom || query.dateTo) {
    where.transportDate = {
      ...(query.dateFrom ? { gte: query.dateFrom } : {}),
      ...(query.dateTo ? { lte: query.dateTo } : {}),
    };
  }

  const records = await prisma.transportRecord.findMany({ where });
  const totalCost = records.reduce(
    (sum: number, r: { transportCost: unknown }) => sum + Number(r.transportCost),
    0
  );

  return {
    recordCount: records.length,
    totalTransportCost: Math.round(totalCost * 100) / 100,
  };
};
