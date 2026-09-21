import { z } from 'zod';
import { emptyStringToUndefined } from './shared';

const uuidSchema = z.string().uuid('Invalid ID format.');

const baseFields = {
  direction: z.enum(['FARMER_TO_WAREHOUSE', 'WAREHOUSE_TO_BUYER'], {
    message: 'Direction must be FARMER_TO_WAREHOUSE or WAREHOUSE_TO_BUYER.',
  }),
  transporterId: uuidSchema,
  driverId: uuidSchema.optional().or(z.literal('')),
  vehicleId: uuidSchema.optional().or(z.literal('')),
  purchaseId: uuidSchema.optional().or(z.literal('')),
  buyerId: uuidSchema.optional().or(z.literal('')),
  cropId: uuidSchema,
  // Hands this trip to a specific TRANSPORTATION login so their
  // simplified "My Trips" screen shows only their own assigned work.
  assignedUserId: uuidSchema.optional().or(z.literal('')),
  fromLocation: z.string().trim().min(1, 'From location is required.').max(200),
  toLocation: z.string().trim().min(1, 'To location is required.').max(200),
  numberOfBags: z.preprocess(emptyStringToUndefined, z.coerce.number().int().positive().optional()),
  weightKg: z.preprocess(emptyStringToUndefined, z.coerce.number().positive().optional()),
  transportCost: z.coerce
    .number({ message: 'Transport cost must be a number.' })
    .min(0, 'Transport cost cannot be negative.'),
  transportDate: z.coerce.date({ message: 'Enter a valid transport date.' }),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
};

export const createTransportRecordSchema = z
  .object(baseFields)
  .refine((data) => data.direction !== 'FARMER_TO_WAREHOUSE' || !!data.purchaseId, {
    message: 'A purchase is required for Farmer → Warehouse transport.',
    path: ['purchaseId'],
  })
  .refine((data) => data.direction !== 'WAREHOUSE_TO_BUYER' || !!data.buyerId, {
    message: 'A buyer is required for Warehouse → Buyer transport.',
    path: ['buyerId'],
  });

export const updateTransportRecordSchema = z.object({
  driverId: uuidSchema.optional().or(z.literal('')),
  vehicleId: uuidSchema.optional().or(z.literal('')),
  assignedUserId: uuidSchema.optional().or(z.literal('')),
  fromLocation: z.string().trim().min(1).max(200).optional(),
  toLocation: z.string().trim().min(1).max(200).optional(),
  numberOfBags: z.preprocess(emptyStringToUndefined, z.coerce.number().int().positive().optional()),
  weightKg: z.preprocess(emptyStringToUndefined, z.coerce.number().positive().optional()),
  transportCost: z.coerce.number().min(0, 'Transport cost cannot be negative.').optional(),
  transportDate: z.coerce.date({ message: 'Enter a valid transport date.' }).optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const updateTransportStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'], {
    message: 'Invalid transport status.',
  }),
});

export const listTransportQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  direction: z.enum(['FARMER_TO_WAREHOUSE', 'WAREHOUSE_TO_BUYER']).optional(),
  purchaseId: uuidSchema.optional(),
  farmerId: uuidSchema.optional(),
  buyerId: uuidSchema.optional(),
  cropId: uuidSchema.optional(),
  status: z.enum(['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type CreateTransportRecordInput = z.infer<typeof createTransportRecordSchema>;
export type UpdateTransportRecordInput = z.infer<typeof updateTransportRecordSchema>;
export type UpdateTransportStatusInput = z.infer<typeof updateTransportStatusSchema>;
export type ListTransportQuery = z.infer<typeof listTransportQuerySchema>;
