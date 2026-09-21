import { z } from 'zod';

const uuidSchema = z.string().uuid('Invalid ID format.');

const baseFields = {
  purchaseId: uuidSchema,
  buyerId: uuidSchema.optional().or(z.literal('')),
  qualityStatusId: uuidSchema,
  grade: z.string().trim().max(100).optional().or(z.literal('')),
  remarks: z.string().trim().max(1000).optional().or(z.literal('')),
  moisturePercentage: z.coerce
    .number()
    .min(0, 'Moisture percentage cannot be negative.')
    .max(100, 'Moisture percentage cannot exceed 100.')
    .optional(),
  buyerRemarks: z.string().trim().max(1000).optional().or(z.literal('')),
  priceAdjustment: z.coerce.number().optional(),
  rejectionReason: z.string().trim().max(1000).optional().or(z.literal('')),
  assessmentDate: z.coerce.date({ message: 'Enter a valid assessment date.' }),
};

export const createQualityRecordSchema = z.object(baseFields);
export const updateQualityRecordSchema = z.object(baseFields);

export const listQualityRecordsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  purchaseId: uuidSchema.optional(),
  buyerId: uuidSchema.optional(),
  qualityStatusId: uuidSchema.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type CreateQualityRecordInput = z.infer<typeof createQualityRecordSchema>;
export type UpdateQualityRecordInput = z.infer<typeof updateQualityRecordSchema>;
export type ListQualityRecordsQuery = z.infer<typeof listQualityRecordsQuerySchema>;
