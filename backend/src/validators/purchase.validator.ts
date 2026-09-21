import { z } from 'zod';
import { emptyStringToUndefined } from './shared';

const uuidSchema = z.string().uuid('Invalid ID format.');

// Create: establishes the deal terms. farmerId, cropId, and
// purchaseRatePerKg set here are FROZEN forever — see updatePurchaseSchema,
// which deliberately does not accept any of these three fields.
export const createPurchaseSchema = z.object({
  farmerId: uuidSchema,
  cropId: uuidSchema,

  quality: z.string().trim().max(100, 'Quality/grade is too long.').optional().or(z.literal('')),

  purchaseRatePerKg: z.coerce
    .number({ message: 'Purchase rate must be a number.' })
    .positive('Purchase rate must be greater than zero.')
    .max(100000, 'Purchase rate seems unreasonably high — please check.'),

  estimatedQuantityKg: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number()
      .positive('Estimated quantity must be greater than zero.')
      .optional()
  ),

  // bagWeightKg is optional on input — if omitted, the service fills it
  // in from the crop's current defaultBagWeightKg. Once set, it becomes
  // this purchase's own frozen value.
  bagWeightKg: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number()
      .positive('Bag weight must be greater than zero.')
      .optional()
  ),

  purchaseDate: z.coerce.date({ message: 'Enter a valid purchase date.' }),

  advanceAmount: z.coerce
    .number()
    .min(0, 'Advance amount cannot be negative.')
    .optional()
    .default(0),

  notes: z.string().trim().max(1000, 'Notes are too long.').optional().or(z.literal('')),

  // When the backend detects a likely accidental double-submission
  // (same farmer/crop/rate created moments ago), it responds 409.
  // Resubmitting with force: true confirms it's a separate transaction.
  force: z.boolean().optional(),
});

// Update: ONLY fields that legitimately change as the physical workflow
// progresses. farmerId, cropId, and purchaseRatePerKg are intentionally
// absent — sending them has no effect, since the service layer never
// reads them from this shape.
export const updatePurchaseSchema = z.object({
  quality: z.string().trim().max(100, 'Quality/grade is too long.').optional().or(z.literal('')),

  estimatedQuantityKg: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number()
      .positive('Estimated quantity must be greater than zero.')
      .optional()
  ),

  actualQuantityKg: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number()
      .positive('Actual quantity must be greater than zero.')
      .optional()
  ),

  numberOfBags: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number()
      .int('Number of bags must be a whole number.')
      .positive('Number of bags must be greater than zero.')
      .optional()
  ),

  bagWeightKg: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().positive('Bag weight must be greater than zero.').optional()
  ),

  advanceAmount: z.coerce.number().min(0, 'Advance amount cannot be negative.').optional(),

  purchaseDate: z.coerce.date({ message: 'Enter a valid purchase date.' }).optional(),

  notes: z.string().trim().max(1000, 'Notes are too long.').optional().or(z.literal('')),
});

export const updatePurchaseStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'COLLECTED', 'AT_WAREHOUSE', 'COMPLETED', 'CANCELLED'], {
    message: 'Invalid purchase status.',
  }),
});

export const listPurchasesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(), // matches purchase number
  farmerId: uuidSchema.optional(),
  cropId: uuidSchema.optional(),
  status: z
    .enum(['PENDING', 'CONFIRMED', 'COLLECTED', 'AT_WAREHOUSE', 'COMPLETED', 'CANCELLED'])
    .optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>;
export type UpdatePurchaseStatusInput = z.infer<typeof updatePurchaseStatusSchema>;
export type ListPurchasesQuery = z.infer<typeof listPurchasesQuerySchema>;
