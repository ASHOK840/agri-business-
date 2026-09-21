import prisma from '../config/prismaClient';
import { CreateStaffEntryInput } from '../validators/staffEntry.validator';
import * as farmerService from './farmer.service';
import { PossibleDuplicateFarmerError } from './farmer.service';
import * as purchaseService from './purchase.service';
import * as weighingRecordService from './weighingRecord.service';
import * as cropPriceService from './cropPrice.service';
import { AuditContext } from './audit.service';

export class CropNotFoundError extends Error {
  constructor() {
    super('Crop not found.');
    this.name = 'CropNotFoundError';
  }
}

// Staff never enters a purchase rate — it's read from the latest crop
// price Admin has recorded. If none exists yet, there is nothing honest
// to compute a total from, so the entry is refused with a clear reason
// rather than guessing a number.
export class CropRateNotSetError extends Error {
  constructor() {
    super(
      "No purchase rate has been set for this crop yet. Please ask the Admin to set today's rate first."
    );
    this.name = 'CropRateNotSetError';
  }
}

type PurchaseWithNames = {
  id: string;
  purchaseNumber: string;
  purchaseDate: Date;
  status: string;
  estimatedQuantityKg: unknown;
  numberOfBags: number | null;
  farmer: { name: string; village: string | null } | null;
  crop: { name: string } | null;
};

// Deliberately excludes purchaseRatePerKg, totalGrossAmount,
// advanceAmount, and remainingPayable — Staff must never see purchase
// rate/accounting figures, per the simplified Staff role.
const toSafeEntry = (purchase: PurchaseWithNames) => ({
  id: purchase.id,
  purchaseNumber: purchase.purchaseNumber,
  farmerName: purchase.farmer?.name ?? '',
  village: purchase.farmer?.village ?? null,
  cropName: purchase.crop?.name ?? '',
  quantityKg: purchase.estimatedQuantityKg ? Number(purchase.estimatedQuantityKg) : null,
  numberOfBags: purchase.numberOfBags,
  status: purchase.status,
  purchaseDate: purchase.purchaseDate,
});

export const createStaffEntry = async (
  input: CreateStaffEntryInput,
  userId: string,
  audit: AuditContext
) => {
  const crop = await prisma.crop.findUnique({ where: { id: input.cropId } });
  if (!crop) {
    throw new CropNotFoundError();
  }

  // Find or create the farmer — reuses the existing Farmer service
  // (farmer-code generation, duplicate detection) rather than
  // duplicating any of that logic here.
  let farmerId = input.farmerId ?? null;
  if (!farmerId) {
    try {
      const farmer = await farmerService.createFarmer(
        {
          name: input.farmerName!,
          village: input.village || '',
          phone: input.phone || '',
        },
        audit
      );
      farmerId = farmer.id;
    } catch (error) {
      // A likely-duplicate farmer (same name + phone) already exists.
      // Staff has no "force create" option on this simplified screen, so
      // reuse the existing farmer instead of blocking the entry — see
      // "do not create duplicate farmers unnecessarily".
      if (error instanceof PossibleDuplicateFarmerError) {
        farmerId = error.existingFarmer.id;
      } else {
        throw error;
      }
    }
  }

  // The purchase rate is sourced internally from the latest recorded
  // market price for this crop — Staff never sees or enters a rate.
  const latestPrices = await cropPriceService.getLatestCropPrices({ cropId: input.cropId });
  if (latestPrices.length === 0) {
    throw new CropRateNotSetError();
  }
  const purchaseRatePerKg = Number(latestPrices[0].pricePerKg);

  const now = new Date();

  // Reuses the existing Purchase service exactly as the full Admin
  // Purchase form does — no new calculation logic here.
  const purchase = await purchaseService.createPurchase(
    {
      farmerId: farmerId!,
      cropId: input.cropId,
      purchaseRatePerKg,
      estimatedQuantityKg: input.quantityKg,
      purchaseDate: now,
      advanceAmount: 0,
    },
    userId,
    audit
  );

  // Reuses the existing WeighingRecord service — this is what turns the
  // entered quantity/bags into the purchase's actual (weighed) figures.
  await weighingRecordService.createWeighingRecord(
    {
      purchaseId: purchase.id,
      numberOfBags: input.numberOfBags,
      actualWeightKg: input.quantityKg,
      weighingDate: now,
    },
    userId
  );

  // Reuses the exact same status-transition service the full Admin
  // workflow uses. This is the ONLY code path that ever creates an
  // inventory IN movement — untouched here, just invoked.
  const finalPurchase = await purchaseService.updatePurchaseStatus(
    purchase.id,
    { status: 'AT_WAREHOUSE' },
    audit
  );

  const withRelations = await prisma.purchase.findUnique({
    where: { id: finalPurchase.id },
    include: {
      farmer: { select: { name: true, village: true } },
      crop: { select: { name: true } },
    },
  });

  return toSafeEntry(withRelations as PurchaseWithNames);
};

export const listMyStaffEntries = async (userId: string, limit: number) => {
  const purchases = await prisma.purchase.findMany({
    where: { createdBy: userId },
    include: {
      farmer: { select: { name: true, village: true } },
      crop: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return purchases.map((purchase) => toSafeEntry(purchase as PurchaseWithNames));
};
