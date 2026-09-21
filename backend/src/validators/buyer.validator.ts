import { z } from 'zod';

const phonePattern = /^[0-9+\-\s()]{7,15}$/;
const buyerCodePattern = /^[A-Za-z0-9\-]{2,20}$/;

export const createBuyerSchema = z.object({
  buyerCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(buyerCodePattern, 'Buyer code must be 2-20 letters, numbers or hyphens.')
    .optional()
    .or(z.literal('')),

  companyName: z
    .string()
    .trim()
    .min(2, 'Company name must be at least 2 characters.')
    .max(200, 'Company name is too long.'),

  contactPerson: z
    .string()
    .trim()
    .max(200, 'Contact person name is too long.')
    .optional()
    .or(z.literal('')),

  phone: z
    .string()
    .trim()
    .regex(phonePattern, 'Enter a valid phone number.')
    .optional()
    .or(z.literal('')),

  address: z.string().trim().max(500, 'Address is too long.').optional().or(z.literal('')),
});

export const updateBuyerSchema = createBuyerSchema;

export const updateBuyerStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    message: 'Status must be ACTIVE or INACTIVE.',
  }),
});

export const listBuyersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export type CreateBuyerInput = z.infer<typeof createBuyerSchema>;
export type UpdateBuyerInput = z.infer<typeof updateBuyerSchema>;
export type UpdateBuyerStatusInput = z.infer<typeof updateBuyerStatusSchema>;
export type ListBuyersQuery = z.infer<typeof listBuyersQuerySchema>;
