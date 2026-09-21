import prisma from '../config/prismaClient';
import { BusinessProfileInput } from '../validators/businessProfile.validator';

// This is a singleton table: the application only ever expects one row.
// getBusinessProfile() returns the first (and only) row, or null if the
// owner hasn't configured anything yet.
export const getBusinessProfile = async () => {
  return prisma.businessProfile.findFirst({
    orderBy: { createdAt: 'asc' },
  });
};

// Normalizes empty-string optional fields (from the validator's
// `.or(z.literal(''))` allowance) into `null` before hitting the database,
// so "cleared" fields are stored as genuinely empty rather than "".
const normalize = (input: BusinessProfileInput) => ({
  businessName: input.businessName,
  ownerName: input.ownerName,
  phone: input.phone || null,
  address: input.address || null,
  pan: input.pan || null,
  gstin: input.gstin || null,
  email: input.email || null,
});

// Creates the profile if it doesn't exist yet, otherwise updates the
// existing (single) row. This is the "upsert without a known id" pattern
// needed because a singleton table has no natural fixed key to upsert on.
export const upsertBusinessProfile = async (input: BusinessProfileInput) => {
  const existing = await prisma.businessProfile.findFirst();
  const data = normalize(input);

  if (existing) {
    return prisma.businessProfile.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.businessProfile.create({ data });
};

export const updateBusinessLogo = async (logoUrl: string) => {
  const existing = await prisma.businessProfile.findFirst();

  if (!existing) {
    // A logo can't be attached before any business profile exists —
    // the owner must save the basic details first.
    return null;
  }

  return prisma.businessProfile.update({
    where: { id: existing.id },
    data: { logoUrl },
  });
};
