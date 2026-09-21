import { z } from 'zod';
import { emptyStringToUndefined } from './shared';

// Crop codes are short alphanumeric identifiers set deliberately by the
// owner (e.g. RICE, WHEAT), not auto-generated like farmer codes, since
// the crop list is small and curated rather than growing continuously.
const cropCodePattern = /^[A-Za-z0-9\-]{2,20}$/;

export const createCropSchema = z.object({
  cropCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, 'Crop code is required.')
    .regex(cropCodePattern, 'Crop code must be 2-20 letters, numbers or hyphens.'),

  name: z
    .string()
    .trim()
    .min(1, 'Crop name is required.')
    .max(100, 'Crop name is too long.'),

  // Defaults to the standard 42kg bag if not specified, but is fully
  // configurable per crop — never hard-coded anywhere else in the app.
  defaultBagWeightKg: z.coerce
    .number({ message: 'Bag weight must be a number.' })
    .positive('Bag weight must be greater than zero.')
    .max(1000, 'Bag weight seems unreasonably high — please check.')
    .optional()
    .default(42),

  // Optional — when set, the Inventory module shows a low-stock warning
  // once calculated current stock for this crop falls below this level.
  lowStockThresholdKg: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number()
      .positive('Low stock threshold must be greater than zero.')
      .optional()
  ),
});

export const updateCropSchema = createCropSchema;

export const updateCropStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    message: 'Status must be ACTIVE or INACTIVE.',
  }),
});

export const listCropsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  search: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export type CreateCropInput = z.infer<typeof createCropSchema>;
export type UpdateCropInput = z.infer<typeof updateCropSchema>;
export type UpdateCropStatusInput = z.infer<typeof updateCropStatusSchema>;
export type ListCropsQuery = z.infer<typeof listCropsQuerySchema>;
