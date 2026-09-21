import { z } from 'zod';
import { emptyStringToUndefined } from './shared';

const uuidSchema = z.string().uuid('Invalid ID format.');

export const createSaleSchema = z.object({
  buyerId: uuidSchema,
  cropId: uuidSchema,
  warehouseId: uuidSchema.optional(),

  quality: z.string().trim().max(100, 'Quality/grade is too long.').optional().or(z.literal('')),

  numberOfBags: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({ message: 'Number of bags must be a number.' })
      .int('Number of bags must be a whole number.')
      .positive('Number of bags must be greater than zero.')
      .optional()
  ),

  dispatchWeightKg: z.coerce
    .number({ message: 'Dispatch weight must be a number.' })
    .positive('Dispatch weight must be greater than zero.')
    .max(100000, 'Dispatch weight seems unreasonably high.'),

  sellingRatePerKg: z.coerce
    .number({ message: 'Selling rate must be a number.' })
    .positive('Selling rate must be greater than zero.')
    .max(100000, 'Selling rate seems unreasonably high.'),

  saleDate: z.coerce.date({ message: 'Enter a valid sale date.' }),

  status: z
    .enum(['PENDING', 'CONFIRMED', 'LOADED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'], {
      message: 'Invalid sale status.',
    })
    .optional()
    .default('PENDING'),

  notes: z.string().trim().max(1000, 'Notes are too long.').optional().or(z.literal('')),

  // See purchase.validator.ts — same accidental-double-submission guard.
  force: z.boolean().optional(),
});

export const updateSaleStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'LOADED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'], {
    message: 'Invalid sale status.',
  }),
});

export const listSalesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  buyerId: uuidSchema.optional(),
  cropId: uuidSchema.optional(),
  warehouseId: uuidSchema.optional(),
  status: z
    .enum(['PENDING', 'CONFIRMED', 'LOADED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'])
    .optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleStatusInput = z.infer<typeof updateSaleStatusSchema>;
export type ListSalesQuery = z.infer<typeof listSalesQuerySchema>;
