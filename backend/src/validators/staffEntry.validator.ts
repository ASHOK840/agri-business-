import { z } from 'zod';

const uuidSchema = z.string().uuid('Invalid ID format.');
const phonePattern = /^[0-9+\-\s()]{7,15}$/;

// The entire input shape for the simplified Staff "Add Farmer Entry"
// screen — deliberately just farmer + crop + quantity + bags. Everything
// else (purchase rate, weighing math, inventory stock-in) is filled in
// automatically by staffEntry.service using the existing business logic.
export const createStaffEntrySchema = z
  .object({
    // Either select an existing farmer...
    farmerId: uuidSchema.optional(),

    // ...or enter a new one directly on this screen.
    farmerName: z.string().trim().min(2, 'Enter the farmer name.').max(200).optional(),
    village: z.string().trim().max(200).optional().or(z.literal('')),
    phone: z.string().trim().regex(phonePattern, 'Enter a valid phone number.').optional().or(z.literal('')),

    cropId: uuidSchema,

    quantityKg: z.coerce
      .number({ message: 'Enter the quantity.' })
      .positive('Quantity must be greater than zero.'),

    numberOfBags: z.coerce
      .number({ message: 'Enter the number of bags.' })
      .int('Number of bags must be a whole number.')
      .positive('Number of bags must be greater than zero.'),
  })
  .refine((data) => !!data.farmerId || !!data.farmerName, {
    message: 'Select an existing farmer or enter a farmer name.',
    path: ['farmerName'],
  });

export const listMyStaffEntriesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateStaffEntryInput = z.infer<typeof createStaffEntrySchema>;
export type ListMyStaffEntriesQuery = z.infer<typeof listMyStaffEntriesQuerySchema>;
