import { z } from 'zod';

// Phone is optional, but if provided must look like a real phone number.
const phonePattern = /^[0-9+\-\s()]{7,15}$/;

// Farmer codes are alphanumeric with optional hyphens (e.g. FARM-0001).
// Kept intentionally permissive since businesses often have their own
// existing numbering conventions from handwritten records.
const farmerCodePattern = /^[A-Za-z0-9\-]{2,20}$/;

export const createFarmerSchema = z.object({
  farmerCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(farmerCodePattern, 'Farmer code must be 2-20 letters, numbers or hyphens.')
    .optional()
    .or(z.literal('')),

  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(200, 'Name is too long.'),

  phone: z
    .string()
    .trim()
    .regex(phonePattern, 'Enter a valid phone number.')
    .optional()
    .or(z.literal('')),

  address: z.string().trim().max(500, 'Address is too long.').optional().or(z.literal('')),

  village: z.string().trim().max(200, 'Village name is too long.').optional().or(z.literal('')),

  // When the backend detects a likely duplicate (same name + phone), it
  // responds 409 instead of creating the record. Resubmitting with
  // force: true confirms the user really does want a second record.
  force: z.boolean().optional(),
});

export const updateFarmerSchema = createFarmerSchema.omit({ force: true });

export const updateFarmerStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    message: 'Status must be ACTIVE or INACTIVE.',
  }),
});

export const listFarmersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export type CreateFarmerInput = z.infer<typeof createFarmerSchema>;
export type UpdateFarmerInput = z.infer<typeof updateFarmerSchema>;
export type UpdateFarmerStatusInput = z.infer<typeof updateFarmerStatusSchema>;
export type ListFarmersQuery = z.infer<typeof listFarmersQuerySchema>;
