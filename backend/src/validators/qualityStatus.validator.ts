import { z } from 'zod';

const codePattern = /^[A-Za-z0-9_\-]{2,30}$/;

export const createQualityStatusSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, 'Code is required.')
    .regex(codePattern, 'Code must be 2-30 letters, numbers, underscores or hyphens.'),
  name: z.string().trim().min(1, 'Name is required.').max(100),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  isRejection: z.coerce.boolean().optional().default(false),
  displayOrder: z.coerce.number().int().optional().default(0),
});

export const updateQualityStatusSchema = createQualityStatusSchema;

export const updateQualityStatusStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE'], { message: 'Status must be ACTIVE or INACTIVE.' }),
});

export const listQualityStatusesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export type CreateQualityStatusInput = z.infer<typeof createQualityStatusSchema>;
export type UpdateQualityStatusInput = z.infer<typeof updateQualityStatusSchema>;
export type ListQualityStatusesQuery = z.infer<typeof listQualityStatusesQuerySchema>;
