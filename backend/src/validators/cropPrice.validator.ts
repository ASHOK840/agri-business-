import { z } from 'zod';

const uuidSchema = z.string().uuid('Invalid ID format.');

// CropPrice is create + read ONLY — there is no update schema, because
// price records are never edited. A correction is a new record.
export const createCropPriceSchema = z.object({
  cropId: uuidSchema,

  buyerId: uuidSchema.optional().or(z.literal('')),

  quality: z.string().trim().max(100, 'Quality/grade is too long.').optional().or(z.literal('')),

  pricePerKg: z.coerce
    .number({ message: 'Price per kg must be a number.' })
    .positive('Price per kg must be greater than zero.')
    .max(100000, 'Price per kg seems unreasonably high — please check.'),

  // Accepts a date string (e.g. "2026-09-13") and coerces to a Date.
  effectiveDate: z.coerce.date({ message: 'Enter a valid date.' }),

  sourceType: z.enum(['MARKET', 'BUYER_QUOTE', 'MANUAL']).default('MARKET'),

  notes: z.string().trim().max(1000, 'Notes are too long.').optional().or(z.literal('')),
});

export const listCropPricesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cropId: uuidSchema.optional(),
  buyerId: uuidSchema.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const latestCropPriceQuerySchema = z.object({
  cropId: uuidSchema.optional(),
  buyerId: uuidSchema.optional(),
});

export type CreateCropPriceInput = z.infer<typeof createCropPriceSchema>;
export type ListCropPricesQuery = z.infer<typeof listCropPricesQuerySchema>;
export type LatestCropPriceQuery = z.infer<typeof latestCropPriceQuerySchema>;
