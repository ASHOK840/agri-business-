import { z } from 'zod';

const uuidSchema = z.string().uuid('Invalid ID format.');

// WeighingRecord is create + read ONLY — see the schema.prisma comment.
// A re-weigh or correction is a new record, never an edit of an old one.
export const createWeighingRecordSchema = z.object({
  purchaseId: uuidSchema,

  numberOfBags: z.coerce
    .number({ message: 'Number of bags must be a number.' })
    .int('Number of bags must be a whole number.')
    .positive('Number of bags must be greater than zero.'),

  // Optional on input — if omitted, the service fills it in from the
  // purchase's current bagWeightKg.
  standardBagWeightKg: z.coerce
    .number()
    .positive('Standard bag weight must be greater than zero.')
    .optional(),

  actualWeightKg: z.coerce
    .number({ message: 'Actual weight must be a number.' })
    .positive('Actual weight must be greater than zero.'),

  weighingDate: z.coerce.date({ message: 'Enter a valid weighing date.' }),

  notes: z.string().trim().max(1000, 'Notes are too long.').optional().or(z.literal('')),
});

export const listWeighingRecordsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  purchaseId: uuidSchema.optional(),
});

export type CreateWeighingRecordInput = z.infer<typeof createWeighingRecordSchema>;
export type ListWeighingRecordsQuery = z.infer<typeof listWeighingRecordsQuerySchema>;
