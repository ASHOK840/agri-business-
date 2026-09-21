import { z } from 'zod';

const phonePattern = /^[0-9+\-\s()]{7,15}$/;
const staffCodePattern = /^[A-Za-z0-9\-]{2,20}$/;

export const createStaffSchema = z.object({
  staffCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(staffCodePattern, 'Staff code must be 2-20 letters, numbers or hyphens.')
    .optional()
    .or(z.literal('')),

  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(200, 'Name is too long.'),

  phone: z
    .string()
    .trim()
    .regex(phonePattern, 'Enter a valid phone number.')
    .optional()
    .or(z.literal('')),
});

export const updateStaffSchema = createStaffSchema;

export const updateStaffStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    message: 'Status must be ACTIVE or INACTIVE.',
  }),
});

export const listStaffQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type UpdateStaffStatusInput = z.infer<typeof updateStaffStatusSchema>;
export type ListStaffQuery = z.infer<typeof listStaffQuerySchema>;
