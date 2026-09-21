import { z } from 'zod';
import { emptyStringToUndefined } from './shared';

const uuidSchema = z.string().uuid('Invalid ID format.');

// OUT movement — "crop dispatched for sale". Any logged-in user can
// record this, but it's checked against available stock server-side.
export const createDispatchSchema = z.object({
  warehouseId: uuidSchema.optional(), // optional: defaults to the single main warehouse
  cropId: uuidSchema,
  quantityKg: z.coerce
    .number({ message: 'Quantity must be a number.' })
    .positive('Quantity must be greater than zero.'),
  numberOfBags: z.preprocess(emptyStringToUndefined, z.coerce.number().int().positive().optional()),
  movementDate: z.coerce.date({ message: 'Enter a valid date.' }),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});

// ADJUSTMENT movement — OWNER only. quantityKg may be negative (e.g.
// -50 to record spoilage) or positive (e.g. correcting an undercount).
export const createAdjustmentSchema = z.object({
  warehouseId: uuidSchema.optional(),
  cropId: uuidSchema,
  quantityKg: z.coerce
    .number({ message: 'Quantity must be a number.' })
    .refine((val) => val !== 0, 'Adjustment quantity cannot be zero.'),
  numberOfBags: z.coerce.number().int().optional(),
  movementDate: z.coerce.date({ message: 'Enter a valid date.' }),
  notes: z
    .string()
    .trim()
    .min(1, 'Please explain the reason for this adjustment.')
    .max(1000),
});

export const listMovementsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().trim().optional(),
  warehouseId: uuidSchema.optional(),
  cropId: uuidSchema.optional(),
  movementType: z.enum(['IN', 'OUT', 'ADJUSTMENT']).optional(),
  referenceType: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const stockQuerySchema = z.object({
  warehouseId: uuidSchema.optional(),
  cropId: uuidSchema.optional(),
});

export type CreateDispatchInput = z.infer<typeof createDispatchSchema>;
export type CreateAdjustmentInput = z.infer<typeof createAdjustmentSchema>;
export type ListMovementsQuery = z.infer<typeof listMovementsQuerySchema>;
export type StockQuery = z.infer<typeof stockQuerySchema>;
