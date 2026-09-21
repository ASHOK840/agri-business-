import { z } from 'zod';

export const reportTypeEnum = z.enum([
  'farmer',
  'crop-purchase',
  'crop-sales',
  'inventory',
  'buyer',
  'farmer-payment',
  'buyer-payment',
  'transport-expense',
  'labour',
  'expense',
  'profit-loss',
  'weight-loss',
  'quality-rejection',
]);

export const reportQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  farmerId: z.string().uuid('Invalid farmer id.').optional(),
  cropId: z.string().uuid('Invalid crop id.').optional(),
  buyerId: z.string().uuid('Invalid buyer id.').optional(),
  staffId: z.string().uuid('Invalid staff id.').optional(),
  status: z.string().trim().max(50).optional(),
  format: z.enum(['json', 'csv']).optional().default('json'),
});

export type ReportType = z.infer<typeof reportTypeEnum>;
export type ReportQuery = z.infer<typeof reportQuerySchema>;
